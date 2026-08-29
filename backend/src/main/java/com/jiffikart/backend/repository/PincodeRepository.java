package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Pincode;
import com.jiffikart.backend.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PincodeRepository extends JpaRepository<Pincode, UUID> {
    List<Pincode> findByZone(Zone zone);
    List<Pincode> findByZoneId(UUID zoneId);
    Optional<Pincode> findByPincode(String pincode);
}
