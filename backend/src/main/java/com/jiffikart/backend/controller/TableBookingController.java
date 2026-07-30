package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.RestaurantTableRepository;
import com.jiffikart.backend.repository.RestaurantStaffRepository;
import com.jiffikart.backend.repository.BookingRepository;
import com.jiffikart.backend.repository.ShopRepository;
import com.jiffikart.backend.repository.UserRepository;
import com.jiffikart.backend.service.TableBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class TableBookingController {

    @Autowired
    private TableBookingService bookingService;

    @Autowired
    private RestaurantTableRepository tableRepository;

    @Autowired
    private RestaurantStaffRepository staffRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private UserRepository userRepository;

    // --- Customer Table Discovery ---
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableTables(
            @RequestParam Long shopId,
            @RequestParam String date,
            @RequestParam String timeSlot,
            @RequestParam Integer guestCount) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            List<RestaurantTable> available = bookingService.findAvailableTables(shopId, localDate, timeSlot, guestCount);
            return ResponseEntity.ok(available);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error parsing params or checking availability: " + e.getMessage());
        }
    }

    // --- Temporary Table Locks ---
    @PostMapping("/lock")
    public ResponseEntity<?> lockTable(@RequestBody LockRequest request) {
        boolean success = bookingService.lockTable(request.getTableId(), request.getUserId());
        if (success) {
            return ResponseEntity.ok("Table locked successfully");
        } else {
            return ResponseEntity.badRequest().body("Table is already locked or unavailable");
        }
    }

    @PostMapping("/unlock")
    public ResponseEntity<?> unlockTable(@RequestBody LockRequest request) {
        bookingService.unlockTable(request.getTableId());
        return ResponseEntity.ok("Table unlocked");
    }

    // --- Reservation Booking ---
    @PostMapping("/book")
    public ResponseEntity<?> createBooking(@RequestBody BookRequest request) {
        try {
            LocalDate localDate = LocalDate.parse(request.getDate());
            Booking booking = bookingService.createBooking(
                    request.getShopId(),
                    request.getUserId(),
                    request.getTableId(),
                    localDate,
                    request.getTimeSlot(),
                    request.getGuestCount(),
                    request.getSeatingArea(),
                    request.getSpecialRequests(),
                    request.getFoodPreOrder()
            );
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create booking: " + e.getMessage());
        }
    }

    // --- Booking Fetch Mappings ---
    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<Booking>> getShopBookings(@PathVariable Long shopId) {
        return ResponseEntity.ok(bookingRepository.findByShopId(shopId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingRepository.findByUserId(userId));
    }

    @PutMapping("/{bookingId}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestParam BookingStatus status) {
        try {
            Booking booking = bookingService.updateBookingStatus(bookingId, status);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Status update failed: " + e.getMessage());
        }
    }

    // --- Table CRUD (Vendor Dashboard Operations) ---
    @GetMapping("/tables/{shopId}")
    public ResponseEntity<List<RestaurantTable>> getTablesByShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(tableRepository.findByShopId(shopId));
    }

    @PostMapping("/tables")
    public ResponseEntity<?> saveOrUpdateTable(@RequestBody RestaurantTable table) {
        if (table.getShop() == null || table.getShop().getId() == null) {
            return ResponseEntity.badRequest().body("Shop ID is required");
        }
        Optional<Shop> shopOpt = shopRepository.findById(table.getShop().getId());
        if (shopOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Shop not found");
        }
        table.setShop(shopOpt.get());
        RestaurantTable saved = tableRepository.save(table);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<?> deleteTable(@PathVariable Long id) {
        tableRepository.deleteById(id);
        return ResponseEntity.ok("Table deleted");
    }

    // --- Waitlist ---
    @PostMapping("/waitlist")
    public ResponseEntity<?> joinWaitlist(@RequestBody WaitlistRequest request) {
        try {
            Waitlist wait = bookingService.joinWaitlist(
                    request.getShopId(),
                    request.getUserId(),
                    request.getGuestCount(),
                    request.getSeatingArea()
            );
            return ResponseEntity.ok(wait);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Waitlist request failed: " + e.getMessage());
        }
    }

    // --- Staff management ---
    @GetMapping("/staff/{shopId}")
    public ResponseEntity<List<RestaurantStaff>> getStaffByShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(staffRepository.findByShopId(shopId));
    }

    @PostMapping("/staff")
    public ResponseEntity<?> addStaff(@RequestBody StaffRequest request) {
        Optional<Shop> shopOpt = shopRepository.findById(request.getShopId());
        Optional<User> userOpt = userRepository.findById(request.getUserId());
        if (shopOpt.isEmpty() || userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Shop or User not found");
        }
        
        RestaurantStaff staff = RestaurantStaff.builder()
                .shop(shopOpt.get())
                .user(userOpt.get())
                .role(request.getRole())
                .build();
                
        RestaurantStaff saved = staffRepository.save(staff);
        return ResponseEntity.ok(saved);
    }

    // --- Inner DTOs ---
    public static class LockRequest {
        private Long tableId;
        private Long userId;

        public Long getTableId() { return tableId; }
        public void setTableId(Long tableId) { this.tableId = tableId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
    }

    public static class BookRequest {
        private Long shopId;
        private Long userId;
        private Long tableId;
        private String date;
        private String timeSlot;
        private Integer guestCount;
        private String seatingArea;
        private String specialRequests;
        private String foodPreOrder;

        public Long getShopId() { return shopId; }
        public void setShopId(Long shopId) { this.shopId = shopId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getTableId() { return tableId; }
        public void setTableId(Long tableId) { this.tableId = tableId; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getTimeSlot() { return timeSlot; }
        public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }
        public Integer getGuestCount() { return guestCount; }
        public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }
        public String getSeatingArea() { return seatingArea; }
        public void setSeatingArea(String seatingArea) { this.seatingArea = seatingArea; }
        public String getSpecialRequests() { return specialRequests; }
        public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }
        public String getFoodPreOrder() { return foodPreOrder; }
        public void setFoodPreOrder(String foodPreOrder) { this.foodPreOrder = foodPreOrder; }
    }

    public static class WaitlistRequest {
        private Long shopId;
        private Long userId;
        private Integer guestCount;
        private String seatingArea;

        public Long getShopId() { return shopId; }
        public void setShopId(Long shopId) { this.shopId = shopId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Integer getGuestCount() { return guestCount; }
        public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }
        public String getSeatingArea() { return seatingArea; }
        public void setSeatingArea(String seatingArea) { this.seatingArea = seatingArea; }
    }

    public static class StaffRequest {
        private Long shopId;
        private Long userId;
        private String role;

        public Long getShopId() { return shopId; }
        public void setShopId(Long shopId) { this.shopId = shopId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
