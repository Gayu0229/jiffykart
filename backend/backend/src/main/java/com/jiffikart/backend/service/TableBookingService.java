package com.jiffikart.backend.service;

import com.jiffikart.backend.entity.*;
import com.jiffikart.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TableBookingService {

    @Autowired
    private RestaurantTableRepository tableRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private WaitlistRepository waitlistRepository;

    @Autowired
    private RestaurantStaffRepository staffRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Finds available tables for a shop at a specific date, time slot, and guest count.
     */
    public List<RestaurantTable> findAvailableTables(Long shopId, LocalDate date, String timeSlot, Integer guestCount) {
        List<RestaurantTable> allTables = tableRepository.findByShopId(shopId);
        
        return allTables.stream().filter(table -> {
            // Check capacity
            if (table.getCapacity() < guestCount) return false;
            
            // Check maintenance/blocked
            if (table.getStatus() == TableStatus.MAINTENANCE || table.getStatus() == TableStatus.BLOCKED) return false;
            
            // Check temporary locks
            if (table.getLockedUntil() != null && table.getLockedUntil().isAfter(LocalDateTime.now())) return false;
            
            // Check overlapping bookings
            List<Booking> overlapping = bookingRepository.findByTableIdAndBookingDateAndStatusNot(
                    table.getId(), date, BookingStatus.CANCELLED
            );
            boolean isBooked = overlapping.stream().anyMatch(b -> 
                b.getTimeSlot().equalsIgnoreCase(timeSlot) && 
                b.getStatus() != BookingStatus.COMPLETED && 
                b.getStatus() != BookingStatus.REJECTED &&
                b.getStatus() != BookingStatus.NO_SHOW
            );
            
            return !isBooked;
        }).toList();
    }

    /**
     * Lock a table temporarily for 5 minutes during checkout.
     */
    @Transactional
    public boolean lockTable(Long tableId, Long userId) {
        Optional<RestaurantTable> tableOpt = tableRepository.findById(tableId);
        if (tableOpt.isEmpty()) return false;
        
        RestaurantTable table = tableOpt.get();
        // Check if currently locked by someone else
        if (table.getLockedUntil() != null && table.getLockedUntil().isAfter(LocalDateTime.now()) && !table.getLockedByUserId().equals(userId)) {
            return false;
        }
        
        table.setLockedUntil(LocalDateTime.now().plusMinutes(5));
        table.setLockedByUserId(userId);
        tableRepository.save(table);
        
        broadcastTableUpdate(table.getShop().getId());
        return true;
    }

    /**
     * Release a temporary table lock.
     */
    @Transactional
    public void unlockTable(Long tableId) {
        tableRepository.findById(tableId).ifPresent(table -> {
            table.setLockedUntil(null);
            table.setLockedByUserId(null);
            tableRepository.save(table);
            broadcastTableUpdate(table.getShop().getId());
        });
    }

    /**
     * Scheduled task to clean up expired table locks.
     */
    @Scheduled(fixedRate = 60000) // Runs every minute
    @Transactional
    public void cleanExpiredLocks() {
        List<RestaurantTable> tables = tableRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;
        
        for (RestaurantTable table : tables) {
            if (table.getLockedUntil() != null && table.getLockedUntil().isBefore(now)) {
                table.setLockedUntil(null);
                table.setLockedByUserId(null);
                tableRepository.save(table);
                changed = true;
            }
        }
        
        if (changed) {
            // Send general update
            messagingTemplate.convertAndSend("/topic/bookings/general", "Locks updated");
        }
    }

    /**
     * Create a confirmed booking.
     */
    @Transactional
    public Booking createBooking(Long shopId, Long userId, Long tableId, LocalDate date, String timeSlot, Integer guestCount, String seatingArea, String specialRequests, String foodPreOrder) {
        Shop shop = shopRepository.findById(shopId).orElseThrow(() -> new IllegalArgumentException("Invalid shop ID"));
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Invalid user ID"));
        RestaurantTable table = null;
        
        if (tableId != null) {
            table = tableRepository.findById(tableId).orElseThrow(() -> new IllegalArgumentException("Invalid table ID"));
            // Release lock and mark table as reserved
            table.setLockedUntil(null);
            table.setLockedByUserId(null);
            table.setStatus(TableStatus.RESERVED);
            tableRepository.save(table);
        }

        String uniqueId = "TB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Booking booking = Booking.builder()
                .bookingId(uniqueId)
                .shop(shop)
                .user(user)
                .table(table)
                .bookingDate(date)
                .timeSlot(timeSlot)
                .guestCount(guestCount)
                .seatingArea(seatingArea)
                .specialRequests(specialRequests)
                .status(BookingStatus.PENDING)
                .qrCode(uniqueId) // Use unique ID as QR text for simplicity
                .foodPreOrder(foodPreOrder)
                .build();
                
        Booking saved = bookingRepository.save(booking);
        
        // Notify vendor & customer
        broadcastBookingUpdate(saved);
        broadcastTableUpdate(shopId);
        
        return saved;
    }

    /**
     * Update booking status.
     */
    @Transactional
    public Booking updateBookingStatus(Long bookingId, BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
                
        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(newStatus);
        
        // Handle side-effects on tables
        RestaurantTable table = booking.getTable();
        if (table != null) {
            if (newStatus == BookingStatus.CHECKED_IN || newStatus == BookingStatus.DINING) {
                table.setStatus(TableStatus.OCCUPIED);
            } else if (newStatus == BookingStatus.COMPLETED || newStatus == BookingStatus.CANCELLED || newStatus == BookingStatus.REJECTED || newStatus == BookingStatus.NO_SHOW) {
                table.setStatus(TableStatus.CLEANING);
                // In a real application, cleaning might take some time, but we can set up a task or let staff mark it available.
                // For simplicity, let's start a cleaning state and allow staff to complete it.
            }
            tableRepository.save(table);
        }
        
        Booking saved = bookingRepository.save(booking);
        
        // Waitlist triggers
        if ((oldStatus != BookingStatus.COMPLETED && newStatus == BookingStatus.COMPLETED) || 
            (oldStatus != BookingStatus.CANCELLED && newStatus == BookingStatus.CANCELLED)) {
            processWaitlistOnTableRelease(booking.getShop().getId());
        }

        broadcastBookingUpdate(saved);
        broadcastTableUpdate(booking.getShop().getId());
        
        return saved;
    }

    /**
     * Process Waitlist when a table becomes available.
     */
    @Transactional
    public void processWaitlistOnTableRelease(Long shopId) {
        List<Waitlist> waiting = waitlistRepository.findByShopIdAndStatusOrderByQueuePositionAsc(shopId, "WAITING");
        if (waiting.isEmpty()) return;
        
        // Look for any newly available table
        List<RestaurantTable> available = tableRepository.findByShopIdAndStatus(shopId, TableStatus.AVAILABLE);
        if (available.isEmpty()) return;
        
        for (Waitlist wait : waiting) {
            // Find a table with matching capacity
            Optional<RestaurantTable> match = available.stream()
                    .filter(t -> t.getCapacity() >= wait.getGuestCount())
                    .findFirst();
                    
            if (match.isPresent()) {
                RestaurantTable t = match.get();
                // Update waitlist status
                wait.setStatus("NOTIFIED");
                wait.setNotifiedAt(LocalDateTime.now());
                waitlistRepository.save(wait);
                
                // Temporarily reserve/lock table for this waitlist customer
                t.setStatus(TableStatus.RESERVED);
                t.setLockedUntil(LocalDateTime.now().plusMinutes(5));
                t.setLockedByUserId(wait.getUser().getId());
                tableRepository.save(t);
                
                // Notify the user via websocket
                messagingTemplate.convertAndSend("/topic/waitlist/user/" + wait.getUser().getId(), wait);
                break;
            }
        }
    }

    /**
     * Join waitlist.
     */
    @Transactional
    public Waitlist joinWaitlist(Long shopId, Long userId, Integer guestCount, String seatingArea) {
        Shop shop = shopRepository.findById(shopId).orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Find current max queue position
        List<Waitlist> currentQueue = waitlistRepository.findByShopIdAndStatusOrderByQueuePositionDesc(shopId, "WAITING");
        int nextPos = currentQueue.isEmpty() ? 1 : currentQueue.get(0).getQueuePosition() + 1;
        
        Waitlist wait = Waitlist.builder()
                .shop(shop)
                .user(user)
                .guestCount(guestCount)
                .seatingArea(seatingArea)
                .queuePosition(nextPos)
                .status("WAITING")
                .build();
                
        Waitlist saved = waitlistRepository.save(wait);
        
        // Broadcast queue update to shop
        messagingTemplate.convertAndSend("/topic/waitlist/shop/" + shopId, saved);
        return saved;
    }

    /**
     * Update customer location / ETA.
     */
    @Transactional
    public Booking updateLocationETA(String bookingId, Double lat, Double lng, Integer etaMinutes) {
        Booking booking = bookingRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
                
        booking.setLatitude(lat);
        booking.setLongitude(lng);
        booking.setEtaMinutes(etaMinutes);
        
        Booking saved = bookingRepository.save(booking);
        
        // Send live ETA update to vendor floor plan and live board
        messagingTemplate.convertAndSend("/topic/bookings/shop/" + booking.getShop().getId() + "/arrivals", saved);
        return saved;
    }

    // --- Helper Broadcasts ---
    private void broadcastBookingUpdate(Booking booking) {
        messagingTemplate.convertAndSend("/topic/bookings/shop/" + booking.getShop().getId(), booking);
        messagingTemplate.convertAndSend("/topic/bookings/user/" + booking.getUser().getId(), booking);
    }
    
    private void broadcastTableUpdate(Long shopId) {
        List<RestaurantTable> tables = tableRepository.findByShopId(shopId);
        messagingTemplate.convertAndSend("/topic/bookings/shop/" + shopId + "/tables", tables);
    }
}
