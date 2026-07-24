package com.jiffikart.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupportAdminReplyRequest {
    private String resolution;
    private String reason;
    private String status;
}
