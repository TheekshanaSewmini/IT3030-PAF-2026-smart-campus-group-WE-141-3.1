package com.smartcampus.smart_campus.catalog.entities;

import java.time.LocalTime;

import com.smartcampus.smart_campus.catalog.enums.FacilityAssetStatus;
import com.smartcampus.smart_campus.catalog.enums.FacilityAssetType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facility_assets")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class FacilityAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FacilityAssetType type;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(length = 400)
    private String imageUrl;

    @Column(nullable = false)
    private LocalTime availableFrom;

    @Column(nullable = false)
    private LocalTime availableTo;

    @Builder.Default
    @Column(nullable = false)
    private Integer slotDurationMinutes = 60;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FacilityAssetStatus status;
}
