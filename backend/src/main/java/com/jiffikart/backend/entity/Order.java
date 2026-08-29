package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "shop_id")
    private Shop shop;

    private Double total;
    
    @Column(name = "payment_provider")
    private String paymentProvider; // e.g., PHONEPE

    @Column(name = "payment_status")
    private String paymentStatus; // PENDING, SUCCESS, FAILED

    @Column(name = "order_status")
    private String orderStatus; // CREATED, CONFIRMED, CANCELLED

    @Column(name = "transaction_id")
    private String transactionId; // Provider's Txn ID

    @Column(name = "merchant_transaction_id")
    private String merchantTransactionId; // Our unique ID (Generated)

    private LocalDateTime date;
    private String status; // Kept for backward compatibility if needed, or mapping to orderStatus
    private String address;
    
    @Column(name = "delivery_time_minutes")
    private Integer deliveryTimeMinutes;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> items;

    // Audit fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (date == null) date = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    private ReturnRequest returnRequest;

    private String zohoInvoiceId;
}
