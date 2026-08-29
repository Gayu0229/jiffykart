package com.jiffikart.backend.security;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * A professional, high-performance Token Bucket Rate Limiter.
 * Thread-safe, in-memory client tracking for API rate limits.
 */
public class RateLimiter {
    private final long capacity;
    private final long refillTokensPerMin;
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public RateLimiter(long capacity, long refillTokensPerMin) {
        this.capacity = capacity;
        this.refillTokensPerMin = refillTokensPerMin;
    }

    public boolean tryConsume(String key) {
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(capacity, refillTokensPerMin));
        return bucket.tryConsume();
    }

    private static class TokenBucket {
        private final long capacity;
        private final long refillTokensPerMin;
        private double tokens;
        private long lastRefillTimestamp;

        public TokenBucket(long capacity, long refillTokensPerMin) {
            this.capacity = capacity;
            this.refillTokensPerMin = refillTokensPerMin;
            this.tokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsedTime = now - lastRefillTimestamp;
            
            // Calculate tokens to add based on elapsed minutes
            double minutesElapsed = (double) elapsedTime / 60000.0;
            double tokensToAdd = minutesElapsed * refillTokensPerMin;
            
            if (tokensToAdd > 0.1) {
                tokens = Math.min(capacity, tokens + tokensToAdd);
                lastRefillTimestamp = now;
            }
        }
    }
}
