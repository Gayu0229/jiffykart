package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.SupportAdminReplyRequest;
import com.jiffikart.backend.dto.SupportReplyRequest;
import com.jiffikart.backend.dto.SupportTicketRequest;
import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.SupportTicketMessageRepository;
import com.jiffikart.backend.repository.SupportTicketRepository;
import com.jiffikart.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SupportService {

    @Autowired
    private SupportTicketRepository ticketRepository;

    @Autowired
    private SupportTicketMessageRepository messageRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private SupportTicket enrichTicket(SupportTicket ticket) {
        if (ticket.getCreatedById() != null) {
            userRepository.findById(ticket.getCreatedById()).ifPresent(user -> {
                ticket.setRequesterName(user.getName());
                ticket.setEmail(user.getEmail());
                ticket.setPhone(user.getPhone());
            });
        }
        return ticket;
    }

    @Transactional
    public SupportTicket createTicket(SupportTicketRequest request, User user) {
        SupportTicket ticket = SupportTicket.builder()
                .ticketId("TIC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .createdByRole(user.getRole())
                .createdById(user.getId())
                .subject(request.getSubject())
                .email(user.getEmail())
                .category(request.getCategory())
                .description(request.getDescription())
                .orderId(request.getOrderId())
                .status(SupportStatus.OPEN)
                .priority(request.getPriority() != null ? SupportPriority.valueOf(request.getPriority().toUpperCase()) : SupportPriority.MEDIUM)
                .build();

        SupportTicket savedTicket = ticketRepository.save(ticket);

        // Add the description as the first message
        if (request.getDescription() != null && !request.getDescription().isEmpty()) {
            SupportTicketMessage initialMessage = SupportTicketMessage.builder()
                    .ticket(savedTicket)
                    .senderRole(user.getRole())
                    .senderId(user.getId())
                    .message(request.getDescription())
                    .build();
            messageRepository.save(initialMessage);
        }

        // Notify admins about new ticket
        notificationService.notifyAdmin("New support ticket " + savedTicket.getTicketId() + ": " + savedTicket.getSubject());

        return enrichTicket(savedTicket);
    }

    @Transactional
    public SupportTicketMessage addReply(String ticketId, SupportReplyRequest request, User sender) {
        SupportTicket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        // Security Check: Users/Vendors can only reply to their own tickets
        if (sender.getRole() != Role.ADMIN && !ticket.getCreatedById().equals(sender.getId())) {
             throw new RuntimeException("Unauthorized: You do not own this ticket.");
        }

        // If ticket is closed, it cannot be replied to by User/Vendor
        if (ticket.getStatus() == SupportStatus.CLOSED && sender.getRole() != Role.ADMIN) {
            throw new RuntimeException("Ticket is closed and cannot be reopened by user.");
        }

        SupportTicketMessage message = SupportTicketMessage.builder()
                .ticket(ticket)
                .senderRole(sender.getRole())
                .senderId(sender.getId())
                .message(request.getMessage())
                .attachmentUrl(request.getAttachmentUrl())
                .build();

        SupportTicketMessage savedMessage = messageRepository.save(message);

        // Update ticket's updatedAt timestamp
        ticket.setStatus(sender.getRole() == Role.ADMIN ? SupportStatus.IN_PROGRESS : ticket.getStatus());
        ticketRepository.save(ticket);

        return savedMessage;
    }

    public List<SupportTicket> getMyTickets(User user) {
        List<SupportTicket> tickets = ticketRepository.findByCreatedByRoleAndCreatedById(user.getRole(), user.getId());
        tickets.forEach(this::enrichTicket);
        return tickets;
    }

    public List<SupportTicket> getAllTickets() {
        List<SupportTicket> tickets = ticketRepository.findAll();
        tickets.forEach(this::enrichTicket);
        return tickets;
    }

    public SupportTicket getTicketDetails(String ticketId, User user) {
        SupportTicket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        // Security check
        if (user.getRole() != Role.ADMIN && !ticket.getCreatedById().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this ticket.");
        }

        // Initialize lazy collection to prevent serialization issues in frontend
        if (ticket.getMessages() != null) {
            ticket.getMessages().size();
        }

        return enrichTicket(ticket);
    }

    @Transactional
    public SupportTicket adminReply(String ticketId, SupportAdminReplyRequest request) {
        SupportTicket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        // 1. Update ticket details
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                ticket.setStatus(SupportStatus.valueOf(request.getStatus().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Keep existing status if invalid one provided
            }
        }
        ticket.setAdminResponse(request.getResolution());
        ticket.setResolutionReason(request.getReason());
        
        SupportTicket savedTicket = ticketRepository.save(ticket);

        // 2. Add an internal message for tracking the reply
        SupportTicketMessage message = SupportTicketMessage.builder()
                .ticket(savedTicket)
                .senderRole(Role.ADMIN)
                .message("ACTION: Support response sent. Resolution: " + request.getResolution())
                .build();
        messageRepository.save(message);

        // 3. Trigger Email Notification
        if (savedTicket.getEmail() != null) {
            emailService.sendSupportTicketUpdateEmail(
                savedTicket.getEmail(),
                savedTicket.getRequesterName() != null ? savedTicket.getRequesterName() : "User",
                savedTicket.getTicketId(),
                savedTicket.getSubject(),
                request.getResolution(),
                request.getReason()
            );
        }

        if (savedTicket.getMessages() != null) {
            savedTicket.getMessages().size();
        }

        return enrichTicket(savedTicket);
    }
}
