package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Address;
import com.jiffikart.backend.entity.User;
import com.jiffikart.backend.repository.AddressRepository;
import com.jiffikart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class AddressController {
    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}/addresses")
    public List<Address> getAddresses(@PathVariable Long userId) {
        return addressRepository.findByUserId(userId);
    }

    @PostMapping("/{userId}/addresses")
    public Address addAddress(@PathVariable Long userId, @RequestBody Address address) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        address.setUser(user);
        return addressRepository.save(address);
    }

    @PutMapping("/{userId}/addresses/{addressId}")
    public Address updateAddress(@PathVariable Long userId, @PathVariable Long addressId, @RequestBody Address addressDetails) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        
        address.setType(addressDetails.getType());
        address.setAddressLine1(addressDetails.getAddressLine1());
        address.setAddressLine2(addressDetails.getAddressLine2());
        address.setIsDefault(addressDetails.getIsDefault());
        
        return addressRepository.save(address);
    }

    @DeleteMapping("/{userId}/addresses/{addressId}")
    public void deleteAddress(@PathVariable Long userId, @PathVariable Long addressId) {
        addressRepository.deleteById(addressId);
    }
}
