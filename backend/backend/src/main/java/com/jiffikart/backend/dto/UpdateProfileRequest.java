package com.jiffikart.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String email;
    private String password;
    private String confirmPassword;
}
