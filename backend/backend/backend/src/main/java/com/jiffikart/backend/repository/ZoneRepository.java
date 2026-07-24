package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.City;
import com.jiffikart.backend.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ZoneRepository extends JpaRepository<Zone, UUID> {
    List<Zone> findByCity(City city);
    List<Zone> findByCityId(UUID cityId);
}
