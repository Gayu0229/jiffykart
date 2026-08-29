package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Banner;
import com.jiffikart.backend.service.BannerService;
import com.jiffikart.backend.service.FileStorageService;
import com.jiffikart.backend.repository.CityRepository;
import com.jiffikart.backend.repository.ZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class BannerController {

    @Autowired
    private BannerService bannerService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    // ─── PUBLIC APIs ───

    @GetMapping("/public/banners")
    public List<Banner> getPublicBanners(
            @RequestParam(required = false) String position,
            @RequestParam(required = false) UUID cityId,
            @RequestParam(required = false) UUID zoneId
    ) {
        return bannerService.getActiveBanners(position, cityId, zoneId);
    }

    // ─── ADMIN APIs ───

    @GetMapping("/admin/banners")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Banner> getAllBanners(@RequestParam(required = false) String position) {
        return bannerService.getAllBanners(position);
    }

    @PostMapping(value = "/admin/banners", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> createBanner(
            @RequestParam("title") String title,
            @RequestParam(value = "subtitle", required = false) String subtitle,
            @RequestParam(value = "ctaText", required = false) String ctaText,
            @RequestParam(value = "ctaUrl", required = false) String ctaUrl,
            @RequestParam(value = "position", defaultValue = "Home") String position,
            @RequestParam(value = "displayOrder", defaultValue = "0") Integer displayOrder,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "cityId", required = false) UUID cityId,
            @RequestParam(value = "zoneId", required = false) UUID zoneId,
            @RequestParam(value = "imageDesktop", required = false) MultipartFile imageDesktop,
            @RequestParam(value = "imageMobile", required = false) MultipartFile imageMobile
    ) {
        Banner banner = new Banner();
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setCtaText(ctaText);
        banner.setCtaUrl(ctaUrl);
        banner.setPosition(position);
        banner.setDisplayOrder(displayOrder);
        banner.setIsActive(true);

        if (startDate != null && !startDate.isBlank()) {
            banner.setStartDate(LocalDateTime.parse(startDate));
        }
        if (endDate != null && !endDate.isBlank()) {
            banner.setEndDate(LocalDateTime.parse(endDate));
        }

        if (imageDesktop != null && !imageDesktop.isEmpty()) {
            banner.setImageDesktopUrl(fileStorageService.storeFile(imageDesktop));
        }
        if (imageMobile != null && !imageMobile.isEmpty()) {
            banner.setImageMobileUrl(fileStorageService.storeFile(imageMobile));
        }

        if (cityId != null) {
            cityRepository.findById(cityId).ifPresent(banner::setCity);
        }
        if (zoneId != null) {
            zoneRepository.findById(zoneId).ifPresent(banner::setZone);
        }

        return ResponseEntity.ok(bannerService.saveBanner(banner));
    }

    @PutMapping(value = "/admin/banners/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> updateBanner(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "subtitle", required = false) String subtitle,
            @RequestParam(value = "ctaText", required = false) String ctaText,
            @RequestParam(value = "ctaUrl", required = false) String ctaUrl,
            @RequestParam(value = "position") String position,
            @RequestParam(value = "displayOrder") Integer displayOrder,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "cityId", required = false) UUID cityId,
            @RequestParam(value = "zoneId", required = false) UUID zoneId,
            @RequestParam(value = "imageDesktop", required = false) MultipartFile imageDesktop,
            @RequestParam(value = "imageMobile", required = false) MultipartFile imageMobile
    ) {
        Banner banner = bannerService.getBannerById(id);
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setCtaText(ctaText);
        banner.setCtaUrl(ctaUrl);
        banner.setPosition(position);
        banner.setDisplayOrder(displayOrder);

        if (startDate != null && !startDate.isBlank()) {
            banner.setStartDate(LocalDateTime.parse(startDate));
        } else {
            banner.setStartDate(null);
        }
        if (endDate != null && !endDate.isBlank()) {
            banner.setEndDate(LocalDateTime.parse(endDate));
        } else {
            banner.setEndDate(null);
        }

        if (imageDesktop != null && !imageDesktop.isEmpty()) {
            banner.setImageDesktopUrl(fileStorageService.storeFile(imageDesktop));
        }
        if (imageMobile != null && !imageMobile.isEmpty()) {
            banner.setImageMobileUrl(fileStorageService.storeFile(imageMobile));
        }

        if (cityId != null) {
            cityRepository.findById(cityId).ifPresent(banner::setCity);
        } else {
            banner.setCity(null);
        }
        
        if (zoneId != null) {
            zoneRepository.findById(zoneId).ifPresent(banner::setZone);
        } else {
            banner.setZone(null);
        }

        return ResponseEntity.ok(bannerService.saveBanner(banner));
    }

    @DeleteMapping("/admin/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/admin/banners/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> updateStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        return ResponseEntity.ok(bannerService.updateStatus(id, payload.get("isActive")));
    }

    @PutMapping("/admin/banners/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reorderBanners(@RequestBody List<Map<String, Object>> orderList) {
        bannerService.reorderBanners(orderList);
        return ResponseEntity.ok().build();
    }
}
