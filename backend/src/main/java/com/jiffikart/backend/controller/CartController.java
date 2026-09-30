package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.CartRequest;
import com.jiffikart.backend.entity.CartItem;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController 
@RequestMapping("/api/customer/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam(required = false) Long userId) {
        Long resolvedUserId = resolveUserId(userId);
        if (resolvedUserId == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(cartService.getCartByUser(resolvedUserId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody CartRequest request) {
        Long userId = resolveUserId(request != null ? request.getUserId() : null);
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID is required. Please log in."));
        }
        if (request == null || request.getProductId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Product ID is required."));
        }
        int quantity = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;
        try {
            cartService.addToCart(userId, request.getProductId(), quantity);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to add to cart: " + e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateCart(@RequestBody CartRequest request) {
        Long userId = resolveUserId(request != null ? request.getUserId() : null);
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID is required. Please log in."));
        }
        if (request == null || request.getProductId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Product ID is required."));
        }
        int quantity = request.getQuantity() != null ? request.getQuantity() : 0;
        try {
            cartService.updateCartItem(userId, request.getProductId(), quantity);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update cart: " + e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long id) {
        try {
            cartService.removeFromCart(id);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to remove item: " + e.getMessage()));
        }
    }

    private Long resolveUserId(Long passedUserId) {
        if (passedUserId != null) {
            return passedUserId;
        }
        try {
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                String name = SecurityContextHolder.getContext().getAuthentication().getName();
                if (name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name)) {
                    try {
                        return Long.parseLong(name);
                    } catch (NumberFormatException e) {
                        User user = userRepository.findByEmail(name)
                                .orElseGet(() -> userRepository.findFirstByPhoneOrderByIdAsc(name).orElse(null));
                        if (user != null) {
                            return user.getId();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}

