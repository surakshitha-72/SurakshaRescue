/**
 * Indian Disaster Data Integration & Ingestion Layer
 *
 * Implements the standard operational pipeline:
 * Source -> Validation -> Timestamp -> Normalize -> Hazard Engine -> Risk Zone
 *
 * Distinguishes data authenticity:
 * - LIVE / VERIFIED DATA (IMD Doppler, CWC Telemetry, ISRO MOSDAC, NDRF verified feeds)
 * - DEMO / MOCK DATA (Simulated crisis scenarios)
 * - STALE DATA (Telemetry exceeding max allowed age threshold)
 * - UNKNOWN DATA (Unverified raw inputs or uncalibrated crowd reports)
 */

import { HazardType, RiskLevel, RiskZone } from '../types/disaster';

export type DataClassification = 'LIVE / VERIFIED' | 'DEMO / MOCK' | 'STALE' | 'UNKNOWN';

export interface RawTelemetryPayload {
  sourceId: string;
  sourceProvider: string;
  sourceCategory: 'Satellite' | 'Weather' | 'Ground Sensor' | 'Community' | 'Historical' | 'Authority';
  hazardType: HazardType;
  reportedAt?: string;
  location: {
    lat: number;
    lng: number;
    name: string;
    state?: string;
    district?: string;
  };
  metrics: {
    rainfallMm?: number;
    riverGaugeMeters?: number;
    dangerLevelMeters?: number;
    rateOfRiseMPerHr?: number;
    windSpeedKmh?: number;
    soilSaturationPercent?: number;
    floodDepthMeters?: number;
    inundationAreaKm2?: number;
    [key: string]: number | undefined;
  };
  isLiveFeed?: boolean;
}

export interface ValidatedTelemetryRecord {
  recordId: string;
  sourceId: string;
  provider: string;
  hazardType: HazardType;
  timestamp: string;
  ageMinutes: number;
  dataClassification: DataClassification;
  isValid: boolean;
  validationErrors: string[];
  location: {
    lat: number;
    lng: number;
    name: string;
    state: string;
    district: string;
  };
  normalizedValues: {
    severityIndex: number; // 0-100
    hazardProbability: number; // 0-100
    waterLevelRelative: number; // meters above/below danger mark
    rateOfRise: number; // m/hr
    rainfallIntensity: number; // mm in observation window
    saturationLevel: number; // 0-100%
  };
  generatedRiskZone?: Partial<RiskZone>;
}

// Bounding box for India
const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 37.6,
  minLng: 68.1,
  maxLng: 97.4
};

