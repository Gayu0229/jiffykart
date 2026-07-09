package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String planName;

    @Column(nullable = false)
    @Builder.Default
    private Double price = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Integer durationDays = 30;

    private Double freeDeliveryAbove;

    @Builder.Default
    private Boolean freeDeliveryAll = false;

    @Builder.Default
    private Boolean priorityDelivery = false;

    @Builder.Default
    private Double cashbackPercent = 0.0;

    private String description;

    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    private LocalDateTime createdAt;
}
