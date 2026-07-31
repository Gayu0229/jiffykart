package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class VerifyContactChangeRequest {
    private String otp;
    private String type; // "EMAIL_CHANGE" or "PHONE_CHANGE"
}
