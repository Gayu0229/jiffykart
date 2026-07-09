package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.Banner;
import com.jiffikart.backend.repository.BannerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.util.ArrayList;
import java.util.UUID;

@Service
public class BannerService {

    @Autowired
    private BannerRepository bannerRepository;

    public List<Banner> getActiveBanners(String position) {
        return getActiveBanners(position, null, null);
    }

    public List<Banner> getActiveBanners(String position, UUID cityId, UUID zoneId) {
        LocalDateTime now = LocalDateTime.now();
        List<Banner> banners;
        
        if (position == null || position.isBlank()) {
            banners = bannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        } else {
            // Priority: Fetch all relevant banners. We will use distinct() later.
            banners = new ArrayList<>();
            if (cityId != null && zoneId != null) {
                banners.addAll(bannerRepository.findByPositionAndIsActiveTrueAndCityIdAndZoneIdOrderByDisplayOrderAsc(position, cityId, zoneId));
            }
            if (cityId != null) {
                banners.addAll(bannerRepository.findByPositionAndIsActiveTrueAndCityIdAndZoneIdIsNullOrderByDisplayOrderAsc(position, cityId));
            }
            banners.addAll(bannerRepository.findByPositionAndIsActiveTrueAndCityIdIsNullAndZoneIdIsNullOrderByDisplayOrderAsc(position));
        }

        return banners.stream()
                .filter(b -> b.getIsActive())
                .filter(b -> b.getStartDate() == null || b.getStartDate().isBefore(now))
                .filter(b -> b.getEndDate() == null || b.getEndDate().isAfter(now))
                .distinct()
                .collect(Collectors.toList());
    }

    public List<Banner> getAllBanners(String position) {
        if (position != null && !position.isBlank()) {
            return bannerRepository.findByPositionOrderByDisplayOrderAsc(position);
        }
        return bannerRepository.findAll();
    }

    public Banner saveBanner(Banner banner) {
        if (banner.getDisplayOrder() == null) {
            banner.setDisplayOrder(0);
        }
        if (banner.getIsActive() == null) {
            banner.setIsActive(true);
        }
        return bannerRepository.save(banner);
    }

    public void deleteBanner(Long id) {
        bannerRepository.deleteById(id);
    }

    public Banner updateStatus(Long id, Boolean status) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
        banner.setIsActive(status);
        return bannerRepository.save(banner);
    }

    @Transactional
    public void reorderBanners(List<Map<String, Object>> orderList) {
        for (Map<String, Object> item : orderList) {
            Long id = Long.valueOf(item.get("id").toString());
            Integer order = Integer.valueOf(item.get("order").toString());
            bannerRepository.findById(id).ifPresent(banner -> {
                banner.setDisplayOrder(order);
                bannerRepository.save(banner);
            });
        }
    }
    
    public Banner getBannerById(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
    }
}
