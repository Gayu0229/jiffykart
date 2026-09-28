package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.LocationProductDetail;
import com.jiffikart.backend.repository.LocationProductDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class LocationProductService {

    @Autowired
    private LocationProductDetailRepository locationProductDetailRepository;

    public LocationProductDetail getDetailForProductAndCity(Long productId, UUID cityId) {
        return locationProductDetailRepository.findByProductIdAndCityId(productId, cityId).orElse(null);
    }

    public List<LocationProductDetail> getAllDetailsForProduct(Long productId) {
        return locationProductDetailRepository.findByProductId(productId);
    }
}
