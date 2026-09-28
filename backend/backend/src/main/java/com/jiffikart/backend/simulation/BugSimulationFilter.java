package com.jiffikart.backend.simulation;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class BugSimulationFilter extends OncePerRequestFilter {
    private final BugSimulationGuard guard;
    private final BugSimulationProperties props;
    private final Map<String, Instant> recoveryStarts = new ConcurrentHashMap<>();

    public BugSimulationFilter(BugSimulationGuard guard, BugSimulationProperties props) {
        this.guard = guard;
        this.props = props;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String testHeader = req.getHeader(props.getTestHeader());
        if (!guard.isDesignatedTestRequest(testHeader)) {
            chain.doFilter(req, res); return;
        }
        String uri = req.getRequestURI();
        String method = req.getMethod();

        if (active("bug-01")) returnJson(res, 503, "JK-1010", "JiffyKart is temporarily unavailable (simulation)");
        if (active("bug-02") && method.equals("POST") && uri.equals("/api/bookings/book")) returnJson(res, 503, "BOOKING_CREATION_FAILED", "Simulated booking creation failure");
        if (active("bug-03") && uri.startsWith("/api/bookings")) { delay(); returnJson(res, 504, "BOOKING_TIMEOUT", "Simulated booking timeout"); }
        if (active("bug-04") && method.equals("POST") && (uri.equals("/api/bookings/book") || uri.equals("/api/bookings/lock"))) returnJson(res, 409, "SEAT_UNAVAILABLE", "Simulated stale seat availability");
        if (active("bug-05") && uri.startsWith("/api/bookings") && method.equals("PUT")) returnJson(res, 503, "WAITLIST_PROMOTION_FAILED", "Simulated waitlist promotion failure");
        if (active("bug-06") && method.equals("POST") && uri.equals("/api/bookings/book")) returnJson(res, 503, "PREORDER_SERVICE_UNAVAILABLE", "Simulated food pre-order failure");
        if (active("bug-07") && method.equals("POST") && uri.equals("/api/razorpay/payment/verify")) returnJson(res, 400, "PAYMENT_VERIFICATION_FAILED", "Simulated verification only; provider was not contacted");
        if (active("bug-08") && method.equals("POST") && uri.equals("/api/bookings/book")) returnJson(res, 409, "DUPLICATE_BOOKING_REQUEST", "Simulated duplicate request; no booking created");
        if (active("bug-09") && method.equals("PUT") && uri.startsWith("/api/vendor/orders")) returnJson(res, 409, "ORDER_STATUS_TRANSITION_FAILED", "Simulated vendor status transition failure");
        if (active("bug-10") && uri.startsWith("/api/vendor") && method.equals("GET")) returnJson(res, 503, "VENDOR_DASHBOARD_UNAVAILABLE", "Simulated vendor dashboard failure");
        if (active("bug-11") && method.equals("GET") && (uri.startsWith("/api/shops/") || uri.startsWith("/api/public/vendor/"))) returnJson(res, 503, "RESTAURANT_DETAILS_UNAVAILABLE", "Simulated restaurant details failure");
        if (active("bug-12") && method.equals("POST") && uri.startsWith("/api/customer/reviews")) returnJson(res, 503, "REVIEW_SUBMISSION_FAILED", "Simulated review submission failure");
        if (active("bug-13") && method.equals("GET") && uri.startsWith("/api/wallet/")) returnJson(res, 200, "SIMULATED_REWARDS", "Simulated rewards response; real balance unchanged", "points", 80);
        if (active("bug-14") && uri.startsWith("/api/notifications") && method.equals("POST")) returnJson(res, 503, "NOTIFICATION_DELIVERY_FAILED", "Simulated notification failure; no external delivery");
        if (active("bug-15") && uri.startsWith("/ws")) returnJson(res, 503, "WEBSOCKET_DISCONNECT_SIMULATED", "Designated test WebSocket connection rejected");
        if (active("bug-16")) { req.setAttribute("JK_SIMULATED_CACHE_MISS", Boolean.TRUE); guard.logActivation("BUG-16", "Simulated cache miss; request continues to database/service fallback"); }
        if (active("bug-17")) { delay(); guard.logActivation("BUG-17", "Simulated slow database/service operation"); }
        if (active("bug-18") && props.getTestOrigin().equals(req.getHeader("Origin"))) { res.setStatus(403); return; }
        if (active("bug-19") && method.equals("GET") && uri.startsWith("/api/shops/")) { res.setStatus(200); res.setContentType("application/json"); res.getWriter().write("{\"id\":123,\"simulation\":true}"); return; }
        if (active("bug-20")) {
            Instant start = recoveryStarts.computeIfAbsent("bug-20", k -> Instant.now());
            if (Instant.now().isBefore(start.plusMillis(props.getRecoveryDurationMs()))) returnJson(res, 503, "AUTO_RECOVERY_ACTIVE", "Simulated recoverable incident");
            recoveryStarts.remove("bug-20"); guard.logActivation("BUG-20", "Automatic recovery completed");
        }
        chain.doFilter(req, res);
    }

    private boolean active(String id) { return guard.isActive(id); }
    private void delay() { try { Thread.sleep(Math.max(0, props.getDelayMs())); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }
    private void returnJson(HttpServletResponse res, int status, String code, String message) throws IOException { returnJson(res,status,code,message,null,null); }
    private void returnJson(HttpServletResponse res, int status, String code, String message, String extraKey, Object extraValue) throws IOException {
        guard.logActivation(code.startsWith("JK-") ? "BUG-01" : code, message);
        res.setStatus(status); res.setContentType("application/json");
        String extra = extraKey == null ? "" : ",\""+extraKey+"\":"+(extraValue instanceof Number ? extraValue : "\""+extraValue+"\"");
        res.getWriter().write("{\"simulation\":true,\"error\":\""+code+"\",\"message\":\""+message.replace("\"","'")+"\""+extra+"}");
    }
}
