package com.jiffikart.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class FieldManagerAreaRequest {
    private List<UUID> cityIds;
    private List<UUID> zoneIds;
    private List<UUID> pincodeIds;
}
