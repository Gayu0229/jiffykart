package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.ReturnRequest;
import com.jiffikart.backend.entity.ReturnRequestStatus;
import com.jiffikart.backend.service.FileStorageService;
import com.jiffikart.backend.service.ReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReturnController {

    @Autowired
    private ReturnService returnService;

    @Autowired
    private FileStorageService fileStorageService;

    // --- User API ---
    @PostMapping("/api/customer/returns/request")
    public ResponseEntity<?> createReturnRequest(@RequestBody ReturnRequest request) {
        try {
            ReturnRequest saved = returnService.createRequest(request);
            return ResponseEntity.ok(Map.of("message", "Request created successfully", "data", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/customer/returns/upload-images")
    public ResponseEntity<?> uploadReturnImages(@RequestParam("images") MultipartFile[] images) {
        try {
            List<String> urls = new ArrayList<>();
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    String url = fileStorageService.storeFile(image);
                    urls.add(url);
                }
            }
            return ResponseEntity.ok(Map.of("urls", urls));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload images: " + e.getMessage()));
        }
    }

    @GetMapping("/api/customer/returns/user/{userId}")
    public ResponseEntity<?> getUserReturns(@PathVariable Long userId) {
        return ResponseEntity.ok(returnService.getUserRequests(userId));
    }

    // --- Vendor API ---
    @GetMapping("/api/vendor/returns")
    public ResponseEntity<?> getVendorReturns(@RequestParam Long vendorId) {
        return ResponseEntity.ok(returnService.getVendorRequests(vendorId));
    }

    @PutMapping("/api/vendor/returns/{id}/status")
    public ResponseEntity<?> updateReturnStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            ReturnRequestStatus status = ReturnRequestStatus.valueOf(body.get("status").toUpperCase());
            String reason = body.get("reason");
            ReturnRequest updated = returnService.updateStatus(id, status, reason);
            return ResponseEntity.ok(Map.of("message", "Status updated", "data", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
