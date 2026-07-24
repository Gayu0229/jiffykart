package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;

@Entity
@Table(name = "shops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double rating;
    private String ratingCount;
    private String deliveryTime;
    private String costForTwo;
    private String image;
    private String distance;
    private String location;
    private String area;
    private String city;
    private String state;
    private String pincode;
    private String address;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Approval & Visibility
    @Builder.Default
    @Column(name = "approval_status")
    private String approvalStatus = "PENDING"; // PENDING, APPROVED, REJECTED

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = false; // Vendor can toggle open/closed
    
    @Builder.Default
    private String kycStatus = "PENDING"; // VERIFIED, PENDING, REJECTED
    
    // Branding
    private String bannerUrl;
    private String logoUrl;

    // Contact (Specific to shop/business)
    private String email;
    private String phone;
    
    // Business Details
    private String businessType; // Individual, Proprietorship, Company
    private String category;

    @Column(name = "shop_type")
    private String shopType; // Official, Reseller

    @Enumerated(EnumType.STRING)
    @Column(name = "vendor_type")
    @Builder.Default
    private VendorType vendorType = VendorType.ECOMMERCE;

    // Food Specific
    private String cuisineType;
    private String fssaiNumber;
    private String openingTime;
    private String closingTime;

    // Legal & Financial
    private String gstNumber;
    private String panNumber;
    private String accountHolderName;
    private String bankAccountNumber;
    private String ifscCode;

    @Transient
    private Long productsLive;

    @Builder.Default
    @Transient
    private List<Coupon> activeCoupons = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "owner_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User owner;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "shop_tags", joinColumns = @JoinColumn(name = "shop_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    // KYC Documents
    private String idProofUrl;
    private String businessProofUrl;
    private String addressProofUrl;
    private String cancelledChequeUrl;
    
    // Franchise
    private String franchiseId;

    // Audit
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
