package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.SupportReplyRequest;
import com.jiffikart.backend.dto.SupportTicketRequest;
import com.jiffikart.backend.entity.SupportTicket;
import com.jiffikart.backend.entity.SupportTicketMessage;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.service.SupportService;
import com.jiffikart.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/support/tickets")
public class SupportController {

    @Autowired
    private SupportService supportService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<SupportTicket> createTicket(@RequestBody SupportTicketRequest request, Principal principal) {
        User user = userService.getUserByIdentifier(principal.getName());
        return ResponseEntity.ok(supportService.createTicket(request, user));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SupportTicket>> getMyTickets(Principal principal) {
        User user = userService.getUserByIdentifier(principal.getName());
        return ResponseEntity.ok(supportService.getMyTickets(user));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<SupportTicket> getTicketDetails(@PathVariable String ticketId, Principal principal) {
        User user = userService.getUserByIdentifier(principal.getName());
        return ResponseEntity.ok(supportService.getTicketDetails(ticketId, user));
    }

    @PostMapping("/{ticketId}/reply")
    public ResponseEntity<SupportTicketMessage> addReply(
            @PathVariable String ticketId,
            @RequestBody SupportReplyRequest request,
            Principal principal) {
        User user = userService.getUserByIdentifier(principal.getName());
        return ResponseEntity.ok(supportService.addReply(ticketId, request, user));
    }
}
