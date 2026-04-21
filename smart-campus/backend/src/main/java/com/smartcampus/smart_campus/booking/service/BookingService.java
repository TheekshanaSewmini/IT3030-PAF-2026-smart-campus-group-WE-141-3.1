package com.smartcampus.smart_campus.booking.service;

import com.smartcampus.smart_campus.booking.dtos.BookingDto;
import com.smartcampus.smart_campus.entities.User;

import java.util.List;

public interface BookingService {

    BookingDto.BookingResponse createBooking(User user, BookingDto.CreateBookingRequest request);

    BookingDto.BookingResponse updateBooking(User user, Long bookingId, BookingDto.UpdateBookingRequest request);

    void cancelBooking(User user, Long bookingId);

    List<BookingDto.BookingResponse> getMyBookings(User user);

    List<BookingDto.BookingResponse> getAllBookings();

    BookingDto.BookingResponse approveBooking(Long bookingId);

    BookingDto.BookingResponse rejectBooking(Long bookingId);
}
