package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.City;
import com.jiffikart.backend.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/public/locations")
public class LocationController {

    @Autowired
    private CityRepository cityRepository;

    @GetMapping("/cities")
    public ResponseEntity<List<City>> getAllCities() {
        return ResponseEntity.ok(cityRepository.findAll());
    }

    @GetMapping("/cities/featured")
    public ResponseEntity<List<City>> getFeaturedCities() {
        // Since CityRepository is a simple JpaRepository, we can use stream or define a method
        // For simplicity, let's just fetch all and filter or define the method in repository if needed.
        // I'll add the method to repository next.
        return ResponseEntity.ok(cityRepository.findByIsFeaturedTrue());
    }

    @Autowired
    private com.jiffikart.backend.repository.ZoneRepository zoneRepository;

    @GetMapping("/zones")
    public ResponseEntity<List<com.jiffikart.backend.entity.Zone>> getZonesByCity(@RequestParam java.util.UUID cityId) {
        System.out.println("[DEBUG] Fetching zones for cityId: " + cityId);
        List<com.jiffikart.backend.entity.Zone> zones = zoneRepository.findByCityId(cityId);
        System.out.println("[DEBUG] Found " + zones.size() + " zones");
        return ResponseEntity.ok(zones);
    }
}
