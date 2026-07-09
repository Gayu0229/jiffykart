package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "banners")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String subtitle;
    private String imageDesktopUrl;
    private String imageMobileUrl;
    private String ctaText;
    private String ctaUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private java.time.LocalDateTime startDate;
    private java.time.LocalDateTime endDate;
    private String position; // Home, Street, Category, etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    private Zone zone;
}
