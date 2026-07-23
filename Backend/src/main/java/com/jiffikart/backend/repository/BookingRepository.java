package com.jiffikart.backend.repository;

import com.jiffikart.backend.entity.Booking;
import com.jiffikart.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByShopId(Long shopId);
    List<Booking> findByUserId(Long userId);
    Optional<Booking> findByBookingId(String bookingId);
    List<Booking> findByShopIdAndBookingDate(Long shopId, LocalDate date);
    List<Booking> findByTableIdAndBookingDateAndStatusNot(Long tableId, LocalDate date, BookingStatus status);
    List<Booking> findByStatus(BookingStatus status);
}
