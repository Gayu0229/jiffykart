package com.jiffikart.backend.simulation;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Clock;
import java.time.ZoneId;

@Configuration
@EnableConfigurationProperties(BugSimulationProperties.class)
public class BugSimulationConfiguration {
    @Bean
    public Clock bugSimulationClock(BugSimulationProperties properties) {
        return Clock.system(ZoneId.of(properties.getTimezone()));
    }
}
