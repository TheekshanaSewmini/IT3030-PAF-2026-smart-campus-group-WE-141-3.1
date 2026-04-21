package com.smartcampus.smart_campus.catalog.service;

import com.smartcampus.smart_campus.catalog.dtos.FacilityAssetDto;
import com.smartcampus.smart_campus.catalog.entities.FacilityAsset;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetStatus;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetType;
import com.smartcampus.smart_campus.catalog.repo.FacilityAssetRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityAssetServiceImpl implements FacilityAssetService {

    private final FacilityAssetRepository facilityAssetRepository;

    @Transactional
    @Override
    public FacilityAssetDto.Response create(FacilityAssetDto.CreateRequest request) {
        validateAvailabilityWindow(request.availableFrom(), request.availableTo());

        FacilityAsset facilityAsset = FacilityAsset.builder()
                .name(request.name().trim())
                .type(request.type())
                .capacity(request.capacity())
                .location(request.location().trim())
                .availableFrom(request.availableFrom())
                .availableTo(request.availableTo())
                .status(request.status())
                .build();

        return toResponse(facilityAssetRepository.save(facilityAsset));
    }

    @Override
    public FacilityAssetDto.Response getById(Long id) {
        return toResponse(getEntityById(id));
    }

    @Override
    public List<FacilityAssetDto.Response> search(
            FacilityAssetType type,
            Integer minCapacity,
            Integer maxCapacity,
            String location,
            FacilityAssetStatus status
    ) {
        if (minCapacity != null && maxCapacity != null && minCapacity > maxCapacity) {
            throw new RuntimeException("minCapacity cannot be greater than maxCapacity");
        }

        Specification<FacilityAsset> specification = (root, query, cb) -> cb.conjunction();

        if (type != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }

        if (minCapacity != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
        }

        if (maxCapacity != null) {
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("capacity"), maxCapacity));
        }

        if (location != null && !location.isBlank()) {
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase().trim() + "%"));
        }

        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        return facilityAssetRepository.findAll(specification)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @Override
    public FacilityAssetDto.Response update(Long id, FacilityAssetDto.UpdateRequest request) {
        validateAvailabilityWindow(request.availableFrom(), request.availableTo());

        FacilityAsset facilityAsset = getEntityById(id);
        facilityAsset.setName(request.name().trim());
        facilityAsset.setType(request.type());
        facilityAsset.setCapacity(request.capacity());
        facilityAsset.setLocation(request.location().trim());
        facilityAsset.setAvailableFrom(request.availableFrom());
        facilityAsset.setAvailableTo(request.availableTo());
        facilityAsset.setStatus(request.status());

        return toResponse(facilityAssetRepository.save(facilityAsset));
    }

    @Transactional
    @Override
    public FacilityAssetDto.Response updateStatus(Long id, FacilityAssetStatus status) {
        FacilityAsset facilityAsset = getEntityById(id);
        facilityAsset.setStatus(status);
        return toResponse(facilityAssetRepository.save(facilityAsset));
    }

    @Transactional
    @Override
    public void delete(Long id) {
        FacilityAsset facilityAsset = getEntityById(id);
        facilityAssetRepository.delete(facilityAsset);
    }

    private FacilityAsset getEntityById(Long id) {
        return facilityAssetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility asset not found"));
    }

    private FacilityAssetDto.Response toResponse(FacilityAsset facilityAsset) {
        return new FacilityAssetDto.Response(
                facilityAsset.getId(),
                facilityAsset.getName(),
                facilityAsset.getType(),
                facilityAsset.getCapacity(),
                facilityAsset.getLocation(),
                facilityAsset.getAvailableFrom(),
                facilityAsset.getAvailableTo(),
                facilityAsset.getStatus()
        );
    }

    private void validateAvailabilityWindow(java.time.LocalTime availableFrom, java.time.LocalTime availableTo) {
        if (!availableFrom.isBefore(availableTo)) {
            throw new RuntimeException("availableFrom must be earlier than availableTo");
        }
    }
}
