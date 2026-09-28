package com.jiffikart.backend.controller;

import com.jiffikart.backend.dto.StatsDTO;
import com.jiffikart.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/stats")
@RequiredArgsConstructor
public class PublicStatsController {

    private final StatsService statsService;

    @GetMapping
    public StatsDTO getPublicStats() {
        return statsService.getStats();
    }
}
