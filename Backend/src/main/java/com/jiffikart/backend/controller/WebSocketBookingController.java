package com.jiffikart.backend.controller;

import com.jiffikart.backend.entity.Booking;
import com.jiffikart.backend.service.TableBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketBookingController {

    @Autowired
    private TableBookingService bookingService;

    @MessageMapping("/booking/location")
    public void receiveTravelLocation(@Payload LocationUpdateMessage message) {
        bookingService.updateLocationETA(
                message.getBookingId(),
                message.getLatitude(),
                message.getLongitude(),
                message.getEtaMinutes()
        );
    }

    public static class LocationUpdateMessage {
        private String bookingId;
        private Double latitude;
        private Double longitude;
        private Integer etaMinutes;

        public String getBookingId() { return bookingId; }
        public void setBookingId(String bookingId) { this.bookingId = bookingId; }
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
        public Integer getEtaMinutes() { return etaMinutes; }
        public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }
    }
}
