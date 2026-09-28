package com.jiffikart.backend.simulation;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "jiffykart.bug-simulation")
public class BugSimulationProperties {
    private boolean enabled = false;
    private boolean simulationEnvironment = false;
    private LocalDate activationDate = LocalDate.of(2026, 10, 10);
    private String timezone = "Asia/Kolkata";
    private long delayMs = 3000;
    private long recoveryDurationMs = 30000;
    private String testHeader = "X-JK-Simulation";
    private String testHeaderValue = "true";
    private String testOrigin = "http://localhost:3002";
    private Map<String, Boolean> bugs = new HashMap<>();

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isSimulationEnvironment() { return simulationEnvironment; }
    public void setSimulationEnvironment(boolean simulationEnvironment) { this.simulationEnvironment = simulationEnvironment; }
    public LocalDate getActivationDate() { return activationDate; }
    public void setActivationDate(LocalDate activationDate) { this.activationDate = activationDate; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    public long getDelayMs() { return delayMs; }
    public void setDelayMs(long delayMs) { this.delayMs = delayMs; }
    public long getRecoveryDurationMs() { return recoveryDurationMs; }
    public void setRecoveryDurationMs(long recoveryDurationMs) { this.recoveryDurationMs = recoveryDurationMs; }
    public String getTestHeader() { return testHeader; }
    public void setTestHeader(String testHeader) { this.testHeader = testHeader; }
    public String getTestHeaderValue() { return testHeaderValue; }
    public void setTestHeaderValue(String testHeaderValue) { this.testHeaderValue = testHeaderValue; }
    public String getTestOrigin() { return testOrigin; }
    public void setTestOrigin(String testOrigin) { this.testOrigin = testOrigin; }
    public Map<String, Boolean> getBugs() { return bugs; }
    public void setBugs(Map<String, Boolean> bugs) { this.bugs = bugs; }
    public boolean isBugEnabled(String bugId) { return Boolean.TRUE.equals(bugs.get(bugId.toLowerCase())); }
}
