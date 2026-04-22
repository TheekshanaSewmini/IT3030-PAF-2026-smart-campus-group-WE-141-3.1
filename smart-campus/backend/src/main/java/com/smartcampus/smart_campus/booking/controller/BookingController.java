package com.smartcampus.smart_campus.booking.controller;

import com.smartcampus.smart_campus.booking.dtos.BookingDto;
import com.smartcampus.smart_campus.booking.service.BookingService;
import com.smartcampus.smart_campus.entities.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/booking")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/create")
    public ResponseEntity<BookingDto.BookingResponse> createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BookingDto.CreateBookingRequest request) {

        return ResponseEntity.ok(bookingService.createBooking(user, request));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<BookingDto.BookingResponse> updateBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingDto.UpdateBookingRequest request) {

        return ResponseEntity.ok(bookingService.updateBooking(user, bookingId, request));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<String> cancelBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId) {

        bookingService.cancelBooking(user, bookingId);
        return ResponseEntity.ok("Booking cancelled successfully");
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto.BookingResponse>> getMyBookings(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(bookingService.getMyBookings(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<List<BookingDto.BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending")
    public ResponseEntity<List<BookingDto.BookingResponse>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getPendingBookings());
    }

    @GetMapping("/available-resources")
    public ResponseEntity<List<BookingDto.AvailableResourceResponse>> getAvailableResources(
            @RequestParam LocalDate bookingDate,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime
    ) {
        return ResponseEntity.ok(bookingService.getAvailableResources(bookingDate, startTime, endTime));
    }

    @GetMapping("/resources/{facilityAssetId}/availability")
    public ResponseEntity<BookingDto.ResourceAvailabilityResponse> getResourceAvailability(
            @PathVariable Long facilityAssetId,
            @RequestParam LocalDate bookingDate
    ) {
        return ResponseEntity.ok(bookingService.getResourceAvailability(facilityAssetId, bookingDate));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{bookingId}/approve")
    public ResponseEntity<BookingDto.BookingResponse> approveBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.approveBooking(bookingId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{bookingId}/reject")
    public ResponseEntity<BookingDto.BookingResponse> rejectBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.rejectBooking(bookingId));
    }
}
