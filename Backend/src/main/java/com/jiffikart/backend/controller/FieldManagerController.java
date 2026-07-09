package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.service.ShopService;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/field-manager")
@PreAuthorize("hasRole('FIELD_MANAGER')")
public class FieldManagerController {

    @Autowired
    private ShopService shopService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return userRepository.findById(Long.parseLong(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier)) 
                    .orElseThrow(() -> new RuntimeException("User not found with identifier: " + identifier));
        }
    }

    @GetMapping("/shops")
    public List<Shop> getAssignedShops() {
        return shopService.getShopsForUser(getCurrentUser());
    }

    @GetMapping("/vendors")
    public List<User> getAssignedVendors() {
        return shopService.getShopsForUser(getCurrentUser()).stream()
                .map(Shop::getOwner)
                .distinct()
                .collect(Collectors.toList());
    }
}
