package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "shop_id")
    private Shop shop;

    private String userName;
    private Double rating;
    private String comment;
    private LocalDateTime date;
    private String title;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(columnDefinition = "TEXT")
    private List<String> images;

    private String videoUrl;

    @ElementCollection
    @CollectionTable(name = "review_criteria_ratings", joinColumns = @JoinColumn(name = "review_id"))
    @MapKeyColumn(name = "criteria_name")
    @Column(name = "rating")
    private Map<String, Integer> criteriaRatings;

    private Long userId;

    private Boolean isVerified;
    private Integer helpfulCount;
    private String adminReply;
}
