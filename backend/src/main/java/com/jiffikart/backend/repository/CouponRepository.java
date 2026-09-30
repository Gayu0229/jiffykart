package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    Optional<Coupon> findByCodeAndIsActiveTrue(String code);
    java.util.List<Coupon> findByShopIdAndIsActiveTrue(Long shopId);
    java.util.List<Coupon> findByShopIdIsNullAndIsActiveTrue();
}
