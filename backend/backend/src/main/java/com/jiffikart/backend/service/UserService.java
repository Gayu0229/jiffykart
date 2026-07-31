package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.UpdateProfileRequest;
import com.jiffikart.backend.entity.OtpType;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UserService.class);

    // ── SAFE PROFILE UPDATE (name, gender only — NO email/phone) ──

    @Transactional
    public User updateUser(Long id, User updatedData) {
        logger.info("UserService: Updating safe fields for user ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (updatedData.getName() != null) user.setName(updatedData.getName());
        if (updatedData.getGender() != null) user.setGender(updatedData.getGender());

        // SECURITY: Email and Phone are NOT updated here.
        // They require OTP verification via /change-email and /change-phone endpoints.

        User savedUser = userRepository.save(user);
        logger.info("UserService: Updated safe fields for user ID: {}", id);
        return savedUser;
    }

    @Transactional
    public User updateVendorProfile(Long id, UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Name Validation
        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.length() < 3) {
                throw new RuntimeException("Full Name must be at least 3 characters long.");
            }
            if (!name.matches("^[a-zA-Z\\s]+$")) {
                throw new RuntimeException("Full Name must contain only alphabets and spaces.");
            }
            user.setName(name);
        }

        // Email Validation & Uniqueness
        if (request.getEmail() != null) {
            String email = request.getEmail().trim().toLowerCase();
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new RuntimeException("Invalid email format.");
            }
            Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new RuntimeException("Email address is already in use.");
            }
            user.setEmail(email);
        }

        // Password Validation & Hashing
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            String password = request.getPassword();
            if (password.length() < 8) {
                throw new RuntimeException("Password must be at least 8 characters long.");
            }
            if (!password.matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) {
                throw new RuntimeException("Password must contain at least 1 uppercase letter, 1 number, and 1 special character.");
            }
            if (request.getConfirmPassword() == null || !password.equals(request.getConfirmPassword())) {
                throw new RuntimeException("Passwords do not match.");
            }
            user.setPassword(passwordEncoder.encode(password));
        }

        return userRepository.save(user);
    }

    // ── REQUEST EMAIL CHANGE (stores pending, sends OTP to NEW email) ──

    @Transactional
    public void requestEmailChange(Long userId, String newEmail) {
        String normalized = newEmail.trim().toLowerCase();
        logger.info("Email change requested for user ID: {} → {}", userId, normalized);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // 1. Check if new email is same as current
        if (normalized.equals(user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "")) {
            throw new RuntimeException("New email is the same as your current email.");
        }

        // 2. Check if new email already belongs to another user
        Optional<User> existing = userRepository.findByEmailIgnoreCase(normalized);
        if (existing.isPresent() && !existing.get().getId().equals(userId)) {
            throw new RuntimeException("This email is already in use by another account.");
        }

        // 3. Store as pending (do NOT update actual email)
        user.setPendingEmail(normalized);
        userRepository.save(user);

        // 4. Generate OTP linked to the NEW email
        String otp = verificationService.generateAndSaveOtp(normalized, OtpType.EMAIL_CHANGE);

        // 5. Send OTP to the NEW email (to prove ownership)
        try {
            emailService.sendOtpEmail(normalized, otp);
            logger.info("OTP sent to NEW email: {}", normalized);
        } catch (Exception e) {
            logger.error("Failed to send OTP to new email {}: {}", normalized, e.getMessage());
            throw new RuntimeException("Failed to send OTP. Please try again.");
        }
    }

    // ── REQUEST PHONE CHANGE (stores pending, generates OTP for NEW phone) ──

    @Transactional
    public void requestPhoneChange(Long userId, String newPhone) {
        String normalized = newPhone.trim();
        logger.info("Phone change requested for user ID: {} → {}", userId, normalized);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // 1. Check if new phone is same as current
        if (normalized.equals(user.getPhone() != null ? user.getPhone().trim() : "")) {
            throw new RuntimeException("New phone number is the same as your current number.");
        }

        // 2. Check if new phone already belongs to another user
        Optional<User> existing = userRepository.findFirstByPhoneOrderByIdAsc(normalized);
        if (existing.isPresent() && !existing.get().getId().equals(userId)) {
            throw new RuntimeException("This phone number is already in use by another account.");
        }

        // 3. Store as pending (do NOT update actual phone)
        user.setPendingPhone(normalized);
        userRepository.save(user);

        // 4. Generate OTP linked to the NEW phone
        String otp = verificationService.generateAndSaveOtp(normalized, OtpType.PHONE_CHANGE);

        // 5. In production: smsService.send(normalized, otp);
        logger.info("📱 Phone change OTP for {}: {}", normalized, otp);
    }

    // ── VERIFY CONTACT CHANGE OTP → Apply pending → Actual ──

    @Transactional
    public Map<String, Object> verifyContactChange(Long userId, String otp, OtpType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        Map<String, Object> result = new HashMap<>();

        if (type == OtpType.EMAIL_CHANGE) {
            String pendingEmail = user.getPendingEmail();
            if (pendingEmail == null || pendingEmail.isBlank()) {
                throw new RuntimeException("No pending email change found. Please request a change first.");
            }

            // Verify OTP against the pending email
            String verifyResult = verificationService.verifyOtpOnly(pendingEmail, otp, OtpType.EMAIL_CHANGE);
            if (!"SUCCESS".equals(verifyResult)) {
                throw new RuntimeException(verifyResult);
            }

            // OTP verified — apply the change
            logger.info("Email change verified for user {}: {} → {}", userId, user.getEmail(), pendingEmail);
            user.setEmail(pendingEmail);
            user.setPendingEmail(null);
            user.setEmailVerified(true);
            userRepository.save(user);

            result.put("user", user);
            result.put("message", "Email updated successfully to " + pendingEmail);

        } else if (type == OtpType.PHONE_CHANGE) {
            String pendingPhone = user.getPendingPhone();
            if (pendingPhone == null || pendingPhone.isBlank()) {
                throw new RuntimeException("No pending phone change found. Please request a change first.");
            }

            // Verify OTP against the pending phone
            String verifyResult = verificationService.verifyOtpOnly(pendingPhone, otp, OtpType.PHONE_CHANGE);
            if (!"SUCCESS".equals(verifyResult)) {
                throw new RuntimeException(verifyResult);
            }

            // OTP verified — apply the change
            logger.info("Phone change verified for user {}: {} → {}", userId, user.getPhone(), pendingPhone);
            user.setPhone(pendingPhone);
            user.setPendingPhone(null);
            user.setPhoneVerified(true);
            userRepository.save(user);

            // JWT subject = phone, so re-issue a new token
            String newToken = jwtUtils.generateJwtToken(user.getPhone());
            result.put("user", user);
            result.put("newToken", newToken);
            result.put("message", "Phone number updated successfully to " + pendingPhone);
            logger.info("Issued new JWT for updated phone: {}", user.getPhone());

        } else {
            throw new RuntimeException("Invalid change type: " + type);
        }

        return result;
    }

    public User getUserByIdentifier(String identifier) {
        String trimmed = identifier.trim();
        try {
            Long userId = Long.parseLong(trimmed);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(trimmed)
                    .or(() -> userRepository.findByEmailIgnoreCase(trimmed))
                    .orElseThrow(() -> new RuntimeException("User not found: " + identifier));
        }
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
}
