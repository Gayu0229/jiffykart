package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

import java.time.LocalDateTime;

@Entity
@Table(name = "shop_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class ShopReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long shopId;
    
    // In a real app we'd map this to the User entity. For now saving the string name is fine as requested.
    private String userName;
    
    private int rating;
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String comment;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(columnDefinition = "TEXT")
    private List<String> images;

    @Column(columnDefinition = "TEXT")
    private String videoUrl;

    @ElementCollection
    @CollectionTable(name = "shop_review_criteria_ratings", joinColumns = @JoinColumn(name = "shop_review_id"))
    @MapKeyColumn(name = "criteria_name")
    @Column(name = "rating")
    private Map<String, Integer> criteriaRatings;

    private boolean isVerified;
    private String adminReply;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
