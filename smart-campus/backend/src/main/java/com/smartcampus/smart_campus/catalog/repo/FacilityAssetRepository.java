package com.smartcampus.smart_campus.catalog.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.smartcampus.smart_campus.catalog.entities.FacilityAsset;

public interface FacilityAssetRepository extends JpaRepository<FacilityAsset, Long>, JpaSpecificationExecutor<FacilityAsset> {
}
