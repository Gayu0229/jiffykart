package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.SupportAdminReplyRequest;
import com.jiffikart.backend.entity.SupportTicket;
import com.jiffikart.backend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/support/tickets")
public class AdminSupportController {

    @Autowired
    private SupportService supportService;

    @GetMapping
    public ResponseEntity<List<SupportTicket>> getAllTickets() {
        return ResponseEntity.ok(supportService.getAllTickets());
    }

    @PostMapping("/{ticketId}/reply")
    public ResponseEntity<SupportTicket> adminReply(
            @PathVariable String ticketId,
            @RequestBody SupportAdminReplyRequest request) {
        return ResponseEntity.ok(supportService.adminReply(ticketId, request));
    }
}
