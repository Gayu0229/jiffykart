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
public class WalletHistoryDTO {
    private Long id;
    private Double amount;
    private String type;
    private String description;
    private String status;
    private LocalDateTime date;
}
