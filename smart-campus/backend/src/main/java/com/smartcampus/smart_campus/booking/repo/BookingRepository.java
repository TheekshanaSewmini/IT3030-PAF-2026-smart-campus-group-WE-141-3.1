package com.smartcampus.smart_campus.booking.repo;

import com.smartcampus.smart_campus.booking.entities.Booking;
import com.smartcampus.smart_campus.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByBookedByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.location = :location
              AND b.bookingDate = :bookingDate
              AND b.status <> com.smartcampus.smart_campus.booking.enums.BookingStatus.CANCELLED
              AND b.status <> com.smartcampus.smart_campus.booking.enums.BookingStatus.REJECTED
              AND (:startTime < b.endTime AND :endTime > b.startTime)
            """)
    List<Booking> findConflicts(
            @Param("location") String location,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
