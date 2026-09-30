package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Order;
import com.jiffikart.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor/orders")
public class VendorOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/{shopId}")
    public ResponseEntity<List<Order>> getShopOrders(@PathVariable Long shopId) {
        return ResponseEntity.ok(orderRepository.findByShop_Id(shopId));
    }
}
