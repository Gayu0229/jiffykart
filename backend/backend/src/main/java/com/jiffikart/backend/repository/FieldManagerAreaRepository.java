package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.FieldManagerArea;
import com.jiffikart.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FieldManagerAreaRepository extends JpaRepository<FieldManagerArea, UUID> {
    List<FieldManagerArea> findByFieldManager(User fieldManager);
    List<FieldManagerArea> findByFieldManagerId(Long fieldManagerId);
    void deleteByFieldManagerId(Long fieldManagerId);
}
