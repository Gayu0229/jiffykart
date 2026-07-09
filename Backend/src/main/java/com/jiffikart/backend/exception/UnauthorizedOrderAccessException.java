package com.jiffikart.backend.exception;

public class UnauthorizedOrderAccessException extends OrderStatusException {
    public UnauthorizedOrderAccessException() {
        super("UNAUTHORIZED_ACCESS", "You are not allowed to update this order");
    }
}
