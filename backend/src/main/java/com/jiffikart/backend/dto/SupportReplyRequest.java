package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class SupportReplyRequest {
    private String message;
    private String attachmentUrl;
}
