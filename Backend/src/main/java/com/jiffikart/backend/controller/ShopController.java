package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.entity.ProductStatus;
import com.jiffikart.backend.service.ShopService;
import com.jiffikart.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.springframework.security.core.Authentication;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.entity.ShopReview;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
public class ShopController {
    @Autowired
    private ShopService shopService;

    @Autowired
    private ProductService productService;

    @Autowired
    private com.jiffikart.backend.repository.CouponRepository couponRepository;

    @Autowired
    private com.jiffikart.backend.repository.ShopReviewRepository shopReviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.jiffikart.backend.repository.ShopRepository shopRepository;

    @GetMapping("/shops")
    public ResponseEntity<List<Shop>> getShops(
            @RequestParam(required = false) String city, 
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String vendorType) {
        // Treat blank strings as null
        if (city != null && city.isBlank()) city = null;
        if (area != null && area.isBlank()) area = null;
        if (category != null && category.isBlank()) category = null;

        List<Shop> shops;
        if (city != null && area != null && category != null) {
            shops = shopService.getShopsByCityAndAreaAndCategory(city, area, category);
        } else if (city != null && area != null) {
            shops = shopService.getShopsByCityAndArea(city, area);
        } else if (city != null && category != null) {
            shops = shopService.getShopsByCityAndCategory(city, category);
        } else if (city != null) {
            shops = shopService.getShopsByCity(city);
        } else if (category != null) {
            shops = shopService.getShopsByCategory(category);
        } else {
            shops = shopService.getAllShops();
        }

        // Apply vendorType filter if provided
        if (vendorType != null && !vendorType.isEmpty()) {
            try {
                com.jiffikart.backend.entity.VendorType type = com.jiffikart.backend.entity.VendorType.valueOf(vendorType.toUpperCase());
                shops = shops.stream()
                        .filter(s -> s.getVendorType() == type)
                        .toList();
            } catch (IllegalArgumentException e) {
                // Ignore invalid vendorType
            }
        }

        // Filter and return only approved and active shops for customers
        // Also exclude STREET_HUB vendors from general listings (they are product-only in their own section)
        List<Shop> activeShops = shops.stream()
                .filter(s -> "APPROVED".equalsIgnoreCase(s.getApprovalStatus()) && Boolean.TRUE.equals(s.getIsActive()))
                .filter(s -> s.getVendorType() != com.jiffikart.backend.entity.VendorType.STREET_HUB)
                .toList();

        // Populate active coupons for each shop
        activeShops.forEach(shop -> {
            shop.setActiveCoupons(couponRepository.findByShopIdAndIsActiveTrue(shop.getId()));
        });

        return ResponseEntity.ok(activeShops);
    }

    @GetMapping("/shops/{id}")
    public ResponseEntity<?> getShopDetail(
            @PathVariable Long id,
            @RequestParam(required = false) java.util.UUID zoneId) {
        return shopService.getShopById(id)
                .filter(shop -> "APPROVED".equalsIgnoreCase(shop.getApprovalStatus()) && Boolean.TRUE.equals(shop.getIsActive()))
                .map(shop -> {
                    List<Product> products = productService.getProductsByShopAndStatus(shop, ProductStatus.PUBLISHED);
                    if (zoneId != null) {
                        products.forEach(p -> productService.applyTieredPricingByZoneId(p, zoneId));
                    }
                    Map<String, Object> response = new HashMap<>();
                    response.put("shop", shop);
                    response.put("products", products);
                    return ResponseEntity.ok((Object) response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/shops/{id}")
    public ResponseEntity<Shop> getShopById(@PathVariable Long id) {
        return shopService.getShopById(id)
                .filter(shop -> "APPROVED".equalsIgnoreCase(shop.getApprovalStatus()) && Boolean.TRUE.equals(shop.getIsActive()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Swiggy-style: Products for a specific shop ───
    @GetMapping("/shops/{shopId}/products")
    public ResponseEntity<?> getShopProducts(
            @PathVariable Long shopId,
            @RequestParam(required = false) java.util.UUID zoneId) {
        return shopService.getShopById(shopId)
                .filter(shop -> "APPROVED".equalsIgnoreCase(shop.getApprovalStatus()) && Boolean.TRUE.equals(shop.getIsActive()))
                .map(shop -> {
                    List<Product> products = productService.getProductsByShopAndStatus(shop, ProductStatus.PUBLISHED);
                    // Filter only active products
                    List<Product> activeProducts = products.stream()
                            .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                            .toList();
                    
                    if (zoneId != null) {
                        activeProducts.forEach(p -> productService.applyTieredPricingByZoneId(p, zoneId));
                    }
                    
                    return ResponseEntity.ok((Object) activeProducts);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/shops/{shopId}/reviews")
    public List<com.jiffikart.backend.entity.ShopReview> getShopReviews(@PathVariable Long shopId) {
        return shopReviewRepository.findByShopIdOrderByCreatedAtDesc(shopId);
    }

    @PostMapping("/customer/shops/{shopId}/reviews")
    public ResponseEntity<?> submitShopReview(
            @PathVariable Long shopId,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            Shop shop = shopService.getShopById(shopId)
                    .orElseThrow(() -> new RuntimeException("Shop not found"));

            Integer rating = ((Number) payload.get("rating")).intValue();
            String comment = String.valueOf(payload.getOrDefault("comment", ""));
            String title = String.valueOf(payload.getOrDefault("title", ""));
            String videoUrl = String.valueOf(payload.getOrDefault("videoUrl", ""));
            List<String> images = (List<String>) payload.getOrDefault("images", List.of());
            Map<String, Integer> criteriaRatings = (Map<String, Integer>) payload.getOrDefault("criteriaRatings", Map.of());

            ShopReview review = ShopReview.builder()
                    .shopId(shopId)
                    .userName(user.getName() != null && !user.getName().isEmpty() ? user.getName() : "Verified User")
                    .rating(rating)
                    .comment(comment)
                    .title(title)
                    .videoUrl(videoUrl)
                    .images(images)
                    .criteriaRatings(criteriaRatings)
                    .isVerified(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            ShopReview savedReview = shopReviewRepository.save(review);
            
            // Update Shop rating/count
            updateShopRating(shop);

            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private void updateShopRating(Shop shop) {
        List<ShopReview> reviews = shopReviewRepository.findByShopIdOrderByCreatedAtDesc(shop.getId());
        if (reviews.isEmpty()) return;

        double sum = 0;
        for (ShopReview r : reviews) {
            sum += r.getRating();
        }
        double avg = sum / reviews.size();
        
        shop.setRating(avg);
        shop.setRatingCount(String.valueOf(reviews.size()));
        shopRepository.save(shop);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String identifier = authentication.getName();
        try {
            Long userId = Long.parseLong(identifier);
            return userRepository.findById(userId)
                    .or(() -> userRepository.findFirstByPhoneOrderByIdAsc(identifier))
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }
}
