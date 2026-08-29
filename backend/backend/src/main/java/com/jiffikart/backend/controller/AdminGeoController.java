package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.FieldManagerAreaRequest;
import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/geo")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGeoController {

    private static final java.util.Set<String> SUPPORTED_CITIES = java.util.Set.of("Chennai", "Bengaluru");

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private PincodeRepository pincodeRepository;

    @Autowired
    private FieldManagerAreaRepository areaRepository;

    @Autowired
    private UserRepository userRepository;

    // --- City Management ---
    @GetMapping("/cities")
    public List<City> getAllCities() {
        return cityRepository.findAll().stream()
                .filter(city -> SUPPORTED_CITIES.contains(city.getName()))
                .collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/cities")
    public City createCity(@RequestBody City city) {
        if (!SUPPORTED_CITIES.contains(city.getName())) {
            throw new RuntimeException("City not supported. Supported cities are: " + SUPPORTED_CITIES);
        }
        return cityRepository.save(city);
    }

    // --- Zone Management ---
    @GetMapping("/zones")
    public List<Zone> getZonesByCity(@RequestParam UUID cityId) {
        return zoneRepository.findByCityId(cityId);
    }

    @PostMapping("/zones")
    public Zone createZone(@RequestBody Zone zone) {
        return zoneRepository.save(zone);
    }

    // --- Pincode Management ---
    @GetMapping("/pincodes")
    public List<Pincode> getPincodesByZone(@RequestParam UUID zoneId) {
        return pincodeRepository.findByZoneId(zoneId);
    }

    @PostMapping("/pincodes")
    public Pincode createPincode(@RequestBody Pincode pincode) {
        return pincodeRepository.save(pincode);
    }

    // --- Field Manager Area Assignments ---
    @PostMapping("/field-managers/{userId}/areas")
    @Transactional
    public ResponseEntity<?> assignAreas(@PathVariable Long userId, @RequestBody FieldManagerAreaRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Remove existing assignments
        areaRepository.deleteByFieldManagerId(userId);

        // Assign Cities
        if (request.getCityIds() != null) {
            for (UUID cityId : request.getCityIds()) {
                City city = cityRepository.findById(cityId).orElse(null);
                if (city != null) {
                    areaRepository.save(FieldManagerArea.builder().fieldManager(user).city(city).build());
                }
            }
        }

        // Assign Zones
        if (request.getZoneIds() != null) {
            for (UUID zoneId : request.getZoneIds()) {
                Zone zone = zoneRepository.findById(zoneId).orElse(null);
                if (zone != null) {
                    areaRepository.save(FieldManagerArea.builder().fieldManager(user).zone(zone).build());
                }
            }
        }

        // Assign Pincodes
        if (request.getPincodeIds() != null) {
            for (UUID pincodeId : request.getPincodeIds()) {
                Pincode pincode = pincodeRepository.findById(pincodeId).orElse(null);
                if (pincode != null) {
                    areaRepository.save(FieldManagerArea.builder().fieldManager(user).pincode(pincode).build());
                }
            }
        }

        return ResponseEntity.ok("Areas assigned successfully");
    }

    @GetMapping("/field-managers/{userId}/areas")
    public List<FieldManagerArea> getAssignedAreas(@PathVariable Long userId) {
        return areaRepository.findByFieldManagerId(userId);
    }
}
