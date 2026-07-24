package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class PasswordLoginRequest {
    private String identifier; // Mobile or Email
    private String password;
}
