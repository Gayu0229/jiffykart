package com.jiffikart.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_ticket_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicketMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonIgnore
    private SupportTicket ticket;

    @Enumerated(EnumType.STRING)
    private Role senderRole;

    private Long senderId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private String attachmentUrl;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
