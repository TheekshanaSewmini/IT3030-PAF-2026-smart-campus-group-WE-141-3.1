package com.smartcampus.smart_campus.catalog.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.smart_campus.catalog.dtos.FacilityAssetDto;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetStatus;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetType;
import com.smartcampus.smart_campus.catalog.service.FacilityAssetService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
public class FacilityAssetController {

    private final FacilityAssetService facilityAssetService;

    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PostMapping
    public ResponseEntity<FacilityAssetDto.Response> create(
            @Valid @RequestBody FacilityAssetDto.CreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facilityAssetService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityAssetDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityAssetService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<FacilityAssetDto.Response>> search(
            @RequestParam(required = false) FacilityAssetType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer maxCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) FacilityAssetStatus status
    ) {
        return ResponseEntity.ok(
                facilityAssetService.search(type, minCapacity, maxCapacity, location, status)
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PutMapping("/{id}")
    public ResponseEntity<FacilityAssetDto.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody FacilityAssetDto.UpdateRequest request
    ) {
        return ResponseEntity.ok(facilityAssetService.update(id, request));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<FacilityAssetDto.Response> updateStatus(
            @PathVariable Long id,
            @RequestParam FacilityAssetStatus status
    ) {
        return ResponseEntity.ok(facilityAssetService.updateStatus(id, status));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityAssetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
