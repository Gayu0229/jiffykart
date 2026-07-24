package com.jiffikart.backend.exception;

public abstract class OrderStatusException extends RuntimeException {
    private final String error;

    public OrderStatusException(String error, String message) {
        super(message);
        this.error = error;
    }

    public String getError() {
        return error;
    }
}
