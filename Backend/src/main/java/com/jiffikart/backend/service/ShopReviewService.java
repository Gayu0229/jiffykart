package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.ShopReview;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.ShopReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopReviewService {

    private final ShopReviewRepository shopReviewRepository;
    private final StatsService statsService;

    public List<ShopReview> getReviewsByShop(Long shopId) {
        return shopReviewRepository.findByShopIdOrderByCreatedAtDesc(shopId);
    }

    @Transactional
    public ShopReview addReview(Shop shop, User user, Integer rating, String comment) {
        ShopReview review = ShopReview.builder()
                .shopId(shop.getId())
                .userName(user.getName())
                .rating(rating)
                .comment(comment)
                .isVerified(true) // Assuming verified for now
                .build();
        
        ShopReview savedReview = shopReviewRepository.save(review);
        
        // Trigger stats update
        statsService.updateAndBroadcast();
        
        return savedReview;
    }
}
