package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "restaurant_staff", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shop_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantStaff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role; // OWNER, MANAGER, RECEPTIONIST, WAITER
}
