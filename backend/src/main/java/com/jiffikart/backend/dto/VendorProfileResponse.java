package com.jiffikart.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorProfileResponse {
    private String shopName;
    private String businessType;
    private String category;
    private String gstNumber;
    private String businessAddress;
    private String city;
    private String state;
    private String area;
    private String bannerUrl;
    private String logoUrl;
    private String status;
    private String email;
    private String phone;
    private String pincode;
    private String vendorType;
    private String businessModel;
    private Long shopId;
}
