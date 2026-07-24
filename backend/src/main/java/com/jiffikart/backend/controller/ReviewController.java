package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.entity.Review;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.ProductRepository;
import com.jiffikart.backend.repository.ReviewRepository;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/reviews/product")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StatsService statsService;

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

    @PostMapping
    public ResponseEntity<?> submitProductReview(@RequestBody Map<String, Object> payload, Authentication authentication) {
        System.out.println("DEBUG: submitProductReview called with payload: " + payload);
        try {
            User user = getAuthenticatedUser(authentication);
            System.out.println("DEBUG: User identified: " + user.getId() + " - " + user.getName());
            
            // Safer numeric parsing for JSON
            Long productId = ((Number) payload.get("productId")).longValue();
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            
            Double rating = ((Number) payload.get("rating")).doubleValue();
            String comment = String.valueOf(payload.getOrDefault("comment", ""));
            String title = String.valueOf(payload.getOrDefault("title", ""));
            String videoUrl = String.valueOf(payload.getOrDefault("videoUrl", ""));
            List<String> images = (List<String>) payload.getOrDefault("images", List.of());
            Map<String, Integer> criteriaRatings = (Map<String, Integer>) payload.getOrDefault("criteriaRatings", Map.of());

            Review review = Review.builder()
                    .product(product)
                    .shop(product.getShop())
                    .userId(user.getId())
                    .userName(user.getName() != null && !user.getName().isEmpty() ? user.getName() : "Verified User")
                    .rating(rating)
                    .comment(comment)
                    .title(title)
                    .videoUrl(videoUrl)
                    .images(images)
                    .criteriaRatings(criteriaRatings)
                    .date(LocalDateTime.now())
                    .isVerified(true)
                    .helpfulCount(0)
                    .build();

            Review savedReview = reviewRepository.save(review);
            System.out.println("DEBUG: Review saved with ID: " + savedReview.getId());

            // Update product rating and votes
            updateProductRating(product);

            // Update public stats
            try {
                statsService.updateAndBroadcast();
            } catch (Exception e) {
                System.out.println("DEBUG: Stats broadcast failed (non-critical): " + e.getMessage());
            }

            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            System.out.println("ERROR: submitProductReview failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> editReview(@PathVariable Long reviewId, @RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            if (!review.getUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Unauthorized to edit this review");
            }

            if (payload.containsKey("rating")) {
                review.setRating(((Number) payload.get("rating")).doubleValue());
            }
            if (payload.containsKey("comment")) {
                review.setComment(String.valueOf(payload.get("comment")));
            }
            if (payload.containsKey("title")) {
                review.setTitle(String.valueOf(payload.get("title")));
            }
            if (payload.containsKey("videoUrl")) {
                review.setVideoUrl(String.valueOf(payload.get("videoUrl")));
            }
            if (payload.containsKey("images")) {
                review.setImages((List<String>) payload.get("images"));
            }
            if (payload.containsKey("criteriaRatings")) {
                review.setCriteriaRatings((Map<String, Integer>) payload.get("criteriaRatings"));
            }

            Review updatedReview = reviewRepository.save(review);
            updateProductRating(review.getProduct());

            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{productId}/summary")
    public ResponseEntity<?> getReviewSummary(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProduct_Id(productId);
        int total = reviews.size();
        Map<Integer, Long> ratingCounts = new java.util.HashMap<>();
        for (int i = 1; i <= 5; i++) ratingCounts.put(i, 0L);

        Map<String, Double> criteriaAverages = new java.util.HashMap<>();
        Map<String, Integer> criteriaCounts = new java.util.HashMap<>();

        for (Review r : reviews) {
            int star = (int) Math.round(r.getRating());
            if (star >= 1 && star <= 5) {
                ratingCounts.put(star, ratingCounts.get(star) + 1);
            }

            if (r.getCriteriaRatings() != null) {
                for (Map.Entry<String, Integer> entry : r.getCriteriaRatings().entrySet()) {
                    criteriaAverages.put(entry.getKey(), criteriaAverages.getOrDefault(entry.getKey(), 0.0) + entry.getValue());
                    criteriaCounts.put(entry.getKey(), criteriaCounts.getOrDefault(entry.getKey(), 0) + 1);
                }
            }
        }

        for (String key : criteriaAverages.keySet()) {
            criteriaAverages.put(key, criteriaAverages.get(key) / criteriaCounts.get(key));
        }

        return ResponseEntity.ok(Map.of(
            "totalReviews", total,
            "ratingCounts", ratingCounts,
            "criteriaAverages", criteriaAverages
        ));
    }

    @GetMapping("/{productId}")
    public List<Review> getProductReviews(@PathVariable Long productId) {
        return reviewRepository.findByProduct_Id(productId);
    }

    @GetMapping("/shop/{shopId}")
    public List<Review> getShopProductReviews(@PathVariable Long shopId) {
        return reviewRepository.findByShop_Id(shopId);
    }

    private void updateProductRating(Product product) {
        List<Review> reviews = reviewRepository.findByProduct_Id(product.getId());
        if (reviews.isEmpty()) return;

        double sum = 0;
        for (Review r : reviews) {
            sum += r.getRating();
        }
        double avg = sum / reviews.size();
        
        product.setRating(avg);
        product.setVotes(reviews.size());
        productRepository.save(product);
    }
}
