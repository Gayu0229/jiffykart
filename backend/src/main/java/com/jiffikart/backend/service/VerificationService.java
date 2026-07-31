package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.OtpType;
import com.jiffikart.backend.entity.VerificationToken;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.repository.VerificationTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class VerificationService {

    private static final Logger logger = LoggerFactory.getLogger(VerificationService.class);

    @Autowired
    private VerificationTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    private final java.security.SecureRandom secureRandom = new java.security.SecureRandom();

    @Transactional
    public String generateAndSaveOtp(String identifier, OtpType type) {
        String normalized = identifier.trim().toLowerCase();
        logger.info("Request to generate {} OTP for: [{}]", type, normalized);

        Optional<VerificationToken> existingToken =
                tokenRepository.findFirstByIdentifierIgnoreCaseAndTypeOrderByCreatedAtDesc(normalized, type);

        // Cooldown check: 30 seconds
        if (existingToken.isPresent()) {
            LocalDateTime lastCreated = existingToken.get().getCreatedAt();
            if (lastCreated.isAfter(LocalDateTime.now().minusSeconds(30))) {
                logger.warn("Resend attempt too soon for {} ({}). Last created: {}",
                        normalized, type, lastCreated);
                throw new RuntimeException(
                        "Cooldown active: Please wait 30 seconds before requesting a new OTP.");
            }
        }

        // ALWAYS delete ALL old tokens for this identifier+type to prevent duplicates
        tokenRepository.deleteByIdentifierIgnoreCaseAndType(normalized, type);
        tokenRepository.flush();
        logger.info("Cleaned up old {} OTP tokens for {}", type, normalized);

        // Generate 4-digit OTP
        String otp = String.format("%04d", secureRandom.nextInt(10000));
        System.out.println("🔥 OTP GENERATED: " + otp);

        VerificationToken token = VerificationToken.builder()
                .identifier(normalized)
                .type(type)
                .otp(otp)
                .createdAt(LocalDateTime.now())
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        tokenRepository.save(token);
        logger.info("Generated and saved new {} OTP for {}", type, normalized);
        
        return otp;
    }

    /**
     * Full OTP verification — verifies OTP AND applies side effects
     * (enable user, set emailVerified/phoneVerified for registration/login flows).
     */
    @Transactional
    public String verifyOTP(String identifier, String otp, OtpType type) {
        String result = verifyOtpOnly(identifier, otp, type);
        if (!"SUCCESS".equals(result)) {
            return result;
        }

        String normalized = identifier.trim().toLowerCase();

        // Side effects ONLY for registration/login OTP types
        if (type == OtpType.EMAIL) {
            userRepository.findByEmailIgnoreCase(normalized).ifPresentOrElse(user -> {
                user.setEnabled(true);
                user.setEmailVerified(true);
                userRepository.save(user);
                logger.info("User with email {} enabled & emailVerified set", normalized);
                emailService.sendWelcomeEmail(user.getEmail(), user.getName());
            }, () -> {
                logger.error("User with email {} not found after OTP success!", normalized);
            });
        }

        if (type == OtpType.MOBILE) {
            userRepository.findFirstByPhoneOrderByIdAsc(normalized).ifPresentOrElse(user -> {
                user.setPhoneVerified(true);
                user.setEnabled(true);
                userRepository.save(user);
                logger.info("User with phone {} phoneVerified & enabled set", normalized);
            }, () -> {
                logger.error("User with phone {} not found after OTP success!", normalized);
            });
        }

        // For EMAIL_CHANGE and PHONE_CHANGE: no side effects here.
        // The caller (UserService.verifyContactChange) handles the actual swap.

        return "SUCCESS";
    }

    /**
     * OTP-only verification — validates OTP without any side effects.
     * Used by contact change flow where the caller handles the actual field update.
     */
    @Transactional
    public String verifyOtpOnly(String identifier, String otp, OtpType type) {
        String normalized = identifier.trim().toLowerCase();
        String trimmedOtp = otp != null ? otp.trim() : "";

        logger.info("Verification attempt for {} [{}], OTP: [{}]",
                type, normalized, trimmedOtp);

        Optional<VerificationToken> tokenOpt =
                tokenRepository.findFirstByIdentifierIgnoreCaseAndTypeOrderByCreatedAtDesc(normalized, type);

        if (tokenOpt.isEmpty()) {
            logger.warn("No {} OTP token found for: {}", type, normalized);
            return "No OTP found. Please request a new one.";
        }

        VerificationToken token = tokenOpt.get();

        // Already used check
        if (token.isUsed()) {
            logger.warn("{} OTP already used for: {}", type, normalized);
            return "OTP already used. Please request a new one.";
        }

        // Max attempts check: 5
        if (token.getAttempts() >= 5) {
            tokenRepository.delete(token);
            logger.warn("Too many {} OTP attempts for: {}", type, normalized);
            return "Too many failed attempts. Please request a new OTP.";
        }

        // Expiry check
        if (token.isExpired()) {
            tokenRepository.delete(token);
            logger.warn("{} OTP expired for: {}. Expiry: {}", type, normalized, token.getExpiryDate());
            return "OTP has expired. Please request a new one.";
        }

        // Match check
        if (token.getOtp().equals(trimmedOtp)) {
            logger.info("{} OTP verified successfully for: {}", type, normalized);
            token.setUsed(true);
            tokenRepository.save(token);
            return "SUCCESS";
        } else {
            // Failure: increment attempts
            token.setAttempts(token.getAttempts() + 1);
            tokenRepository.save(token);
            logger.warn("{} OTP mismatch for {}: Stored=[{}], Received=[{}] (Attempts: {}/5)",
                    type, normalized, token.getOtp(), trimmedOtp, token.getAttempts());
            return "Invalid OTP. " + (5 - token.getAttempts()) + " attempts remaining.";
        }
    }
}
