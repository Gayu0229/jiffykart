package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.CartItem;
import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.CartItemRepository;
import com.jiffikart.backend.repository.ProductRepository;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CartService {
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    public List<CartItem> getCartByUser(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public void addToCart(Long userId, Long productId, int quantity) {
        User user = userRepository.findById(userId).orElseThrow();
        Product product = productRepository.findById(productId).orElseThrow();

        CartItem item = CartItem.builder()
                .user(user)
                .product(product)
                .quantity(quantity)
                .build();
        cartItemRepository.save(item);
    }

    public void removeFromCart(Long itemId) {
        cartItemRepository.deleteById(itemId);
    }
}
