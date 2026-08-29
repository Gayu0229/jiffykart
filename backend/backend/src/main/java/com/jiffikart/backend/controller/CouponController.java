package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Coupon;
import com.jiffikart.backend.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CouponController {

    @Autowired
    private CouponService couponService;

    // --- ADMIN APIs ---

    @GetMapping("/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @PostMapping("/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.createCoupon(coupon));
    }

    @DeleteMapping("/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok().build();
    }

    // --- PUBLIC APIs ---

    @PostMapping("/public/coupons/validate")
    public ResponseEntity<?> validateCoupon(@RequestBody Map<String, Object> payload) {
        try {
            String code = (String) payload.get("code");
            Double orderTotal = Double.valueOf(payload.get("orderTotal").toString());
            Long shopId = payload.get("shopId") != null ? Long.valueOf(payload.get("shopId").toString()) : null;
            
            Coupon validCoupon;
            if (shopId != null) {
                validCoupon = couponService.validateCouponForShop(code, orderTotal, shopId);
            } else {
                validCoupon = couponService.validateCoupon(code, orderTotal);
            }
            return ResponseEntity.ok(validCoupon);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/public/coupons/shop/{shopId}")
    public ResponseEntity<List<Coupon>> getShopCoupons(@PathVariable Long shopId) {
        return ResponseEntity.ok(couponService.getCouponsByShop(shopId));
    }
}
