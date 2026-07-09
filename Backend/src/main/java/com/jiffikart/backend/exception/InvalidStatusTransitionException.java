package com.jiffikart.backend.exception;

public class InvalidStatusTransitionException extends OrderStatusException {
    public InvalidStatusTransitionException(String currentStatus, String nextStatus) {
        super("INVALID_ORDER_STATUS_TRANSITION", 
              String.format("Cannot change status from %s to %s", currentStatus, nextStatus));
    }
}
