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
            System.out.println("EMAIL VERIFIED: " + user.getEmailVerified());
            System.out.println("Enabled: " + user.getEnabled());
            System.out.println("Role: " + user.getRole());
            if (!user.getEmailVerified()) {
                System.out.println("➡️ Unverified user — resending OTP");
                String otp = verificationService.generateAndSaveOtp(user.getEmail(), OtpType.EMAIL);
                System.out.println("🔥 OTP GENERATED (RESEND): " + otp);
                System.out.println("📧 Sending OTP to: " + user.getEmail());
                emailService.sendOtpEmail(user.getEmail(), otp);
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
                .emailVerified(false)
                .phoneVerified(true)
                .build();

        User savedUser = userRepository.save(newUser);

        String otp = verificationService.generateAndSaveOtp(savedUser.getEmail(), OtpType.EMAIL);
        System.out.println("🔥 OTP GENERATED: " + otp);
        System.out.println("📧 Sending OTP to: " + savedUser.getEmail());
        System.out.println("🚀 BEFORE EMAIL CALL");
        try {
            emailService.sendOtpEmail(savedUser.getEmail(), otp);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
        }
        System.out.println("🚀 AFTER EMAIL CALL");

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
        
        // 2. Send SMS (Simulated — check server console for OTP)
        // TODO: Replace with real SMS provider (Twilio, MSG91, etc.)
        System.out.println("\n╔══════════════════════════════════════╗");
        System.out.println("║  📱 MOBILE OTP for " + normalized);
        System.out.println("║  🔑 OTP: " + otp);
        System.out.println("╚══════════════════════════════════════╝\n");
    }

    // ─── LOGIN: Send Email OTP ───

    public void sendEmailLoginOtp(String email) {
        String normalized = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalized);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("No account found with this email address.");
        }
        if (!userOpt.get().getEnabled()) {
            throw new RuntimeException("Account not verified. Please verify your email first.");
        }

        // 1. Generate & Save in DB
        String otp = verificationService.generateAndSaveOtp(normalized, OtpType.EMAIL);
        
        // 2. Send Email
        try {
            emailService.sendOtpEmail(normalized, otp);
        } catch (Exception e) {
            System.err.println("Failed to send login OTP email: " + e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
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

    // ─── LOGIN: Verify Email OTP & Issue JWT ───

    public AuthResponse verifyEmailLoginOtp(String email, String otp) {
        String normalized = email.trim().toLowerCase();
        String result = verificationService.verifyOTP(normalized, otp, OtpType.EMAIL);

        if (!"SUCCESS".equals(result)) {
            throw new RuntimeException(result);
        }

        User user = userRepository.findByEmailIgnoreCase(normalized)
                .orElseThrow(() -> new RuntimeException("User not found."));

        return generateAuthResponse(user);
    }

    // ─── VENDOR: Email OTP Login ───

    public void sendVendorEmailLoginOtp(String email) {
        String normalized = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalized);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("No account found with this email address.");
        }
        User user = userOpt.get();
        if (user.getRole() != Role.VENDOR) {
            throw new RuntimeException("Access denied. Only vendor accounts allowed.");
        }

        // Shop status check (matching mobile logic)
        var shopOpt = shopRepository.findFirstByOwnerOrderByIdAsc(user);
        if (shopOpt.isPresent()) {
            var shop = shopOpt.get();
            if ("REJECTED".equalsIgnoreCase(shop.getApprovalStatus())) {
                throw new RuntimeException("Your shop has been blocked.");
            }
            if (shop.getIsActive() != null && !shop.getIsActive()) {
                throw new RuntimeException("Your shop is currently inactive.");
            }
            if ("PENDING".equalsIgnoreCase(shop.getApprovalStatus())) {
                throw new RuntimeException("Your shop is pending approval.");
            }
        }

        String otp = verificationService.generateAndSaveOtp(normalized, OtpType.EMAIL);
        try {
            emailService.sendOtpEmail(normalized, otp);
        } catch (Exception e) {
            System.err.println("Failed to send vendor login OTP email: " + e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }

    public AuthResponse verifyVendorEmailLoginOtp(String email, String otp) {
        String normalized = email.trim().toLowerCase();
        String result = verificationService.verifyOTP(normalized, otp, OtpType.EMAIL);

        if (!"SUCCESS".equals(result)) {
            throw new RuntimeException(result);
        }

        User user = userRepository.findByEmailIgnoreCase(normalized)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.getRole() != Role.VENDOR) {
            throw new RuntimeException("Access denied. Only vendor accounts allowed.");
        }

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
