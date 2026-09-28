import {
  DisasterRegion,
  GPSLocation,
  EvacuationRoute,
  TurnByTurnStep,
  Habitation,
  Shelter,
  RouteSegment
} from '../types/disaster';

export const INDIAN_DISASTER_REGIONS: DisasterRegion[] = [
  {
    id: 'kosi-bihar',
    name: 'Kosi River Basin (Supaul-Saharsa Sector)',
    state: 'Bihar',
    hazardType: 'Flood',
    center: [25.575, 87.245],
    zoom: 12,
    description: 'Stage IV Riverine Flood & Embankment breach along Kosi river corridor with overtopping culverts.'
  },
  {
    id: 'hyderabad-musi',
    name: 'Musi River Flood Basin (Hyderabad)',
    state: 'Telangana',
    hazardType: 'Flood',
    center: [17.385, 78.486],
    zoom: 12,
    description: 'Urban flash inundation from Hussain Sagar sluice gates discharge and Musi river spate.'
  },
  {
    id: 'wayanad-kerala',
    name: 'Wayanad Meppadi Landslide Belt',
    state: 'Kerala',
    hazardType: 'Landslide',
    center: [11.550, 76.130],
    zoom: 12,
    description: 'Major debris flows, bridge washouts, and mudslips in Chooralmala and Mundakkai sectors.'
  },
  {
    id: 'brahmaputra-assam',
    name: 'Brahmaputra Flood Plain (Kaziranga-Majuli)',
    state: 'Assam',
    hazardType: 'Flood',
    center: [26.650, 93.350],
    zoom: 11,
    description: 'Massive river overflow submerging low-lying villages and rural transport corridors.'
  },
  {
    id: 'dana-odisha',
    name: 'Balasore-Dhamra Coastal Belt',
    state: 'Odisha',
    hazardType: 'Cyclone',
    center: [21.320, 86.950],
    zoom: 11,
    description: 'Severe cyclonic storm surge with coastal gale winds, fallen trees, and tidal inundation.'
  }
];

export const INDIAN_STAGING_BASES: GPSLocation[] = [
  {
    lat: 25.552,
    lng: 87.235,
    name: 'NDRF Staging Base Alpha (NH-31 Junction)',
    source: 'MANUAL_STATION',
    accuracy: 10
  },
  {
    lat: 25.565,
    lng: 87.275,
    name: 'District Disaster Management Authority (DDMA Saharsa)',
    source: 'MANUAL_STATION',
    accuracy: 15
  },
  {
    lat: 25.535,
    lng: 87.220,
    name: 'SDRF River Quick Reaction Post (Kosi Ghat)',
    source: 'MANUAL_STATION',
    accuracy: 8
  }
];

/**
 * Calculates 3 realistic alternative routes between START and DESTINATION for India rescue teams
 */
