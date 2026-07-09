package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
import java.util.UUID;

public interface CityRepository extends JpaRepository<City, UUID> {
    Optional<City> findByNameIgnoreCase(String name);
    List<City> findByIsFeaturedTrue();
}
