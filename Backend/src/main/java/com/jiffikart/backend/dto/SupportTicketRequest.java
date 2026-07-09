package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class SupportTicketRequest {
    private String subject;
    private String category;
    private String description;
    private Long orderId;
    private String priority;
}
