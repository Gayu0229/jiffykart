package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Coupon;
import com.jiffikart.backend.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public List<Coupon> getCouponsByShop(Long shopId) {
        List<Coupon> shopCoupons = couponRepository.findByShopIdAndIsActiveTrue(shopId);
        List<Coupon> globalCoupons = couponRepository.findByShopIdIsNullAndIsActiveTrue();
        shopCoupons.addAll(globalCoupons);
        return shopCoupons;
    }

    public Coupon createCoupon(Coupon coupon) {
        // Ensure code is uppercase
        coupon.setCode(coupon.getCode().toUpperCase());
        coupon.setIsActive(true);
        if (coupon.getValidity() == null) {
            coupon.setValidity(java.time.LocalDate.now().plusMonths(1));
        }
        return couponRepository.save(coupon);
    }

    public void deleteCoupon(Long id) {
        couponRepository.deleteById(id);
    }

    public Coupon validateCoupon(String code, Double orderTotal) {
        Optional<Coupon> optCoupon = couponRepository.findByCodeAndIsActiveTrue(code.toUpperCase());
        
        if (optCoupon.isEmpty()) {
            throw new RuntimeException("Invalid or inactive coupon code.");
        }

        Coupon coupon = optCoupon.get();

        if (coupon.getValidity().isBefore(LocalDate.now())) {
            throw new RuntimeException("Coupon code has expired.");
        }

        if (orderTotal < coupon.getMinOrderValue()) {
            throw new RuntimeException("Minimum order value to use this coupon is &#8377;" + coupon.getMinOrderValue());
        }

        return coupon;
    }

    public Coupon validateCouponForShop(String code, Double orderTotal, Long shopId) {
        Coupon coupon = validateCoupon(code, orderTotal);
        if (coupon.getShopId() != null && !coupon.getShopId().equals(shopId)) {
            throw new RuntimeException("This coupon is not valid for this shop.");
        }
        return coupon;
    }
}
