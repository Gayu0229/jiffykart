package com.jiffikart.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatsDTO {
    private long verifiedSellers;
    private int avgDeliveryMins;
    private long citiesLive;
    private double userRating;
}
