package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.CreateUserRequest;
import com.jiffikart.backend.dto.UserResponse;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, Long adminId) {
        String sanitizedEmail = request.getEmail().trim().toLowerCase().replace(" ", "");
        if (userRepository.findByEmailIgnoreCase(sanitizedEmail).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }

        String phone = request.getPhone();
        if (phone != null && phone.trim().isEmpty()) {
            phone = null;
        }

        User user = User.builder()
                .name(request.getName())
                .email(sanitizedEmail)
                .phone(phone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .forcePasswordChange(request.getForcePasswordChange() != null ? request.getForcePasswordChange() : true)
                .createdBy(adminId)
                .build();

        User savedUser = userRepository.save(user);

        // Optional: Send credentials email
        // emailService.sendCredentialsEmail(savedUser.getEmail(), request.getPassword());

        return mapToResponse(savedUser);
    }

    @Transactional
    public UserResponse resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForcePasswordChange(true);
        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse toggleUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEnabled(enabled);
        return mapToResponse(userRepository.save(user));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .forcePasswordChange(user.getForcePasswordChange())
                .createdBy(user.getCreatedBy())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
