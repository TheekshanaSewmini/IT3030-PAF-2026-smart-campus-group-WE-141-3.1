package com.smartcampus.smart_campus.booking.service;

import com.smartcampus.smart_campus.booking.dtos.BookingDto;
import com.smartcampus.smart_campus.booking.entities.Booking;
import com.smartcampus.smart_campus.booking.enums.BookingStatus;
import com.smartcampus.smart_campus.booking.repo.BookingRepository;
import com.smartcampus.smart_campus.entities.User;
import com.smartcampus.smart_campus.enums.Role;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;

    @Transactional
    @Override
    public BookingDto.BookingResponse createBooking(User user, BookingDto.CreateBookingRequest request) {
        validateTimeRange(request.bookingDate(), request.startTime(), request.endTime());
        validateConflicts(request.location(), request.bookingDate(), request.startTime(), request.endTime(), null);

        Booking booking = Booking.builder()
                .title(request.title())
                .description(request.description())
                .location(request.location())
                .bookingDate(request.bookingDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .status(BookingStatus.PENDING)
                .bookedBy(user)
                .build();

        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    @Override
    public BookingDto.BookingResponse updateBooking(User user, Long bookingId, BookingDto.UpdateBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateOwnerOrAdmin(user, booking);
        validateMutableStatus(booking);
        validateTimeRange(request.bookingDate(), request.startTime(), request.endTime());
        validateConflicts(request.location(), request.bookingDate(), request.startTime(), request.endTime(), bookingId);

        booking.setTitle(request.title());
        booking.setDescription(request.description());
        booking.setLocation(request.location());
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setStatus(BookingStatus.PENDING);

        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    @Override
    public void cancelBooking(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        validateOwnerOrAdmin(user, booking);

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    @Override
    public List<BookingDto.BookingResponse> getMyBookings(User user) {
        return bookingRepository.findByBookedByUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<BookingDto.BookingResponse> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @Override
    public BookingDto.BookingResponse approveBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cancelled booking cannot be approved");
        }

        booking.setStatus(BookingStatus.APPROVED);
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    @Override
    public BookingDto.BookingResponse rejectBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cancelled booking cannot be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        return toResponse(bookingRepository.save(booking));
    }

    private void validateMutableStatus(Booking booking) {
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cancelled booking cannot be updated");
        }
    }

    private void validateTimeRange(LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new RuntimeException("End time must be after start time");
        }

        if (bookingDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Booking date cannot be in the past");
        }
    }

    private void validateConflicts(String location,
                                   LocalDate bookingDate,
                                   LocalTime startTime,
                                   LocalTime endTime,
                                   Long currentBookingId) {
        List<Booking> conflicts = bookingRepository.findConflicts(location, bookingDate, startTime, endTime);

        boolean hasConflicts = conflicts.stream()
                .anyMatch(b -> !b.getBookingId().equals(currentBookingId));

        if (hasConflicts) {
            throw new RuntimeException("Time slot already booked for this location");
        }
    }

    private void validateOwnerOrAdmin(User user, Booking booking) {
        boolean isOwner = booking.getBookedBy().getUserId().equals(user.getUserId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("You are not allowed to modify this booking");
        }
    }

    private BookingDto.BookingResponse toResponse(Booking booking) {
        return new BookingDto.BookingResponse(
                booking.getBookingId(),
                booking.getTitle(),
                booking.getDescription(),
                booking.getLocation(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getBookedBy().getUserId(),
                booking.getBookedBy().getEmail()
        );
    }
}
