package com.smartcampus.smart_campus.catalog.dtos;

import java.time.LocalTime;

import com.smartcampus.smart_campus.catalog.enums.FacilityAssetStatus;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FacilityAssetDto {

    public record CreateRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotNull(message = "Type is required")
            FacilityAssetType type,

            @NotNull(message = "Capacity is required")
            @Min(value = 1, message = "Capacity must be at least 1")
            Integer capacity,

            @NotBlank(message = "Location is required")
            String location,

            @NotNull(message = "availableFrom is required")
            LocalTime availableFrom,

            @NotNull(message = "availableTo is required")
            LocalTime availableTo,

            @NotNull(message = "Status is required")
            FacilityAssetStatus status
    ) {}

    public record UpdateRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotNull(message = "Type is required")
            FacilityAssetType type,

            @NotNull(message = "Capacity is required")
            @Min(value = 1, message = "Capacity must be at least 1")
            Integer capacity,

            @NotBlank(message = "Location is required")
            String location,

            @NotNull(message = "availableFrom is required")
            LocalTime availableFrom,

            @NotNull(message = "availableTo is required")
            LocalTime availableTo,

            @NotNull(message = "Status is required")
            FacilityAssetStatus status
    ) {}

    public record Response(
            Long id,
            String name,
            FacilityAssetType type,
            Integer capacity,
            String location,
            LocalTime availableFrom,
            LocalTime availableTo,
            FacilityAssetStatus status
    ) {}
}
