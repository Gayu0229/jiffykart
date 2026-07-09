package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class VerificationRequest {
    private String email;
    private String otp;
}
