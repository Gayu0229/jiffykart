package com.jiffikart.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;
 
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
 
    @Autowired
    private com.jiffikart.backend.repository.UserRepository userRepository;
 
    @Autowired
    private com.jiffikart.backend.repository.ShopRepository shopRepository;
 
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthTokenFilter.class);


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip OPTIONS preflight requests
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT validation entirely for public APIs
        String path = request.getRequestURI();
        System.out.println("REQUEST PATH: " + path);
        if (path.startsWith("/api/auth/") ||
            path.startsWith("/api/public") ||
            path.startsWith("/api/shops") ||
            path.startsWith("/api/banners") ||
            path.startsWith("/api/notifications") ||
            path.startsWith("/api/customer/products") ||
            path.startsWith("/api/customer/shops") ||
            path.startsWith("/ws")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                if (jwtUtils.validateJwtToken(jwt)) {
                    String phone = jwtUtils.getUserNameFromJwtToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(phone);

                    // GOLDEN RULE ENFORCEMENT: reject disabled/unverified users
                    // (skip for auth endpoints so they can still verify OTP)
                    String requestURI = request.getRequestURI();
                    boolean isAuthEndpoint = requestURI.contains("/api/auth") 
                                            || requestURI.contains("/api/public")
                                            || requestURI.contains("/api/customer/reviews")
                                            || requestURI.contains("/api/customer/products")
                                            || requestURI.equals("/api/users/profile")
                                            || requestURI.equals("/api/users/profile-image")
                                            || requestURI.equals("/api/users/update")
                                            || requestURI.equals("/api/users/change-email")
                                            || requestURI.equals("/api/users/change-phone")
                                            || requestURI.equals("/api/users/verify-contact-change")
                                            || (requestURI.startsWith("/api/users/") && requestURI.endsWith("/addresses")); // Allow address management
                    
                    if (!userDetails.isEnabled() && !isAuthEndpoint) {
                        logger.error("403 BLOCK: User {} is NOT enabled. Authorities: {}", phone, userDetails.getAuthorities());
                        
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"success\": false, \"message\": \"Account verification required. Your account is currently disabled.\"}");
                        return;
                    }
 
                    // VENDOR STATUS ENFORCEMENT: reject blocked/rejected shops
                    if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_VENDOR"))) {
                        Long userId = Long.parseLong(userDetails.getUsername());
                        com.jiffikart.backend.entity.User user = userRepository.findById(userId).orElse(null);
                        if (user != null) {
                            com.jiffikart.backend.entity.Shop shop = shopRepository.findFirstByOwnerOrderByIdAsc(user).orElse(null);
                            if (shop != null) {
                                boolean isRejected = "REJECTED".equals(shop.getApprovalStatus());
                                boolean isInactive = shop.getIsActive() == null || !shop.getIsActive();
                                
                                if (isRejected || isInactive) {
                                    String msg = isRejected ? "Your vendor account has been blocked. Please contact the admin team." 
                                                            : "Your vendor account is currently inactive. Please contact the admin team.";
                                    logger.error("403 BLOCK: Vendor {} shop status: rejected={}, inactive={}", phone, isRejected, isInactive);
                                    
                                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                    response.setContentType("application/json");
                                    response.getWriter().write("{\"success\": false, \"message\": \"" + msg + "\"}");
                                    return;
                                }
                            }
                        }
                    }
 
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Authenticated user: {}", phone);
                } else {
                    logger.warn("Invalid JWT Token: {}", jwt);
                }
            } else {
                logger.trace("No JWT token found in request header");
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": false, \"message\": \"Unauthorized\"}" );
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
