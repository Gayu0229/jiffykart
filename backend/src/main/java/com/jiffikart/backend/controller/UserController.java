package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.PasswordChangeRequest;
import com.jiffikart.backend.service.AuthService;
import com.jiffikart.backend.dto.ApiResponse;
import com.jiffikart.backend.dto.ChangeContactRequest;
import com.jiffikart.backend.dto.VerifyContactChangeRequest;
import com.jiffikart.backend.entity.OtpType;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(UserController.class);

    private User getAuthenticatedUser(Authentication authentication) {
        String identifier = authentication.getName();
        try {
            Long userId = Long.parseLong(identifier);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
    }

    @Autowired
    private AuthService authService;

    @Autowired
    private com.jiffikart.backend.service.FileStorageService fileStorageService;

    // ── GET PROFILE ──
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        logger.info("Controller: Fetching profile for user ID: {}", user.getId());
        return ResponseEntity.ok(user);
    }

    // ── UPLOAD PROFILE IMAGE ──
    @PostMapping("/profile-image")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("image") org.springframework.web.multipart.MultipartFile image, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        try {
            String imageUrl = fileStorageService.storeFile(image);
            user.setAvatar(imageUrl);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile image updated successfully", "avatarUrl", imageUrl));
        } catch (Exception e) {
            logger.error("Controller: Failed to upload profile image: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to upload image: " + e.getMessage()));
        }
    }
 
    // ── DELETE PROFILE IMAGE ──
    @DeleteMapping("/profile-image")
    public ResponseEntity<?> deleteProfileImage(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        try {
            user.setAvatar(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile image deleted successfully"));
        } catch (Exception e) {
            logger.error("Controller: Failed to delete profile image: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to delete image: " + e.getMessage()));
        }
    }


    // ── UPDATE SAFE FIELDS (name, gender only) ──
    @PutMapping("/update")
    public ResponseEntity<?> updateUserProfile(@RequestBody User updatedData, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        logger.info("Controller: Safe field update for user ID: {}", user.getId());
        try {
            User savedUser = userService.updateUser(user.getId(), updatedData);
            return ResponseEntity.ok(Map.of("user", savedUser));
        } catch (RuntimeException e) {
            logger.error("Controller: Update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ── REQUEST EMAIL CHANGE ──
    @PostMapping("/change-email")
    public ResponseEntity<?> requestEmailChange(@RequestBody ChangeContactRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        try {
            userService.requestEmailChange(user.getId(), request.getNewValue());
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent to your new email."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ── REQUEST PHONE CHANGE ──
    @PostMapping("/change-phone")
    public ResponseEntity<?> requestPhoneChange(@RequestBody ChangeContactRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        try {
            userService.requestPhoneChange(user.getId(), request.getNewValue());
            return ResponseEntity.ok(new ApiResponse(true, "OTP sent to your new phone."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ── CHANGE PASSWORD ──
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeRequest request, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            authService.changePassword(user.getId(), request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(new ApiResponse(true, "Password changed successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
