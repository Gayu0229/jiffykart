package com.jiffikart.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "support_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ticketId;

    @Enumerated(EnumType.STRING)
    private Role createdByRole;

    private Long createdById;

    @Column(nullable = false)
    private String subject;

    private String email;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String adminResponse;

    private String resolutionReason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SupportStatus status = SupportStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SupportPriority priority = SupportPriority.MEDIUM;

    private Long orderId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private String requesterName;

    @Transient
    private String phone;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SupportTicketMessage> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (ticketId == null) {
            ticketId = "TIC-" + System.currentTimeMillis() % 1000000;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
