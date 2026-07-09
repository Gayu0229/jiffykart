package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Product;
import com.jiffikart.backend.entity.ProductStatus;
import com.jiffikart.backend.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByShop_Id(Long shopId);
    List<Product> findByShop_IdIn(List<Long> shopIds);
    List<Product> findByShop(Shop shop);
    List<Product> findByShopAndStatus(Shop shop, ProductStatus status);
    long countByShop_IdAndStatus(Long shopId, ProductStatus status);

    List<Product> findByCategory(String category);
    List<Product> findByStatus(ProductStatus status);
    List<Product> findByCategoryAndStatus(String category, ProductStatus status);
    long countByCategory(String category);

    // Published products: status=PUBLISHED, isActive=true, vendor shop approved + active (or no shop), stockQuantity > 0
    @Query("SELECT p FROM Product p LEFT JOIN p.shop s WHERE p.status = 'PUBLISHED' AND p.isActive = true AND p.stockQuantity > 0 AND (s IS NULL OR (s.approvalStatus = 'APPROVED' AND s.isActive = true))")
    List<Product> findPublishedProducts();

    @Query("SELECT p FROM Product p LEFT JOIN p.shop s WHERE p.status = 'PUBLISHED' AND p.isActive = true AND p.stockQuantity > 0 AND (s IS NULL OR (s.approvalStatus = 'APPROVED' AND s.isActive = true)) AND p.category = :category")
    List<Product> findPublishedByCategory(@Param("category") String category);

    @Query("SELECT p FROM Product p LEFT JOIN p.shop s WHERE p.status = 'PUBLISHED' AND p.isActive = true AND p.stockQuantity > 0 AND (s IS NULL OR s.shopType = 'Official' OR (s.approvalStatus = 'APPROVED' AND s.isActive = true)) AND p.showOnHome = true")
    List<Product> findPublishedForHome();

    @Query("SELECT p FROM Product p LEFT JOIN p.shop s WHERE p.status = 'PUBLISHED' AND p.isActive = true AND p.stockQuantity > 0 AND (s IS NULL OR s.shopType = 'Official' OR (s.approvalStatus = 'APPROVED' AND s.isActive = true)) AND p.showOnJiffyStreet = true")
    List<Product> findPublishedForJiffyStreet();

    @Query("SELECT p FROM Product p WHERE p.status = 'PUBLISHED' AND p.isActive = true AND p.showOnJiffyCafe = true")
    List<Product> findPublishedForJiffyCafe();

    @Query("SELECT p FROM Product p LEFT JOIN p.shop s WHERE p.status = 'PUBLISHED' AND p.isActive = true AND (s IS NULL OR (s.approvalStatus = 'APPROVED' AND s.isActive = true)) AND (s.city = :cityName OR p.id IN (SELECT lpd.product.id FROM LocationProductDetail lpd WHERE lpd.city.name = :cityName AND lpd.isActive = true))")
    List<Product> findPublishedByCity(@Param("cityName") String cityName);
}
