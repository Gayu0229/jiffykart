package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.SupportTicket;
import com.jiffikart.backend.entity.SupportTicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportTicketMessageRepository extends JpaRepository<SupportTicketMessage, Long> {
    List<SupportTicketMessage> findByTicketOrderByCreatedAtAsc(SupportTicket ticket);
}