export class DataIngestionPipeline {
  /**
   * Stage 1: Validation
   * Checks geospatial boundaries (India only), numerical sanity, and schema correctness
   */
  static validate(raw: RawTelemetryPayload): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!raw.location || typeof raw.location.lat !== 'number' || typeof raw.location.lng !== 'number') {
      errors.push('Missing or invalid GPS coordinates.');
    } else {
      if (
        raw.location.lat < INDIA_BOUNDS.minLat ||
        raw.location.lat > INDIA_BOUNDS.maxLat ||
        raw.location.lng < INDIA_BOUNDS.minLng ||
        raw.location.lng > INDIA_BOUNDS.maxLng
      ) {
        errors.push(`Geospatial coordinate (${raw.location.lat}, ${raw.location.lng}) is outside Indian territorial boundary.`);
      }
    }

    if (!raw.sourceProvider || raw.sourceProvider.trim() === '') {
      errors.push('Unidentified provider source.');
    }

    // Check numerical bounds for physical sensors
    if (raw.metrics.rainfallMm !== undefined && (raw.metrics.rainfallMm < 0 || raw.metrics.rainfallMm > 2000)) {
      errors.push('Rainfall measurement out of physical realm (0 - 2000 mm).');
    }

    if (raw.metrics.riverGaugeMeters !== undefined && (raw.metrics.riverGaugeMeters < -10 || raw.metrics.riverGaugeMeters > 50)) {
      errors.push('River gauge water level measurement out of physical sensor range.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Stage 2: Timestamp & Freshness Evaluation
   * Evaluates if data is LIVE / FRESH, STALE, or UNKNOWN
   */
  static evaluateFreshness(reportedAt?: string, isLiveFeed?: boolean): { timestamp: string; ageMinutes: number; classification: DataClassification } {
    const now = Date.now();
    const reportedTime = reportedAt ? new Date(reportedAt).getTime() : now;
    const diffMs = Math.max(0, now - reportedTime);
    const ageMinutes = Math.floor(diffMs / (60 * 1000));

    let classification: DataClassification;

    if (!reportedAt) {
      classification = 'UNKNOWN';
    } else if (ageMinutes > 180) {
      // Data older than 3 hours without heartbeat is STALE
      classification = 'STALE';
    } else if (isLiveFeed) {
      classification = 'LIVE / VERIFIED';
    } else {
      // Demo scenario or test payload
      classification = 'DEMO / MOCK';
    }

    return {
      timestamp: new Date(reportedTime).toISOString(),
      ageMinutes,
      classification
    };
  }

  /**
   * Stage 3: Normalization
   * Translates varying agency units and metrics into standard hydrological / meteorological indices
   */
  static normalize(metrics: RawTelemetryPayload['metrics']): ValidatedTelemetryRecord['normalizedValues'] {
    const rain = metrics.rainfallMm || 0;
    const gauge = metrics.riverGaugeMeters || 0;
    const danger = metrics.dangerLevelMeters || 4.5;
    const rateRise = metrics.rateOfRiseMPerHr || 0;
    const saturation = metrics.soilSaturationPercent || 50;

    const waterRelative = Math.round((gauge - danger) * 100) / 100;

    // Severity computation based on Indian hydrometeorological thresholds
    let severity = 20;
    if (waterRelative > 1.5 || rain > 150) severity = 95;
    else if (waterRelative > 0.5 || rain > 70) severity = 80;
    else if (waterRelative > 0 || rain > 30) severity = 60;
    else if (saturation > 85) severity = 45;

    // Probability of active inundation
    let probability = Math.min(100, Math.max(10, Math.round(severity * 0.9 + rateRise * 15)));

    return {
      severityIndex: severity,
      hazardProbability: probability,
      waterLevelRelative: waterRelative,
      rateOfRise: rateRise,
      rainfallIntensity: rain,
      saturationLevel: saturation
    };
  }

  /**
   * Stage 4: Hazard Engine & Risk Zone Generation
   * Generates dynamic polygon risk zones based on hydrological impact radius
   */
  static generateRiskZone(
    location: RawTelemetryPayload['location'],
    hazardType: HazardType,
    normalized: ValidatedTelemetryRecord['normalizedValues']
  ): Partial<RiskZone> {
    const riskLevel: RiskLevel =
      normalized.severityIndex >= 85 ? 'Critical' :
      normalized.severityIndex >= 65 ? 'High' :
      normalized.severityIndex >= 40 ? 'Medium' : 'Low';

    const radiusKm =
      riskLevel === 'Critical' ? 4.5 :
      riskLevel === 'High' ? 3.0 :
      riskLevel === 'Medium' ? 1.8 : 0.8;

    // Approximate polygon generation around center
    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((location.lat * Math.PI) / 180));

    const polygonCoordinates: [number, number][] = [
      [location.lat + latDelta, location.lng],
      [location.lat + latDelta * 0.7, location.lng + lngDelta * 0.7],
      [location.lat, location.lng + lngDelta],
      [location.lat - latDelta * 0.7, location.lng + lngDelta * 0.7],
      [location.lat - latDelta, location.lng],
      [location.lat - latDelta * 0.7, location.lng - lngDelta * 0.7],
      [location.lat, location.lng - lngDelta],
      [location.lat + latDelta * 0.7, location.lng - lngDelta * 0.7],
      [location.lat + latDelta, location.lng]
    ];

    return {
      id: `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${location.name} Hazard Impact Perimeter`,
      hazardType,
      riskLevel,
      probability: normalized.hazardProbability,
      polygon: polygonCoordinates,
      population: Math.round(radiusKm * radiusKm * 1800),
      vulnerablePopulation: Math.round(radiusKm * radiusKm * 650),
      severity: riskLevel === 'Critical' ? 'Severe' : riskLevel === 'High' ? 'High' : 'Moderate',
      recommendedAction: riskLevel === 'Critical' || riskLevel === 'High'
        ? 'Immediate evacuation and activation of safe relief corridors.'
        : 'Advisory monitoring and stage preparation.',
      nearbyShelterIds: []
    };
  }

  /**
   * Complete End-to-End Pipeline Execution:
   * Source -> Validation -> Timestamp -> Normalize -> Hazard Engine -> Risk Zone
   */
  static process(raw: RawTelemetryPayload): ValidatedTelemetryRecord {
    const validation = this.validate(raw);
    const freshness = this.evaluateFreshness(raw.reportedAt, raw.isLiveFeed);
    const normalized = this.normalize(raw.metrics);
    const riskZone = validation.isValid ? this.generateRiskZone(raw.location, raw.hazardType, normalized) : undefined;

    return {
      recordId: `telemetry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourceId: raw.sourceId,
      provider: raw.sourceProvider,
      hazardType: raw.hazardType,
      timestamp: freshness.timestamp,
      ageMinutes: freshness.ageMinutes,
      dataClassification: freshness.classification,
      isValid: validation.isValid,
      validationErrors: validation.errors,
      location: {
        lat: raw.location.lat,
        lng: raw.location.lng,
        name: raw.location.name,
        state: raw.location.state || 'Bihar',
        district: raw.location.district || 'Supaul'
      },
      normalizedValues: normalized,
      generatedRiskZone: riskZone
    };
  }
}
