package com.jiffikart.backend.dto;

import com.jiffikart.backend.entity.Role;
import lombok.Data;

@Data
public class CreateUserRequest {
    private String name;
    private String email;
    private String phone;
    private String password;
    private Role role;
    private Boolean enabled;
    private Boolean forcePasswordChange;
}
