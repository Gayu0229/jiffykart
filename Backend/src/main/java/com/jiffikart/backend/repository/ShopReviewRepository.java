package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.ShopReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopReviewRepository extends JpaRepository<ShopReview, Long> {
    List<ShopReview> findByShopIdOrderByCreatedAtDesc(Long shopId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM ShopReview r")
    Double getAverageRating();
}