export function generateRescueRoutes(
  start: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string },
  habitation: Habitation,
  shelter: Shelter,
  isSimulatedHazardActive: boolean = false
): EvacuationRoute[] {
  const midLat = (start.lat + destination.lat) / 2;
  const midLng = (start.lng + destination.lng) / 2;

  // Approximate Haversine distance
  const dLat = (destination.lat - start.lat) * 111;
  const dLng = (destination.lng - start.lng) * 111 * Math.cos((start.lat * Math.PI) / 180);
  const baseDistance = Math.max(3.5, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10);

  // Route 1: NH Highway Primary Link
  const r1Distance = Math.round((baseDistance * 1.08) * 10) / 10;
  const r1Eta = Math.round(r1Distance * 2.2); // ~30 km/h in rescue convoy
  const r1Blocked = isSimulatedHazardActive;

  const r1Steps: TurnByTurnStep[] = [
    {
      instruction: `Depart from ${start.name} heading north towards NH-31 Highway`,
      distanceMeters: 800,
      roadName: 'Station Approach Road',
      action: 'straight'
    },
    {
      instruction: 'Merge right onto NH-31 4-lane Elevated Bypass Corridor',
      distanceMeters: Math.round(r1Distance * 650),
      roadName: 'NH-31 Highway Corridor',
      action: 'turn-right'
    },
    {
      instruction: `Take Exit 14 towards ${shelter.name}`,
      distanceMeters: 1200,
      roadName: 'Relief Complex Access Road',
      action: 'take-exit'
    },
    {
      instruction: `Arrive at safe reception bay of ${shelter.name}`,
      distanceMeters: 400,
      roadName: 'Shelter Ingress Gate',
      action: 'arrive'
    }
  ];

  const route1: EvacuationRoute = {
    id: `route-alt-1-${shelter.id}`,
    habitationId: habitation.id,
    habitationName: habitation.name,
    shelterId: shelter.id,
    shelterName: shelter.name,
    isPrimary: !r1Blocked,
    distanceKm: r1Distance,
    estimatedTravelTimeMin: r1Eta,
    riskLevel: r1Blocked ? 'BLOCKED' : 'SAFE',
    statusText: r1Blocked ? 'BLOCKED' : 'CLEAR',
    roadConditionNote: r1Blocked
      ? 'Water overtopping 1.2m at Causeway Km 14. Road impassable.'
      : 'Paved 4-lane elevated corridor, free of debris, high clearance verified by NHAI.',
    hazards: r1Blocked ? ['Submerged bridge deck', 'High water flow'] : [],
    lastUpdatedTime: '10:42 AM (Verified by NHAI & Patrol Unit)',
    turnByTurnSteps: r1Steps,
    reason: r1Blocked
      ? 'Critical flood overflow across NH-31 low culvert.'
      : 'Main paved corridor with optimal transport throughput.',
    waypoints: [
      [start.lat, start.lng],
      [start.lat + (destination.lat - start.lat) * 0.3, start.lng + 0.015],
      [midLat, midLng + 0.02],
      [destination.lat - (destination.lat - start.lat) * 0.2, destination.lng + 0.008],
      [destination.lat, destination.lng]
    ],
    segments: []
  };

  // Route 2: Elevated Bypass / Ridge Corridor (Alternative)
  const r2Distance = Math.round((baseDistance * 1.32) * 10) / 10;
  const r2Eta = Math.round(r2Distance * 2.8);

  const r2Steps: TurnByTurnStep[] = [
    {
      instruction: `Depart ${start.name} via Eastern Embankment Ring Road`,
      distanceMeters: 1100,
      roadName: 'Eastern Embankment Rd',
      action: 'straight'
    },
    {
      instruction: 'Turn left onto State PWD Elevated Canal Bund Highway',
      distanceMeters: Math.round(r2Distance * 720),
      roadName: 'SH-58 Ridge Bund Road',
      action: 'turn-left'
    },
    {
      instruction: `Bear right towards High Ground Sector entering ${shelter.name}`,
      distanceMeters: 950,
      roadName: 'Sector Link Avenue',
      action: 'turn-right'
    },
    {
      instruction: `Arrive at unloading compound of ${shelter.name}`,
      distanceMeters: 300,
      roadName: 'Shelter Gate 3',
      action: 'arrive'
    }
  ];

  const route2: EvacuationRoute = {
    id: `route-alt-2-${shelter.id}`,
    habitationId: habitation.id,
    habitationName: habitation.name,
    shelterId: shelter.id,
    shelterName: shelter.name,
    isPrimary: r1Blocked,
    distanceKm: r2Distance,
    estimatedTravelTimeMin: r2Eta,
    riskLevel: 'RISKY',
    statusText: 'CAUTION',
    roadConditionNote: 'Minor shoulder waterlogging (0.2m) at Km 6.5. Passable with caution at speed <35 km/h.',
    hazards: ['Shoulder waterlogging', 'Narrow single-lane bridge at Km 8'],
    lastUpdatedTime: '10:38 AM (State PWD & District Patrol)',
    turnByTurnSteps: r2Steps,
    reason: 'Elevated bypass avoiding low-lying river plains.',
    waypoints: [
      [start.lat, start.lng],
      [start.lat + 0.02, start.lng + 0.035],
      [midLat + 0.025, midLng + 0.04],
      [destination.lat + 0.015, destination.lng + 0.025],
      [destination.lat, destination.lng]
    ],
    segments: []
  };

  // Route 3: Rural Canal Bund Feeder (Unknown or Unverified)
  const r3Distance = Math.round((baseDistance * 0.95) * 10) / 10;
  const r3Eta = Math.round(r3Distance * 3.8);

  const r3Steps: TurnByTurnStep[] = [
    {
      instruction: `Depart towards Western Canal Bund gravel path`,
      distanceMeters: 600,
      roadName: 'Canal Bund Track',
      action: 'straight'
    },
    {
      instruction: 'Follow rural dirt embankment track along irrigation canal',
      distanceMeters: Math.round(r3Distance * 800),
      roadName: 'Kosi Feeder Canal Bund',
      action: 'straight'
    },
    {
      instruction: `Cross unpaved culvert towards ${shelter.name} rear entrance`,
      distanceMeters: 500,
      roadName: 'Service Road',
      action: 'turn-left'
    },
    {
      instruction: 'Arrive at shelter auxiliary entrance',
      distanceMeters: 200,
      roadName: 'Auxiliary Gate',
      action: 'arrive'
    }
  ];

  const route3: EvacuationRoute = {
    id: `route-alt-3-${shelter.id}`,
    habitationId: habitation.id,
    habitationName: habitation.name,
    shelterId: shelter.id,
    shelterName: shelter.name,
    isPrimary: false,
    distanceKm: r3Distance,
    estimatedTravelTimeMin: r3Eta,
    riskLevel: 'RISKY',
    statusText: 'UNKNOWN',
    roadConditionNote: 'Road condition unavailable — verify before departure. No live sensor telemetry on canal bund.',
    hazards: ['Unverified road condition', 'Soft mud tracks', 'Potential scour'],
    lastUpdatedTime: '08:15 AM (Ground telemetry missing)',
    turnByTurnSteps: r3Steps,
    reason: 'Shorter unpaved rural link; condition not recently verified.',
    waypoints: [
      [start.lat, start.lng],
      [start.lat - 0.012, start.lng - 0.015],
      [midLat - 0.015, midLng - 0.02],
      [destination.lat - 0.01, destination.lng - 0.01],
      [destination.lat, destination.lng]
    ],
    segments: []
  };

  return [route1, route2, route3];
}
