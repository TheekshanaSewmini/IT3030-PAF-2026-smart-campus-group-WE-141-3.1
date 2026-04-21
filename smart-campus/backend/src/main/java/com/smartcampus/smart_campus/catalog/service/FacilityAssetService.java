package com.smartcampus.smart_campus.catalog.service;

import java.util.List;

import com.smartcampus.smart_campus.catalog.dtos.FacilityAssetDto;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetStatus;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetType;

public interface FacilityAssetService {

    FacilityAssetDto.Response create(FacilityAssetDto.CreateRequest request);

    FacilityAssetDto.Response getById(Long id);

    List<FacilityAssetDto.Response> search(
            FacilityAssetType type,
            Integer minCapacity,
            Integer maxCapacity,
            String location,
            FacilityAssetStatus status
    );

    FacilityAssetDto.Response update(Long id, FacilityAssetDto.UpdateRequest request);

    FacilityAssetDto.Response updateStatus(Long id, FacilityAssetStatus status);

    void delete(Long id);
}
