package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.CartRequest;
import com.jiffikart.backend.entity.CartItem;
import com.jiffikart.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController 
@RequestMapping("/api/customer/cart")
public class CartController {
    @Autowired
    private CartService cartService;

    @GetMapping
    public List<CartItem> getCart(@RequestParam Long userId) {
        return cartService.getCartByUser(userId);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody CartRequest request) {
        // userId would normally come from token, but for now using request
        cartService.addToCart(request.getUserId(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok().body("{\"success\":true}");
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long id) {
        cartService.removeFromCart(id);
        return ResponseEntity.ok().body("{\"success\":true}");
    }
}
