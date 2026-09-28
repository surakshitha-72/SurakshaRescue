export type HazardType = 'Flood' | 'Landslide' | 'Cyclone' | 'Earthquake' | 'Extreme Rainfall';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'ADMIN' | 'AUTHORITY' | 'RESCUE_TEAM' | 'VOLUNTEER' | 'VIEWER';

export type RouteSegmentStatus = 'SAFE' | 'RISKY' | 'BLOCKED' | 'UNKNOWN';

export type AlertStatus = 'New' | 'Under Review' | 'Verified' | 'Rejected' | 'Converted to Disaster Event';

export type AlertDeliveryStatus = 'DELIVERED' | 'FAILED' | 'PENDING' | 'MANUAL CONTACT COMPLETED';

export type TeamStatus = 'Available' | 'Assigned' | 'En Route' | 'Rescuing' | 'Returning' | 'Offline';

export type ReservationStatus = 'RESERVED' | 'OCCUPIED' | 'CANCELLED' | 'EXPIRED';

export interface DemographicBreakdown {
  total: number;
  children: number;
  elderly: number;
  disabilities: number;
  pregnantWomen: number;
  medicalDependency: number;
  povertyIndex: number; // 0-100
}

export interface Habitation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  demographics: DemographicBreakdown;
  distanceToNearestShelterKm: number;
  roadAccessibilityScore: number; // 0-100 (100 = paved multi-lane, 20 = dirt track)
  hazardExposureScore: number; // 0-100
  responseDifficultyScore: number; // 0-100
  vulnerabilityScore: number; // 0-100 calculated
  vulnerabilityLevel: RiskLevel;
  evacuationStatus: 'Normal' | 'Alerted' | 'Evacuating' | 'Evacuated' | 'Cut-off' | 'Rescued';
  currentHazard?: HazardType;
  evacuatedCount: number;
  assignedShelterId?: string;
  assignedTeamId?: string;
  rescuedAt?: string;
  rescuedCount?: number;
  rescueNotes?: string;
  rescuedByTeam?: string;
}

export interface HazardPrediction {
  id: string;
  hazardType: HazardType;
  probability: number; // 0-100
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic';
  confidence: number; // 0-100
  affectedAreaKm2: number;
  expectedPopulation: number;
  timestamp: string;
  modelUsed: string;
  contributingFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
  explanation?: string;
}

export interface RiskZone {
  id: string;
  name: string;
  hazardType: HazardType;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'; // Green, Yellow, Red/Critical
  polygon: [number, number][];
  population: number;
  vulnerablePopulation: number;
  probability: number;
  severity: string;
  recommendedAction: string;
  nearbyShelterIds: string[];
}

export interface Shelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  totalCapacity: number;
  occupiedCapacity: number;
  reservedCapacity: number;
  availableCapacity: number; // calculated: total - occupied - reserved
  medicalCapacity: 'Basic' | 'Advanced' | 'Hospital Grade';
  waterCapacityDays: number;
  foodCapacityDays: number;
  accessibility: 'High' | 'Moderate' | 'Difficult';
  status: 'Operational' | 'Near Capacity' | 'Full' | 'Isolated';
  activeReservations: ShelterReservation[];
}

export interface ShelterReservation {
  id: string;
  shelterId: string;
  shelterName: string;
  teamId: string;
  teamName: string;
  habitationId: string;
  habitationName: string;
  reservedCount: number;
  timestamp: string;
  expiresAt: string;
  status: ReservationStatus;
}

export interface RescueTeam {
  id: string;
  name: string;
  unit: string;
  currentLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  teamCapacity: number; // number of responders
  vehicleCapacity: number; // people they can transport per trip
  medicalCapability: 'Paramedic' | 'Doctor' | 'Basic First Aid';
  boatAvailability: boolean;
  boatCount: number;
  equipment: string[];
  currentAssignment?: {
    habitationId: string;
    habitationName: string;
    shelterId: string;
    task: string;
    startedAt: string;
  };
  status: TeamStatus;
}

export interface RouteSegment {
  id: string;
  name: string;
  from: string;
  to: string;
  status: RouteSegmentStatus;
  hazardType?: HazardType;
  coordinates: [number, number][];
  hazardProximityKm: number;
  blockageReason?: string;
  lastUpdated: string;
}

export interface TurnByTurnStep {
  instruction: string;
  distanceMeters: number;
  roadName: string;
  action: 'straight' | 'turn-left' | 'turn-right' | 'take-exit' | 'arrive';
}

