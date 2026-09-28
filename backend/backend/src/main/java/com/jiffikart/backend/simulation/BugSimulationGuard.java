package com.jiffikart.backend.simulation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.LocalDate;

@Service
public class BugSimulationGuard {
    private static final Logger log = LoggerFactory.getLogger(BugSimulationGuard.class);
    private final BugSimulationProperties properties;
    private final Clock clock;

    public BugSimulationGuard(BugSimulationProperties properties, Clock bugSimulationClock) {
        this.properties = properties;
        this.clock = bugSimulationClock;
    }

    public boolean isActive(String bugId) {
        if (!properties.isSimulationEnvironment() || !properties.isEnabled()) return false;
        LocalDate today = LocalDate.now(clock);
        if (today.isBefore(properties.getActivationDate())) return false;
        return properties.isBugEnabled(bugId);
    }

    public boolean isDesignatedTestRequest(String headerValue) {
        return properties.getTestHeaderValue().equalsIgnoreCase(headerValue == null ? "" : headerValue.trim());
    }

    public void logActivation(String bugId, String message) {
        log.warn("BUG_SIMULATION bugId={} date={} simulation=true message=\"{}\"", bugId, LocalDate.now(clock), message);
    }
}
