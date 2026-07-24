package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_applications", uniqueConstraints = {
    @UniqueConstraint(columnNames = "user_id", name = "uk_seller_application_user")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String shopName;

    @Column(columnDefinition = "TEXT")
    private String businessDescription;

    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "vendor_type")
    @Builder.Default
    private VendorType vendorType = VendorType.ECOMMERCE;

    // Food Specific
    private String cuisineType;
    private String fssaiNumber;
    private String openingTime;
    private String closingTime;

    // Business Details
    private String businessType;
    private String category;
    private boolean hasGst;
    private String gstNumber;
    
    private String address;
    private String area;
    private String city;
    private String state;
    private String pincode;

    // KYC
    private String panNumber;
    private String idProofUrl;
    private String businessProofUrl;
    private String addressProofUrl;
    
    // Bank Details
    private String accountHolderName;
    private String bankAccountNumber;
    private String ifscCode;
    private String cancelledChequeUrl;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
