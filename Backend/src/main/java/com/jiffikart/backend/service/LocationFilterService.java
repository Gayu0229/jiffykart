package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LocationFilterService {

    @Autowired
    private FieldManagerAreaRepository areaRepository;

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private PincodeRepository pincodeRepository;

    public Set<String> getEffectivePincodesForFieldManager(Long fieldManagerId) {
        List<FieldManagerArea> areas = areaRepository.findByFieldManagerId(fieldManagerId);
        Set<String> effectivePincodes = new HashSet<>();

        for (FieldManagerArea area : areas) {
            if (area.getCity() != null) {
                // Expand City to all Zones, then all Pincodes
                List<Zone> zones = zoneRepository.findByCityId(area.getCity().getId());
                for (Zone zone : zones) {
                    List<Pincode> pincodes = pincodeRepository.findByZoneId(zone.getId());
                    effectivePincodes.addAll(pincodes.stream().map(Pincode::getPincode).collect(Collectors.toSet()));
                }
            } else if (area.getZone() != null) {
                // Expand Zone to all Pincodes
                List<Pincode> pincodes = pincodeRepository.findByZoneId(area.getZone().getId());
                effectivePincodes.addAll(pincodes.stream().map(Pincode::getPincode).collect(Collectors.toSet()));
            } else if (area.getPincode() != null) {
                // Add specific Pincode
                effectivePincodes.add(area.getPincode().getPincode());
            }
        }

        return effectivePincodes;
    }

    public boolean isPincodeAccessible(Long fieldManagerId, String pincode) {
        Set<String> accessiblePincodes = getEffectivePincodesForFieldManager(fieldManagerId);
        return accessiblePincodes.contains(pincode);
    }
}
