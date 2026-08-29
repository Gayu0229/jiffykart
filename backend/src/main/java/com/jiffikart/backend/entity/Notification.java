package com.jiffikart.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    private Role recipientRole;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;

    private String type;

    @Builder.Default
    @JsonProperty("isRead")
    private boolean isRead = false;

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON for additional action data

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
