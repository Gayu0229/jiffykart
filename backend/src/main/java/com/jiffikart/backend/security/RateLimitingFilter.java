package com.jiffikart.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

/**
 * Filter to rate limit incoming reservation and authentication API requests.
 */
@Component
@Order(1) // Executed very early in filter chain
public class RateLimitingFilter implements Filter {

    private final RateLimiter bookingLimiter;
    private final RateLimiter authLimiter;

    public RateLimitingFilter(
            @Value("${jiffikart.rate-limit.booking-capacity:15}") long bookingCap,
            @Value("${jiffikart.rate-limit.booking-refill-rate:5}") long bookingRate,
            @Value("${jiffikart.rate-limit.auth-capacity:10}") long authCap,
            @Value("${jiffikart.rate-limit.auth-refill-rate:3}") long authRate) {
        
        this.bookingLimiter = new RateLimiter(bookingCap, bookingRate);
        this.authLimiter = new RateLimiter(authCap, authRate);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (request instanceof HttpServletRequest && response instanceof HttpServletResponse) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;

            String path = httpRequest.getRequestURI();
            String clientIp = getClientIp(httpRequest);

            if (path.startsWith("/api/bookings")) {
                if (!bookingLimiter.tryConsume(clientIp)) {
                    sendErrorResponse(httpResponse, "Too many reservation requests. Please try again in a minute.");
                    return;
                }
            } else if (path.startsWith("/api/auth")) {
                if (!authLimiter.tryConsume(clientIp)) {
                    sendErrorResponse(httpResponse, "Too many login or OTP attempts. Please wait before trying again.");
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429); // Too Many Requests
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"429 Too Many Requests\", \"message\": \"" + message + "\"}");
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void destroy() {}
}
