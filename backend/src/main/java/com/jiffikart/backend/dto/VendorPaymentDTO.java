package com.jiffikart.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorPaymentDTO {
    private Long vendorId;
    private Long shopId;
    private String shopName;
    private String ownerName;
    private String email;
    private String phone;
    private Double walletBalance;
    private Double pendingPayout;
    private LocalDateTime lastPayoutDate;
    private String shopStatus;
}
