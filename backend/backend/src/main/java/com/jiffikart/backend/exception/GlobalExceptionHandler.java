package com.jiffikart.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderStatusException.class)
    public ResponseEntity<?> handleOrderStatusException(OrderStatusException e) {
        HttpStatus status = (e instanceof UnauthorizedOrderAccessException)
                            ? HttpStatus.FORBIDDEN
                            : HttpStatus.BAD_REQUEST;

        return ResponseEntity.status(status).body(Map.of(
            "error", e.getError(),
            "message", e.getMessage()
        ));
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<?> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        System.err.println("[ERROR] RuntimeException caught in GlobalExceptionHandler:");
        ex.printStackTrace();
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDuplicate(DataIntegrityViolationException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", "Duplicate data detected (phone/email already exists)"
        ));
    }
}
