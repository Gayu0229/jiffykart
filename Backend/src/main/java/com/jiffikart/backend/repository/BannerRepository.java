package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface BannerRepository extends JpaRepository<Banner, Long> {
    List<Banner> findByIsActiveTrueOrderByDisplayOrderAsc();
    List<Banner> findByPositionAndIsActiveTrueOrderByDisplayOrderAsc(String position);
    
    // City & Zone Filtering
    List<Banner> findByPositionAndIsActiveTrueAndCityIdAndZoneIdOrderByDisplayOrderAsc(String position, UUID cityId, UUID zoneId);
    List<Banner> findByPositionAndIsActiveTrueAndCityIdAndZoneIdIsNullOrderByDisplayOrderAsc(String position, UUID cityId);
    List<Banner> findByPositionAndIsActiveTrueAndCityIdIsNullAndZoneIdIsNullOrderByDisplayOrderAsc(String position);
    
    // For Admin: Get all banners by position regardless of status
    List<Banner> findByPositionOrderByDisplayOrderAsc(String position);
}
