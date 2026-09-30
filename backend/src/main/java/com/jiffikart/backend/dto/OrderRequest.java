package com.jiffikart.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private Long userId;
    private Long shopId;
    private List<OrderItemRequest> items;
    private String address;
    private String paymentMethod;
    private java.util.UUID zoneId;
}
