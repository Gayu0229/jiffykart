package com.jiffikart.backend.simulation;

import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class BugSimulationGuardTest {
    private BugSimulationProperties allEnabled() {
        BugSimulationProperties p = new BugSimulationProperties();
        p.setEnabled(true); p.setSimulationEnvironment(true); p.setActivationDate(LocalDate.of(2026,10,10));
        Map<String,Boolean> flags = new HashMap<>();
        for (int i=1;i<=20;i++) flags.put(String.format("bug-%02d",i), true);
        p.setBugs(flags); return p;
    }
    private Clock indiaClock(String instant) { return Clock.fixed(Instant.parse(instant), ZoneId.of("Asia/Kolkata")); }

    @Test void noBugCanRunBeforeOctober10() {
        BugSimulationProperties p=allEnabled();
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-09T18:29:59Z")); // 23:59:59 IST
        for(int i=1;i<=20;i++) assertFalse(g.isActive(String.format("bug-%02d",i)));
    }
    @Test void enabledBugsMayRunAtOctober10Midnight() {
        BugSimulationProperties p=allEnabled();
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-09T18:30:00Z")); // 00:00 IST Oct 10
        assertTrue(g.isActive("bug-01")); assertTrue(g.isActive("bug-20"));
    }
    @Test void enabledBugsMayRunOctober10Noon() {
        BugSimulationProperties p=allEnabled();
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-10T06:30:00Z"));
        assertTrue(g.isActive("bug-07"));
    }
    @Test void enabledBugsMayRunOctober11() {
        BugSimulationProperties p=allEnabled();
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-10T18:30:00Z"));
        assertTrue(g.isActive("bug-10"));
    }
    @Test void globalKillSwitchAlwaysWins() {
        BugSimulationProperties p=allEnabled(); p.setEnabled(false);
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-11T00:00:00Z"));
        assertFalse(g.isActive("bug-01"));
    }
    @Test void simulationEnvironmentGateAlwaysWins() {
        BugSimulationProperties p=allEnabled(); p.setSimulationEnvironment(false);
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-11T00:00:00Z"));
        assertFalse(g.isActive("bug-01"));
    }
    @Test void individualFlagMustBeEnabled() {
        BugSimulationProperties p=allEnabled(); p.getBugs().put("bug-07", false);
        BugSimulationGuard g=new BugSimulationGuard(p, indiaClock("2026-10-11T00:00:00Z"));
        assertFalse(g.isActive("bug-07"));
    }
}
