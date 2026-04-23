package com.smartcampus.smart_campus.catalog.repo;

import com.smartcampus.smart_campus.catalog.enums.FacilityAssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.smartcampus.smart_campus.catalog.entities.FacilityAsset;

import java.time.LocalTime;
import java.util.List;

public interface FacilityAssetRepository extends JpaRepository<FacilityAsset, Long>, JpaSpecificationExecutor<FacilityAsset> {
    List<FacilityAsset> findByStatusAndAvailableFromLessThanEqualAndAvailableToGreaterThanEqualOrderByNameAsc(
            FacilityAssetStatus status,
            LocalTime availableFrom,
            LocalTime availableTo
    );
}
