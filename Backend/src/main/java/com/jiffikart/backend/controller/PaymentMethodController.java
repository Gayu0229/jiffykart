package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.PaymentMethod;
import com.jiffikart.backend.repository.PaymentMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customer/payments")
public class PaymentMethodController {
    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @GetMapping
    public List<PaymentMethod> getPaymentMethods(@RequestParam Long userId) {
        return paymentMethodRepository.findByUserId(userId);
    }


    @PostMapping
    public PaymentMethod addPaymentMethod(@RequestBody PaymentMethod method) {
        return paymentMethodRepository.save(method);
    }


}
