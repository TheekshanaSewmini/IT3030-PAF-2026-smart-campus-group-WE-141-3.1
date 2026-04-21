package com.smartcampus.smart_campus.booking.dtos;

import com.smartcampus.smart_campus.booking.enums.BookingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class BookingDto {

    public record CreateBookingRequest(
            @NotBlank(message = "Title is required")
            String title,

            String description,

            @NotBlank(message = "Location is required")
            String location,

            @NotNull(message = "Booking date is required")
            LocalDate bookingDate,

            @NotNull(message = "Start time is required")
            LocalTime startTime,

            @NotNull(message = "End time is required")
            LocalTime endTime
    ) {}

    public record UpdateBookingRequest(
            @NotBlank(message = "Title is required")
            String title,

            String description,

            @NotBlank(message = "Location is required")
            String location,

            @NotNull(message = "Booking date is required")
            LocalDate bookingDate,

            @NotNull(message = "Start time is required")
            LocalTime startTime,

            @NotNull(message = "End time is required")
            LocalTime endTime
    ) {}

    public record BookingResponse(
            Long bookingId,
            String title,
            String description,
            String location,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            BookingStatus status,
            LocalDateTime createdAt,
            Long bookedByUserId,
            String bookedByEmail
    ) {}
}