export interface EvacuationRoute {
  id: string;
  habitationId: string;
  habitationName: string;
  shelterId: string;
  shelterName: string;
  isPrimary: boolean;
  distanceKm: number;
  estimatedTravelTimeMin: number;
  riskLevel: 'SAFE' | 'RISKY' | 'BLOCKED';
  statusText?: 'CLEAR' | 'CAUTION' | 'BLOCKED' | 'UNKNOWN';
  roadConditionNote?: string;
  hazards?: string[];
  lastUpdatedTime?: string;
  turnByTurnSteps?: TurnByTurnStep[];
  reason: string;
  waypoints: [number, number][];
  segments: RouteSegment[];
}

export interface GPSLocation {
  lat: number;
  lng: number;
  name: string;
  source: 'GPS_DEVICE' | 'MANUAL_STATION' | 'CUSTOM_MAP';
  accuracy?: number;
}

export interface DisasterRegion {
  id: string;
  name: string;
  state: string;
  hazardType: HazardType;
  center: [number, number];
  zoom: number;
  description: string;
}

export interface DisasterAlert {
  id: string;
  source: 'Government Authority' | 'Weather Agency (IMD)' | 'River Sensor Network' | 'Satellite Analysis (ISRO)' | 'Community Report' | 'NGO' | 'Rescue Team';
  locationName: string;
  lat: number;
  lng: number;
  hazardType: HazardType;
  alertText: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
  status: AlertStatus;
  verifiedBy?: string;
  aiClassification?: {
    urgency: string;
    recommendedAction: string;
    confidenceScore: number;
  };
}

export interface AlertNotification {
  id: string;
  alertId: string;
  habitationId: string;
  habitationName: string;
  recipientType: 'Authority' | 'Rescue Team' | 'Community' | 'Volunteer';
  channel: 'SMS' | 'Local Siren' | 'Push Notification' | 'Dashboard' | 'Volunteer Door-to-Door';
  message: string;
  timestamp: string;
  deliveryStatus: AlertDeliveryStatus;
  fallbackTriggered: boolean;
  fallbackVolunteerName?: string;
  manualContactCompletedAt?: string;
}

export interface KnowledgeBaseRecord {
  id: string;
  eventCode: string;
  hazardType: HazardType;
  locationName: string;
  eventDate: string;
  predictedProbability: number;
  actualOutcome: string;
  populationAffected: number;
  sheltersUsed: string[];
  routeInitiallySelected: string;
  routeFailureReported?: string;
  alternativeRouteUsed?: string;
  evacuationDurationMin: number;
  lessonsLearned: string;
  verifiedOutcome: boolean;
}

export interface ModelVersion {
  version: string;
  modelName: string;
  trainingDate: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  validationStatus: 'Production Active' | 'Candidate' | 'Archived';
  trainingRecordsCount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  action: 'PREDICTION' | 'ALLOCATION' | 'RESERVATION' | 'ALERT' | 'ROUTE_CHANGE' | 'EVACUATION' | 'KNOWLEDGE_UPDATE' | 'AI_OVERRIDE';
  details: string;
  isOverride?: boolean;
  overrideReason?: string;
}

export interface DataSourceStatus {
  id: string;
  name: string;
  category: 'Satellite' | 'Weather' | 'Ground Sensor' | 'Community' | 'Historical' | 'Authority';
  provider: string;
  status: 'Connected' | 'Waiting' | 'Error';
  lastUpdated: string;
  recordsCount: number;
  sampleMetrics: Record<string, string | number>;
  // Extended fields for real-time telemetry pipelines
  recordsIngested?: number;
  lastSync?: string;
  syncFrequency?: string;
  dataClassification?: 'LIVE / VERIFIED' | 'DEMO / MOCK' | 'STALE' | 'UNKNOWN';
}

export interface PriorityRanking {
  rank: number;
  habitationId: string;
  habitationName: string;
  hazardType: HazardType;
  priorityScore: number; // 0-100
  urgency: 'Immediate' | 'High' | 'Moderate' | 'Watch';
  totalPopulation: number;
  vulnerablePopulation: number;
  nearestShelterName: string;
  shelterAvailableCapacity: number;
  estimatedEvacTimeMin: number;
  recommendedTeamId?: string;
  recommendedTeamName?: string;
  recommendedAction: string;
  aiExplanation: string[];
}
