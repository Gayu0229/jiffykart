package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stores email for EMAIL type, phone for MOBILE type
    @Column(nullable = false)
    private String identifier;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OtpType type;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    private boolean used = false;

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDateTime.now());
    }
}
