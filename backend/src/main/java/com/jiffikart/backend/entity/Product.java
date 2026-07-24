package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_status", columnList = "status"),
    @Index(name = "idx_product_is_active", columnList = "isActive"),
    @Index(name = "idx_product_shop", columnList = "shop_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double price;
    private Double originalPrice;
    private Double mrp;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String image;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> images;

    private String category;
    private String subCategory;

    private Double rating;
    private Integer votes;

    private Boolean isBestSeller;
    private String warrantyPeriod;
    private String warrantyType;

    // New lifecycle fields
    @Builder.Default
    private Integer stockQuantity = 0;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean showOnHome = false;

    @Builder.Default
    private Boolean showOnJiffyStreet = false;

    @Builder.Default
    private Boolean showOnJiffyCafe = false;

    private String weight;
    private String dimensions;
    private String material;
    private String rejectionReason;

    @ManyToOne
    @JoinColumn(name = "shop_id")
    @JsonIgnore
    private Shop shop;

    // Expose shop id and name for API responses without full Shop serialization
    @Transient
    public Long getShopId() {
        return shop != null ? shop.getId() : null;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getShopName() {
        return shop != null ? shop.getName() : null;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getVendorName() {
        return shop != null && shop.getOwner() != null ? shop.getOwner().getName() : null;
    }

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ProductStatus status = ProductStatus.DRAFT;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
