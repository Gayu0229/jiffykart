package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.SellerApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private SellerApplicationService applicationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.jiffikart.backend.repository.ShopReviewRepository shopReviewRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        String identifier = authentication.getName();
        try {
            // UserDetailsServiceImpl sets username as the user ID string
            Long userId = Long.parseLong(identifier);
            return userRepository.findById(userId)
                    .or(() -> userRepository.findFirstByPhoneOrderByIdAsc(identifier))
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found with ID/Identifier: " + identifier));
        } catch (NumberFormatException e) {
            return userRepository.findFirstByPhoneOrderByIdAsc(identifier)
                    .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                    .orElseThrow(() -> new RuntimeException("User not found with identifier: " + identifier));
        }
    }

    @Autowired
    private com.jiffikart.backend.service.FileStorageService fileStorageService;

    @PostMapping(value = "/seller-application", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitSellerApplication(
            @RequestParam("shopName") String shopName,
            @RequestParam("businessType") String businessType,
            @RequestParam("category") String category,
            @RequestParam(value = "gstNumber", required = false) String gstNumber,
            @RequestParam("address") String address,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("pincode") String pincode,
            @RequestParam("panNumber") String panNumber,
            @RequestParam("accountHolderName") String accountHolderName,
            @RequestParam("bankAccountNumber") String bankAccountNumber,
            @RequestParam("ifscCode") String ifscCode,
            @RequestParam("idProof") org.springframework.web.multipart.MultipartFile idProof,
            @RequestParam("businessProof") org.springframework.web.multipart.MultipartFile businessProof,
            @RequestParam("addressProof") org.springframework.web.multipart.MultipartFile addressProof,
            @RequestParam("cancelledCheque") org.springframework.web.multipart.MultipartFile cancelledCheque,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        String idProofUrl = fileStorageService.storeFile(idProof);
        String businessProofUrl = fileStorageService.storeFile(businessProof);
        String addressProofUrl = fileStorageService.storeFile(addressProof);
        String cancelledChequeUrl = fileStorageService.storeFile(cancelledCheque);

        com.jiffikart.backend.entity.SellerApplication application = com.jiffikart.backend.entity.SellerApplication.builder()
                .user(user)
                .shopName(shopName)
                .businessDescription(businessType + " | " + category + " | " + city)
                .businessType(businessType)
                .category(category)
                .hasGst(gstNumber != null && !gstNumber.isEmpty())
                .gstNumber(gstNumber)
                .address(address)
                .city(city)
                .state(state)
                .pincode(pincode)
                .panNumber(panNumber)
                .accountHolderName(accountHolderName)
                .bankAccountNumber(bankAccountNumber)
                .ifscCode(ifscCode)
                .idProofUrl(idProofUrl)
                .businessProofUrl(businessProofUrl)
                .addressProofUrl(addressProofUrl)
                .cancelledChequeUrl(cancelledChequeUrl)
                .status("PENDING")
                .build();

        applicationService.submitApplication(application);
        return ResponseEntity.ok(Map.of("message", "Application submitted successfully"));
    }

    @Autowired
    private com.jiffikart.backend.service.StatsService statsService;

    @PostMapping("/reviews")
    public ResponseEntity<?> submitReview(@RequestBody com.jiffikart.backend.entity.ShopReview review, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        // Overwrite the user name from the token instead of trusting the client blindly
        review.setUserName(user.getName() != null && !user.getName().isEmpty() ? user.getName() : "Verified User");
        review.setVerified(true);
        com.jiffikart.backend.entity.ShopReview savedReview = shopReviewRepository.save(review);
        
        // Update public stats
        statsService.updateAndBroadcast();
        
        return ResponseEntity.ok(savedReview);
    }
}
