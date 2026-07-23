package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_waitlists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Waitlist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    @Column(name = "seating_area", nullable = false)
    @Builder.Default
    private String seatingArea = "INDOOR";

    @Column(name = "queue_position", nullable = false)
    private Integer queuePosition;

    @Column(nullable = false)
    @Builder.Default
    private String status = "WAITING"; // WAITING, NOTIFIED, SEATED, CANCELLED

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
