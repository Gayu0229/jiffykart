package com.jiffikart.backend.service;

import com.jiffikart.backend.dto.StatsDTO;
import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.entity.Shop;
import com.jiffikart.backend.entity.ShopReview;
import com.jiffikart.backend.repository.OrderRepository;
import com.jiffikart.backend.repository.ShopRepository;
import com.jiffikart.backend.repository.ShopReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.OptionalDouble;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class StatsService {

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ShopReviewRepository shopReviewRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final AtomicReference<StatsDTO> cachedStats = new AtomicReference<>();

    @PostConstruct
    public void init() {
        updateAndBroadcast();
    }

    public StatsDTO getStats() {
        if (cachedStats.get() == null) {
            updateCache();
        }
        return cachedStats.get();
    }

    public void updateAndBroadcast() {
        StatsDTO stats = updateCache();
        messagingTemplate.convertAndSend("/topic/public-stats", stats);
    }

    private StatsDTO updateCache() {
        // 1. Verified Sellers: Count of vendors where kycStatus = 'VERIFIED' and isActive = true
        long verifiedSellers = shopRepository.countByKycStatusAndIsActive("VERIFIED", true);

        // 2. Avg Delivery Time: Calculated from DELIVERED orders
        Integer avgDeliveryMins = orderRepository.getAverageDeliveryTime();
        if (avgDeliveryMins == null) {
            avgDeliveryMins = 28; // Default fallback
        }

        // 3. Cities Live: Count of distinct cities where vendors are ACTIVE
        long citiesLive = shopRepository.countDistinctCityByIsActive(true);

        // 4. User Rating: Average rating from reviews table
        Double userRatingRaw = shopReviewRepository.getAverageRating();
        double userRating = 0.0; // Default fallback changed to 0.0
        if (userRatingRaw != null) {
            userRating = Math.round(userRatingRaw * 10.0) / 10.0;
        }

        StatsDTO stats = StatsDTO.builder()
                .verifiedSellers(verifiedSellers)
                .avgDeliveryMins(avgDeliveryMins)
                .citiesLive(citiesLive)
                .userRating(userRating)
                .build();

        cachedStats.set(stats);
        return stats;
    }
}
