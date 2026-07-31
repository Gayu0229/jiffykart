package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Role;
import com.jiffikart.backend.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByCreatedByRoleAndCreatedById(Role role, Long id);
    Optional<SupportTicket> findByTicketId(String ticketId);
}
