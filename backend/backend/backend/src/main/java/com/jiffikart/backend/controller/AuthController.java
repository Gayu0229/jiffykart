package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.*;
import com.jiffikart.backend.entity.OtpType;
import com.jiffikart.backend.security.JwtUtils;
import com.jiffikart.backend.service.AuthService;
import com.jiffikart.backend.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private com.jiffikart.backend.service.EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.jiffikart.backend.repository.ShopRepository shopRepository;

    private com.jiffikart.backend.entity.User getAuthenticatedUser(Authentication authentication) {
        String identifier = authentication.getName();
        try {
            Long userId = Long.parseLong(identifier);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }

    // ─── REGISTRATION FLOW (Email OTP) ───

    @PostMapping("/signup")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        System.out.println("👉 SIGNUP API HIT");
        try {
            authService.register(request);
            return ResponseEntity
                    .ok(new ApiResponse(true, "Registration successful. Please verify your email using the OTP sent."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<?> verifyEmailOtp(@RequestBody VerificationRequest request) {
        String result = verificationService.verifyOTP(request.getEmail(), request.getOtp(), OtpType.EMAIL);
        if ("SUCCESS".equals(result)) {
            return ResponseEntity.ok(new ApiResponse(true, "Account verified successfully. You can now login."));
        }
        return ResponseEntity.badRequest().body(new ApiResponse(false, result));
    }

    @PostMapping("/resend-email-otp")
    public ResponseEntity<?> resendEmailOtp(@RequestBody EmailRequest request) {
        try {
            // 1. Generate & Save
            String otp = verificationService.generateAndSaveOtp(request.getEmail(), OtpType.EMAIL);
            // 2. Send
            emailService.sendOtpEmail(request.getEmail(), otp);
            
            return ResponseEntity.ok(new ApiResponse(true, "OTP resent successfully to " + request.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ─── LOGIN FLOW (Mobile OTP) ───

    @PostMapping("/login/send-otp")
    public ResponseEntity<?> loginSendOtp(@RequestBody OtpRequest request) {
        try {
            authService.sendLoginOtp(request.getPhone());
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent to your registered mobile number."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/vendor/send-otp")
    public ResponseEntity<?> vendorSendOtp(@RequestBody OtpRequest request) {
        try {
            // Check if user exists and has VENDOR role before sending OTP
            String phone = request.getPhone().trim();
            var userOpt = userRepository.findFirstByPhoneOrderByIdAsc(phone);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "No account found with this mobile number."));
            }
            var user = userOpt.get();
            if (user.getRole() != com.jiffikart.backend.entity.Role.VENDOR) {
                return ResponseEntity.status(403).body(new ApiResponse(false, "Access denied. Only vendor accounts can log in to the Vendor Dashboard."));
            }

            // Check shop status before allowing login
            var shopOpt = shopRepository.findFirstByOwnerOrderByIdAsc(user);
            if (shopOpt.isPresent()) {
                var shop = shopOpt.get();
                if ("REJECTED".equalsIgnoreCase(shop.getApprovalStatus())) {
                    return ResponseEntity.status(403).body(new ApiResponse(false, "Your shop has been blocked. Please contact the JiffyKart admin team for assistance."));
                }
                if (shop.getIsActive() != null && !shop.getIsActive()) {
                    return ResponseEntity.status(403).body(new ApiResponse(false, "Your shop is currently inactive. Please contact the JiffyKart admin team to reactivate your account."));
                }
                if ("PENDING".equalsIgnoreCase(shop.getApprovalStatus())) {
                    return ResponseEntity.status(403).body(new ApiResponse(false, "Your shop is pending approval. Please wait for admin verification or contact the JiffyKart admin team."));
                }
            }

            authService.sendLoginOtp(phone);
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent to your registered mobile number."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/vendor/email/send-otp")
    public ResponseEntity<?> vendorSendEmailOtp(@RequestBody EmailRequest request) {
        try {
            authService.sendVendorEmailLoginOtp(request.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent to your registered email address."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/vendor/email/verify-otp")
    public ResponseEntity<?> vendorVerifyEmailOtp(@RequestBody VerificationRequest request) {
        try {
            AuthResponse response = authService.verifyVendorEmailLoginOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/login/email/send-otp")
    public ResponseEntity<?> loginSendEmailOtp(@RequestBody EmailRequest request) {
        try {
            authService.sendEmailLoginOtp(request.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent to your registered email address."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> loginVerifyOtp(@RequestBody OtpVerificationRequest request) {
        try {
            AuthResponse response = authService.verifyLoginOtp(request.getPhone(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/login/email/verify-otp")
    public ResponseEntity<?> loginVerifyEmailOtp(@RequestBody VerificationRequest request) {
        try {
            AuthResponse response = authService.verifyEmailLoginOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/login/password")
    public ResponseEntity<?> loginWithPassword(@RequestBody PasswordLoginRequest request) {
        try {
            AuthResponse response = authService.loginWithPassword(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/vendor/login/password")
    public ResponseEntity<?> vendorLoginWithPassword(@RequestBody PasswordLoginRequest request) {
        try {
            // Check role before authenticating
            String identifier = request.getIdentifier().trim();
            java.util.Optional<com.jiffikart.backend.entity.User> userOpt;
            if (identifier.contains("@")) {
                userOpt = userRepository.findByEmailIgnoreCase(identifier.toLowerCase());
            } else {
                userOpt = userRepository.findFirstByPhoneOrderByIdAsc(identifier);
            }
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid credentials."));
            }
            var user = userOpt.get();
            if (user.getRole() != com.jiffikart.backend.entity.Role.VENDOR) {
                return ResponseEntity.status(403).body(new ApiResponse(false, "Access denied. Only vendor accounts can log in to the Vendor Dashboard."));
            }

            // Check shop status before allowing login
            var shopOpt = shopRepository.findFirstByOwnerOrderByIdAsc(user);
            if (shopOpt.isPresent()) {
                var shop = shopOpt.get();
                if ("REJECTED".equalsIgnoreCase(shop.getApprovalStatus())) {
                    return ResponseEntity.status(403).body(new ApiResponse(false, "Your shop has been blocked. Please contact the JiffyKart admin team for assistance."));
                }
                if (shop.getIsActive() != null && !shop.getIsActive()) {
                    return ResponseEntity.status(403).body(new ApiResponse(false, "Your shop is currently inactive. Please contact the JiffyKart admin team to reactivate your account."));
                }
                if ("PENDING".equalsIgnoreCase(shop.getApprovalStatus())) {
                    return ResponseEntity.status(403).body(new ApiResponse(false, "Your shop is pending approval. Please wait for admin verification or contact the JiffyKart admin team."));
                }
            }

            AuthResponse response = authService.loginWithPassword(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }


}
