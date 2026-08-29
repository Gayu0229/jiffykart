package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class OtpVerificationRequest {
    private String phone;
    private String otp;
}
