package com.jiffikart.backend.service;

import com.jiffikart.backend.exception.UserAlreadyExistsException;
import com.jiffikart.backend.dto.AuthResponse;
import com.jiffikart.backend.dto.RegisterRequest;
import com.jiffikart.backend.dto.PasswordLoginRequest;
import com.jiffikart.backend.entity.OtpType;
import com.jiffikart.backend.entity.Role;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    // ─── REGISTRATION ───

    public User register(RegisterRequest request) {
        System.out.println("🔥 REGISTER METHOD HIT");
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedPhone = request.getPhone().trim();
        System.out.println("INPUT EMAIL: " + request.getEmail());
        System.out.println("NORMALIZED EMAIL: " + normalizedEmail);

        // Check if user exists but is unverified — resend OTP instead of rejecting
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            System.out.println("DB EMAIL: " + user.getEmail());
            System.out.println("Phone VERIFIED: " + user.getPhoneVerified());
            System.out.println("Enabled: " + user.getEnabled());
            System.out.println("Role: " + user.getRole());
            if (!user.getPhoneVerified()) {
                System.out.println("➡️ Unverified user — resending OTP");
                String otp = verificationService.generateAndSaveOtp(user.getPhone(), OtpType.MOBILE);
                System.out.println("🔥 OTP GENERATED (RESEND): " + otp);
                System.out.println("📱 Sending OTP to: " + user.getPhone());
                try {
                    smsService.sendSms(user.getPhone(), user.getName(), otp);
                } catch (Exception e) {
                    System.err.println("Failed to resend SMS: " + e.getMessage());
                }
                return user;
            }
            System.out.println("❌ Email already registered and verified — throwing exception");
            throw new UserAlreadyExistsException("Email already registered");
        }

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new UserAlreadyExistsException("Phone number already registered");
        }

        User newUser = User.builder()
                .name(request.getName())
                .email(normalizedEmail)
                .phone(normalizedPhone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .enabled(false)
                .emailVerified(true)
                .phoneVerified(false)
                .build();

        User savedUser = userRepository.save(newUser);

        String otp = verificationService.generateAndSaveOtp(savedUser.getPhone(), OtpType.MOBILE);
        System.out.println("🔥 OTP GENERATED: " + otp);
        System.out.println("📱 Sending OTP to: " + savedUser.getPhone());
        try {
            smsService.sendSms(savedUser.getPhone(), savedUser.getName(), otp);
        } catch (Exception e) {
            System.err.println("Failed to send OTP SMS: " + e.getMessage());
        }

        return savedUser;
    }

    // ─── LOGIN: Send Mobile OTP ───

    public void sendLoginOtp(String phone) {
        String normalized = phone.trim();
        Optional<User> userOpt = userRepository.findFirstByPhoneOrderByIdAsc(normalized);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("No account found with this mobile number.");
        }
        if (!userOpt.get().getEnabled()) {
            throw new RuntimeException("Account not verified. Please verify your email first.");
        }

        // 1. Generate & Save in DB
        String otp = verificationService.generateAndSaveOtp(normalized, OtpType.MOBILE);
        
        // 2. Send SMS via SmsService
        try {
            smsService.sendSms(normalized, userOpt.get().getName(), otp);
        } catch (Exception e) {
            System.err.println("Failed to send SMS: " + e.getMessage());
            // Keep logging the OTP to console so we don't block development/testing if API fails
        }
        
        System.out.println("\n╔══════════════════════════════════════╗");
        System.out.println("║  📱 MOBILE OTP for " + normalized);
        System.out.println("║  🔑 OTP: " + otp);
        System.out.println("╚══════════════════════════════════════╝\n");
    }

    // ─── LOGIN: Verify Mobile OTP & Issue JWT ───

    @Autowired
    private com.jiffikart.backend.repository.ShopRepository shopRepository;

    public AuthResponse verifyLoginOtp(String phone, String otp) {
        String normalized = phone.trim();
        String result = verificationService.verifyOTP(normalized, otp, OtpType.MOBILE);

        if (!"SUCCESS".equals(result)) {
            throw new RuntimeException(result);
        }

        User user = userRepository.findFirstByPhoneOrderByIdAsc(normalized)
                .orElseThrow(() -> new RuntimeException("User not found."));

        return generateAuthResponse(user);
    }

    public AuthResponse loginWithPassword(PasswordLoginRequest request) {
        String identifier = request.getIdentifier().trim();
        Optional<User> userOpt;

        if (identifier.contains("@")) {
            userOpt = userRepository.findByEmailIgnoreCase(identifier.toLowerCase());
        } else {
            userOpt = userRepository.findFirstByPhoneOrderByIdAsc(identifier);
        }

        if (userOpt.isEmpty()) {
            // Security: Same message for both invalid user and invalid password
            throw new RuntimeException("Invalid credentials.");
        }
    
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials.");
        }

        if (!user.getEnabled()) {
            throw new RuntimeException("Account not verified. Please verify your email first.");
        }

        return generateAuthResponse(user);
    }


    private AuthResponse generateAuthResponse(User user) {
        // Prepare JWT Claims
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());

        // CRITICAL: If Vendor, fetch and validate Shop
        if (user.getRole() == Role.VENDOR) {
            com.jiffikart.backend.entity.Shop shop = shopRepository.findFirstByOwnerOrderByIdAsc(user)
                    .orElseThrow(() -> new RuntimeException("Vendor profile not found. Please contact support."));

            claims.put("vendorId", shop.getId());
        }

        String token = jwtUtils.generateJwtToken(user.getPhone() != null ? user.getPhone() : user.getEmail(), claims);
        return new AuthResponse(token, user, user.getForcePasswordChange());
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password does not match.");
        }

        if (newPassword.length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters long.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForcePasswordChange(false);
        userRepository.save(user);
    }
}
