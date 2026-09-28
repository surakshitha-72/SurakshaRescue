import {
  Habitation,
  Shelter,
  RescueTeam,
  RiskZone,
  RouteSegment,
  EvacuationRoute,
  DisasterAlert,
  KnowledgeBaseRecord,
  ModelVersion,
  DataSourceStatus,
  AuditLog,
  AlertNotification
} from '../types/disaster';

// Geospatial region: Kosi-Ganga River Basin Delta (representative high-risk flood & cyclone plain)
// Center ~ [25.55, 87.25]
export const INITIAL_HABITATIONS: Habitation[] = [
  {
    id: 'hab-1',
    name: 'Village Rampur Riverbank',
    lat: 25.582,
    lng: 87.215,
    demographics: {
      total: 4200,
      children: 820,
      elderly: 560,
      disabilities: 180,
      pregnantWomen: 90,
      medicalDependency: 200,
      povertyIndex: 78,
    },
    distanceToNearestShelterKm: 4.2,
    roadAccessibilityScore: 35, // Narrow embankment road
    hazardExposureScore: 94,
    responseDifficultyScore: 88,
    vulnerabilityScore: 89,
    vulnerabilityLevel: 'Critical',
    evacuationStatus: 'Alerted',
    currentHazard: 'Flood',
    evacuatedCount: 0,
  },
  {
    id: 'hab-2',
    name: 'Majuli Basti Lowlands',
    lat: 25.595,
    lng: 87.238,
    demographics: {
      total: 2840,
      children: 510,
      elderly: 340,
      disabilities: 120,
      pregnantWomen: 60,
      medicalDependency: 90,
      povertyIndex: 72,
    },
    distanceToNearestShelterKm: 5.1,
    roadAccessibilityScore: 40,
    hazardExposureScore: 91,
    responseDifficultyScore: 82,
    vulnerabilityScore: 84,
    vulnerabilityLevel: 'Critical',
    evacuationStatus: 'Alerted',
    currentHazard: 'Flood',
    evacuatedCount: 0,
  },
  {
    id: 'hab-3',
    name: 'Lower Kosi Hamlet',
    lat: 25.568,
    lng: 87.195,
    demographics: {
      total: 1950,
      children: 380,
      elderly: 240,
      disabilities: 75,
      pregnantWomen: 45,
      medicalDependency: 60,
      povertyIndex: 85,
    },
    distanceToNearestShelterKm: 3.8,
    roadAccessibilityScore: 28, // Mud track along feeder canal
    hazardExposureScore: 96,
    responseDifficultyScore: 92,
    vulnerabilityScore: 92,
    vulnerabilityLevel: 'Critical',
    evacuationStatus: 'Alerted',
    currentHazard: 'Flood',
    evacuatedCount: 0,
  },
  {
    id: 'hab-4',
    name: 'East Canal Settlement',
    lat: 25.545,
    lng: 87.265,
    demographics: {
      total: 3100,
      children: 580,
      elderly: 390,
      disabilities: 110,
      pregnantWomen: 70,
      medicalDependency: 140,
      povertyIndex: 68,
    },
    distanceToNearestShelterKm: 6.4,
    roadAccessibilityScore: 55,
    hazardExposureScore: 78,
    responseDifficultyScore: 65,
    vulnerabilityScore: 72,
    vulnerabilityLevel: 'High',
    evacuationStatus: 'Normal',
    currentHazard: 'Flood',
    evacuatedCount: 0,
  },
  {
    id: 'hab-5',
    name: 'Green Valley Agriculture Ward',
    lat: 25.525,
    lng: 87.225,
    demographics: {
      total: 5400,
      children: 920,
      elderly: 620,
      disabilities: 160,
      pregnantWomen: 110,
      medicalDependency: 210,
      povertyIndex: 52,
    },
    distanceToNearestShelterKm: 3.1,
    roadAccessibilityScore: 72,
    hazardExposureScore: 64,
    responseDifficultyScore: 50,
    vulnerabilityScore: 58,
    vulnerabilityLevel: 'Medium',
    evacuationStatus: 'Normal',
    currentHazard: 'Extreme Rainfall',
    evacuatedCount: 0,
  },
  {
    id: 'hab-6',
    name: 'Hilltop Ward North',
    lat: 25.625,
    lng: 87.275,
    demographics: {
      total: 2200,
      children: 340,
      elderly: 290,
      disabilities: 70,
      pregnantWomen: 35,
      medicalDependency: 85,
      povertyIndex: 44,
    },
    distanceToNearestShelterKm: 2.2,
    roadAccessibilityScore: 68,
    hazardExposureScore: 42,
    responseDifficultyScore: 38,
    vulnerabilityScore: 41,
    vulnerabilityLevel: 'Medium',
    evacuationStatus: 'Normal',
    evacuatedCount: 0,
  },
  {
    id: 'hab-7',
    name: 'Sunderpur Fishermen Colony',
    lat: 25.612,
    lng: 87.185,
    demographics: {
      total: 1650,
      children: 310,
      elderly: 210,
      disabilities: 65,
      pregnantWomen: 40,
      medicalDependency: 55,
      povertyIndex: 82,
    },
    distanceToNearestShelterKm: 5.8,
    roadAccessibilityScore: 32,
    hazardExposureScore: 88,
    responseDifficultyScore: 84,
    vulnerabilityScore: 82,
    vulnerabilityLevel: 'Critical',
    evacuationStatus: 'Alerted',
    currentHazard: 'Flood',
    evacuatedCount: 0,
  },
  {
    id: 'hab-8',
    name: 'Old Bazaar Sector',
    lat: 25.535,
    lng: 87.295,
    demographics: {
      total: 6800,
      children: 1150,
      elderly: 780,
      disabilities: 190,
      pregnantWomen: 140,
      medicalDependency: 290,
      povertyIndex: 38,
    },
    distanceToNearestShelterKm: 1.5,
    roadAccessibilityScore: 85,
    hazardExposureScore: 30,
    responseDifficultyScore: 28,
    vulnerabilityScore: 29,
    vulnerabilityLevel: 'Low',
    evacuationStatus: 'Normal',
    evacuatedCount: 0,
  },
  {
    id: 'hab-9',
    name: 'Barh Relief Settlement',
    lat: 25.575,
    lng: 87.285,
    demographics: {
      total: 3500,
      children: 640,
      elderly: 410,
      disabilities: 105,
      pregnantWomen: 80,
      medicalDependency: 130,
      povertyIndex: 65,
    },
    distanceToNearestShelterKm: 3.5,
    roadAccessibilityScore: 60,
    hazardExposureScore: 71,
    responseDifficultyScore: 58,
    vulnerabilityScore: 66,
    vulnerabilityLevel: 'High',
    evacuationStatus: 'Normal',
    currentHazard: 'Flood',
    evacuatedCount: 0,
  },
  {
    id: 'hab-10',
    name: 'Chandanpur Rural Pocket',
    lat: 25.510,
    lng: 87.185,
    demographics: {
      total: 1420,
      children: 260,
      elderly: 195,
      disabilities: 48,
      pregnantWomen: 32,
      medicalDependency: 45,
      povertyIndex: 70,
    },
    distanceToNearestShelterKm: 4.8,
    roadAccessibilityScore: 45,
    hazardExposureScore: 58,
    responseDifficultyScore: 54,
    vulnerabilityScore: 56,
    vulnerabilityLevel: 'Medium',
    evacuationStatus: 'Normal',
    evacuatedCount: 0,
  }
];

export const INITIAL_SHELTERS: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'District Stadium Relief Complex (Shelter A)',
    lat: 25.548,
    lng: 87.288,
    address: 'Sector 4, Main Highway Corridor',
    totalCapacity: 5000,
    occupiedCapacity: 2100,
    reservedCapacity: 1000, // Pre-reserved by Team NDRF-7
    availableCapacity: 1900,
    medicalCapacity: 'Advanced',
    waterCapacityDays: 14,
    foodCapacityDays: 12,
    accessibility: 'High',
    status: 'Operational',
    activeReservations: [
      {
        id: 'res-101',
        shelterId: 'shelter-1',
        shelterName: 'District Stadium Relief Complex (Shelter A)',
        teamId: 'team-1',
        teamName: 'NDRF Unit 7 Alpha',
        habitationId: 'hab-1',
        habitationName: 'Village Rampur Riverbank',
        reservedCount: 1000,
        timestamp: '2026-09-12 01:15',
        expiresAt: '2026-09-12 05:15',
        status: 'RESERVED',
      }
    ]
  },
  {
    id: 'shelter-2',
    name: 'Central High School Auditorium (Shelter B)',
    lat: 25.565,
    lng: 87.255,
    address: 'Station Road, Upper Ward',
    totalCapacity: 3500,
    occupiedCapacity: 1400,
    reservedCapacity: 0,
    availableCapacity: 2100,
    medicalCapacity: 'Basic',
    waterCapacityDays: 10,
    foodCapacityDays: 9,
    accessibility: 'High',
    status: 'Operational',
    activeReservations: []
  },
  {
    id: 'shelter-3',
    name: 'Hillcrest Community Hall (Shelter C - High Ground)',
    lat: 25.632,
    lng: 87.285,
    address: 'Hill Ridge Point, Elevated Plateau',
    totalCapacity: 2200,
    occupiedCapacity: 1950,
    reservedCapacity: 200,
    availableCapacity: 50, // Near capacity! Will trigger "INSUFFICIENT CAPACITY" when demanded
    medicalCapacity: 'Basic',
    waterCapacityDays: 18,
    foodCapacityDays: 15,
    accessibility: 'Moderate',
    status: 'Near Capacity',
    activeReservations: [
      {
        id: 'res-102',
        shelterId: 'shelter-3',
        shelterName: 'Hillcrest Community Hall (Shelter C - High Ground)',
        teamId: 'team-3',
        teamName: 'River Rapid Rescue Boat 3',
        habitationId: 'hab-7',
        habitationName: 'Sunderpur Fishermen Colony',
        reservedCount: 200,
        timestamp: '2026-09-12 01:45',
        expiresAt: '2026-09-12 05:45',
        status: 'RESERVED',
      }
    ]
  },
  {
    id: 'shelter-4',
    name: 'North Medical College Hall (Shelter D)',
    lat: 25.598,
    lng: 87.295,
    address: 'Campus West, North Medical Enclave',
    totalCapacity: 4000,
    occupiedCapacity: 800,
    reservedCapacity: 0,
    availableCapacity: 3200,
    medicalCapacity: 'Hospital Grade',
    waterCapacityDays: 20,
    foodCapacityDays: 16,
    accessibility: 'High',
    status: 'Operational',
    activeReservations: []
  },
  {
    id: 'shelter-5',
    name: 'South Industrial Warehouse Camp (Shelter E)',
    lat: 25.495,
    lng: 87.240,
    address: 'Warehouse Zone 12, South Logistics Hub',
    totalCapacity: 3000,
    occupiedCapacity: 600,
    reservedCapacity: 0,
    availableCapacity: 2400,
    medicalCapacity: 'Basic',
    waterCapacityDays: 8,
    foodCapacityDays: 7,
    accessibility: 'Moderate',
    status: 'Operational',
    activeReservations: []
  }
];

export const INITIAL_RESCUE_TEAMS: RescueTeam[] = [
  {
    id: 'team-1',
    name: 'NDRF Unit 7 Alpha',
    unit: 'National Disaster Response Force',
    currentLocation: {
      lat: 25.552,
      lng: 87.275,
      name: 'District Operations Staging Base'
    },
    teamCapacity: 45,
    vehicleCapacity: 320,
    medicalCapability: 'Doctor',
    boatAvailability: true,
    boatCount: 6,
    equipment: ['Inflatable Rescue Boats (IRB)', 'Satellite Comms BGAN', 'Water Rescue Gear', 'Life Vests (500)', 'Emergency Rations'],
    status: 'En Route',
    currentAssignment: {
      habitationId: 'hab-1',
      habitationName: 'Village Rampur Riverbank',
      shelterId: 'shelter-1',
      task: 'Initial evacuation of high medical dependency & elderly citizens',
      startedAt: '2026-09-12 01:30'
    }
  },
  {
    id: 'team-2',
    name: 'SDRF Team Bravo (State Force)',
    unit: 'State Disaster Response Force',
    currentLocation: {
      lat: 25.568,
      lng: 87.262,
      name: 'Central Police Headquarters Camp'
    },
    teamCapacity: 30,
    vehicleCapacity: 220,
    medicalCapability: 'Paramedic',
    boatAvailability: true,
    boatCount: 4,
    equipment: ['Heavy Evacuation Trucks (4)', 'Amphibious All-Terrain Vehicle', 'First Aid Kits', 'Portable Loudspeakers'],
    status: 'Available'
  },
  {
    id: 'team-3',
    name: 'River Rapid Rescue Boat 3',
    unit: 'Specialized Aquatic Rescue Wing',
    currentLocation: {
      lat: 25.602,
      lng: 87.210,
      name: 'Kosi Barrage Riverhead Station'
    },
    teamCapacity: 20,
    vehicleCapacity: 150,
    medicalCapability: 'Paramedic',
    boatAvailability: true,
    boatCount: 8,
    equipment: ['Motorized Jet Rescue Boats', 'Diving Gear', 'Sonar Depth Finder', 'Floating Stretchers'],
    status: 'Rescuing',
    currentAssignment: {
      habitationId: 'hab-7',
      habitationName: 'Sunderpur Fishermen Colony',
      shelterId: 'shelter-3',
      task: 'Rescuing isolated families trapped on embankment ring',
      startedAt: '2026-09-12 01:40'
    }
  },
  {
    id: 'team-4',
    name: 'Medical Rapid Response Unit 2',
    unit: 'District Health & Emergency Services',
    currentLocation: {
      lat: 25.592,
      lng: 87.290,
      name: 'North Medical College Emergency Depot'
    },
    teamCapacity: 25,
    vehicleCapacity: 80,
    medicalCapability: 'Doctor',
    boatAvailability: false,
    boatCount: 0,
    equipment: ['Advanced Life Support Ambulances (6)', 'Portable Oxygen Cylinders', 'Trauma Care Kits', 'Tetanus & Water Purification Drops'],
    status: 'Available'
  }
];

export const INITIAL_RISK_ZONES: RiskZone[] = [
  {
    id: 'zone-red-1',
    name: 'Kosi River Overflow Red Zone',
    hazardType: 'Flood',
    riskLevel: 'High',
    probability: 94,
    severity: 'Severe (Stage IV Flash Spate)',
    population: 8990,
    vulnerablePopulation: 3640,
    recommendedAction: 'Immediate mandatory evacuation within 45 minutes to elevated shelters.',
    nearbyShelterIds: ['shelter-1', 'shelter-2', 'shelter-4'],
    polygon: [
      [25.615, 87.170],
      [25.610, 87.245],
      [25.570, 87.255],
      [25.555, 87.210],
      [25.565, 87.175],
      [25.615, 87.170]
    ]
  },
  {
    id: 'zone-yellow-1',
    name: 'East Canal Inundation Moderate Buffer',
    hazardType: 'Flood',
    riskLevel: 'Medium',
    probability: 68,
    severity: 'Moderate Waterlogging (0.5m - 1.2m)',
    population: 6600,
    vulnerablePopulation: 2150,
    recommendedAction: 'Prepare for staged evacuation; stage sandbags; restrict low-lying movements.',
    nearbyShelterIds: ['shelter-1', 'shelter-4', 'shelter-5'],
    polygon: [
      [25.570, 87.255],
      [25.580, 87.310],
      [25.530, 87.305],
      [25.520, 87.250],
      [25.545, 87.240],
      [25.570, 87.255]
    ]
  },
  {
    id: 'zone-green-1',
    name: 'High Ground District Core (Safe Sanctuary)',
    hazardType: 'Flood',
    riskLevel: 'Low',
    probability: 14,
    severity: 'Negligible Flood Risk (Natural Elevation +22m MSL)',
    population: 12200,
    vulnerablePopulation: 1800,
    recommendedAction: 'Designated receiving sanctuary for relocated populations; activate relief stores.',
    nearbyShelterIds: ['shelter-1', 'shelter-2', 'shelter-3', 'shelter-4'],
    polygon: [
      [25.640, 87.260],
      [25.645, 87.320],
      [25.580, 87.330],
      [25.585, 87.270],
      [25.640, 87.260]
    ]
  }
];

export const INITIAL_ROUTE_SEGMENTS: RouteSegment[] = [
  {
    id: 'seg-1',
    name: 'NH-31 Highway Link Corridor',
    from: 'Village Rampur Riverbank',
    to: 'District Stadium Relief Complex',
    status: 'SAFE',
    coordinates: [
      [25.582, 87.215],
      [25.570, 87.235],
      [25.560, 87.260],
      [25.548, 87.288]
    ],
    hazardProximityKm: 2.1,
    lastUpdated: '2026-09-12 01:50'
  },
  {
    id: 'seg-2-bridge',
    name: 'Kosi Causeway Bridge at Km 14',
    from: 'Majuli Basti Lowlands',
    to: 'Central High School Auditorium',
    status: 'BLOCKED', // Dynamic failure demonstrated here!
    blockageReason: 'River water overtopping causeway bridge deck by 1.4m; structural scour hazard detected by sensor CS-09.',
    hazardType: 'Flood',
    coordinates: [
      [25.595, 87.238],
      [25.585, 87.248],
      [25.575, 87.252],
      [25.565, 87.255]
    ],
    hazardProximityKm: 0.1,
    lastUpdated: '2026-09-12 01:55'
  },
  {
    id: 'seg-3-bypass',
    name: 'Eastern Embankment Bypass Rd (Alternative Route)',
    from: 'Majuli Basti Lowlands',
    to: 'North Medical College Hall (Shelter D)',
    status: 'SAFE',
    coordinates: [
      [25.595, 87.238],
      [25.610, 87.265],
      [25.605, 87.285],
      [25.598, 87.295]
    ],
    hazardProximityKm: 3.4,
    lastUpdated: '2026-09-12 01:58'
  },
  {
    id: 'seg-4',
    name: 'Canal Roadway South',
    from: 'Lower Kosi Hamlet',
    to: 'Central High School Auditorium',
    status: 'RISKY',
    hazardType: 'Flood',
    blockageReason: 'Water depth 25cm on shoulder; passable by heavy military trucks and NDRF boats only.',
    coordinates: [
      [25.568, 87.195],
      [25.560, 87.220],
      [25.562, 87.240],
      [25.565, 87.255]
    ],
    hazardProximityKm: 0.8,
    lastUpdated: '2026-09-12 01:45'
  },
  {
    id: 'seg-5',
    name: 'Hill Ridge Protected Highway',
    from: 'Sunderpur Fishermen Colony',
    to: 'Hillcrest Community Hall',
    status: 'SAFE',
    coordinates: [
      [25.612, 87.185],
      [25.620, 87.220],
      [25.630, 87.260],
      [25.632, 87.285]
    ],
    hazardProximityKm: 1.8,
    lastUpdated: '2026-09-12 01:40'
  }
];

export const INITIAL_EVACUATION_ROUTES: EvacuationRoute[] = [
  {
    id: 'route-hab1-shelter1',
    habitationId: 'hab-1',
    habitationName: 'Village Rampur Riverbank',
    shelterId: 'shelter-1',
    shelterName: 'District Stadium Relief Complex (Shelter A)',
    isPrimary: true,
    distanceKm: 5.2,
    estimatedTravelTimeMin: 22,
    riskLevel: 'SAFE',
    reason: 'Paved state highway elevated 3m above flood plain; free of debris.',
    waypoints: [
      [25.582, 87.215],
      [25.570, 87.235],
      [25.560, 87.260],
      [25.548, 87.288]
    ],
    segments: [INITIAL_ROUTE_SEGMENTS[0]]
  },
  {
    id: 'route-hab2-shelter2-blocked',
    habitationId: 'hab-2',
    habitationName: 'Majuli Basti Lowlands',
    shelterId: 'shelter-2',
    shelterName: 'Central High School Auditorium (Shelter B)',
    isPrimary: false,
    distanceKm: 4.6,
    estimatedTravelTimeMin: 45,
    riskLevel: 'BLOCKED',
    reason: 'Bridge at Km 14 is submerged by 1.4m of turbulent floodwater.',
    waypoints: [
      [25.595, 87.238],
      [25.585, 87.248],
      [25.575, 87.252],
      [25.565, 87.255]
    ],
    segments: [INITIAL_ROUTE_SEGMENTS[1]]
  },
  {
    id: 'route-hab2-shelter4-rerouted',
    habitationId: 'hab-2',
    habitationName: 'Majuli Basti Lowlands',
    shelterId: 'shelter-4',
    shelterName: 'North Medical College Hall (Shelter D)',
    isPrimary: true,
    distanceKm: 6.8,
    estimatedTravelTimeMin: 28,
    riskLevel: 'SAFE',
    reason: 'Dynamic reroute via Eastern Embankment Bypass; avoids flooded bridge.',
    waypoints: [
      [25.595, 87.238],
      [25.610, 87.265],
      [25.605, 87.285],
      [25.598, 87.295]
    ],
    segments: [INITIAL_ROUTE_SEGMENTS[2]]
  }
];

export const INITIAL_ALERTS: DisasterAlert[] = [
  {
    id: 'alert-001',
    source: 'River Sensor Network',
    locationName: 'Kosi Gauge Station GS-04 (Upstream Rampur)',
    lat: 25.589,
    lng: 87.208,
    hazardType: 'Flood',
    alertText: 'Extreme discharge detected: River stage +4.82m above danger mark. Rate of rise: +0.38m/hr.',
    severity: 'Critical',
    timestamp: '2026-09-12 01:25',
    status: 'Verified',
    verifiedBy: 'Central Water Commission Hydrology Desk',
    aiClassification: {
      urgency: 'Immediate Evacuation Required',
      recommendedAction: 'Trigger Red-Zone inundation perimeter for Rampur and Majuli Basti; reserve 3,000 shelter berths.',
      confidenceScore: 96
    }
  },
  {
    id: 'alert-002',
    source: 'Weather Agency (IMD)',
    locationName: 'Eastern River Delta Quadrant',
    lat: 25.560,
    lng: 87.240,
    hazardType: 'Extreme Rainfall',
    alertText: 'Doppler Radar confirms Mesoscale Convective System delivering 185mm rainfall in past 3 hours. Red Warning in force.',
    severity: 'High',
    timestamp: '2026-09-12 01:10',
    status: 'Verified',
    verifiedBy: 'Regional Meteorological Center',
    aiClassification: {
      urgency: 'High Alert',
      recommendedAction: 'Pre-position high-clearance rescue trucks and inflatable boats.',
      confidenceScore: 92
    }
  },
  {
    id: 'alert-003',
    source: 'Community Report',
    locationName: 'Lower Kosi Hamlet Canal Bridge',
    lat: 25.568,
    lng: 87.195,
    hazardType: 'Flood',
    alertText: 'Local village elder reports earthen canal embankment seepage cracking at eastern bund.',
    severity: 'High',
    timestamp: '2026-09-12 01:42',
    status: 'Under Review',
    aiClassification: {
      urgency: 'Verification Required',
      recommendedAction: 'Dispatch SDRF drone survey or local engineer to inspect structural breach before full failure.',
      confidenceScore: 84
    }
  },
  {
    id: 'alert-004',
    source: 'Satellite Analysis (ISRO)',
    locationName: 'Basin Synthetic Aperture Radar (SAR)',
    lat: 25.575,
    lng: 87.225,
    hazardType: 'Flood',
    alertText: 'Sentinel-1 SAR surface water anomaly index: +34 sq km inundated within 6 hours.',
    severity: 'Critical',
    timestamp: '2026-09-12 01:05',
    status: 'Converted to Disaster Event',
    verifiedBy: 'National Remote Sensing Centre (NRSC)',
    aiClassification: {
      urgency: 'Catastrophic Event Ongoing',
      recommendedAction: 'Enforce Red-Zone containment and multi-team capacity reservation.',
      confidenceScore: 98
    }
  }
];

export const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'notif-1',
    alertId: 'alert-001',
    habitationId: 'hab-1',
    habitationName: 'Village Rampur Riverbank',
    recipientType: 'Community',
    channel: 'SMS',
    message: 'RED ALERT: Severe flood surge approaching Rampur. Immediate evacuation to Shelter A via Highway 31.',
    timestamp: '2026-09-12 01:30',
    deliveryStatus: 'DELIVERED',
    fallbackTriggered: false
  },
  {
    id: 'notif-2',
    alertId: 'alert-001',
    habitationId: 'hab-3',
    habitationName: 'Lower Kosi Hamlet',
    recipientType: 'Community',
    channel: 'SMS',
    message: 'URGENT: Canal bund breach threat. Move immediately to Central High School.',
    timestamp: '2026-09-12 01:32',
    deliveryStatus: 'FAILED', // Key demonstration of Alert Failure & Volunteer Fallback!
    fallbackTriggered: true,
    fallbackVolunteerName: 'Civil Defence Volunteer Squad #4 (Ramesh & Sunita)',
    manualContactCompletedAt: '2026-09-12 01:52'
  },
  {
    id: 'notif-3',
    alertId: 'alert-001',
    habitationId: 'hab-2',
    habitationName: 'Majuli Basti Lowlands',
    recipientType: 'Rescue Team',
    channel: 'Dashboard',
    message: 'MISSION DIRECTIVE: NDRF-7 deployed to Majuli Basti. Bridge 14 blocked - reroute via Bypass to Shelter D.',
    timestamp: '2026-09-12 01:35',
    deliveryStatus: 'DELIVERED',
    fallbackTriggered: false
  }
];

export const INITIAL_KNOWLEDGE_BASE: KnowledgeBaseRecord[] = [
  {
    id: 'kb-2024-08',
    eventCode: 'KB-FL-2024-08',
    hazardType: 'Flood',
    locationName: 'Village Rampur Embankment',
    eventDate: '2024-08-18',
    predictedProbability: 91,
    actualOutcome: 'River overflow breached embankment at 04:30; 3,600 villagers relocated.',
    populationAffected: 3600,
    sheltersUsed: ['District Stadium Relief Complex (Shelter A)', 'North Medical College Hall'],
    routeInitiallySelected: 'NH-31 Highway Link',
    routeFailureReported: 'None on main highway; feeder culverts flooded at +3.2m water gauge.',
    alternativeRouteUsed: 'Elevated Toll Bypass',
    evacuationDurationMin: 72,
    lessonsLearned: 'NH-31 retains safety up to gauge +5.1m. Pre-reserving stadium shelter prevented bottleneck.',
    verifiedOutcome: true
  },
  {
    id: 'kb-2023-09',
    eventCode: 'KB-FL-2023-09',
    hazardType: 'Flood',
    locationName: 'Majuli Basti Causeway Bridge',
    eventDate: '2023-09-04',
    predictedProbability: 86,
    actualOutcome: 'Causeway Bridge submerged under 1.2m water; two private tractors stranded.',
    populationAffected: 2400,
    sheltersUsed: ['Central High School Auditorium (Shelter B)'],
    routeInitiallySelected: 'Kosi Causeway Bridge Rd',
    routeFailureReported: 'Causeway bridge became impassable within 35 minutes of flash spill.',
    alternativeRouteUsed: 'Eastern Embankment Bypass',
    evacuationDurationMin: 110,
    lessonsLearned: 'Causeway Bridge at Km 14 must be flagged BLOCKED immediately when river discharge exceeds 120,000 cusecs.',
    verifiedOutcome: true
  },
  {
    id: 'kb-2022-07',
    eventCode: 'KB-LS-2022-07',
    hazardType: 'Landslide',
    locationName: 'Hilltop Ward Access Road',
    eventDate: '2022-07-22',
    predictedProbability: 79,
    actualOutcome: 'Mudslip blocked western hairpins; 1,400 residents isolated for 18 hours.',
    populationAffected: 1400,
    sheltersUsed: ['Hillcrest Community Hall (Shelter C)'],
    routeInitiallySelected: 'Western Hairpin Pass',
    routeFailureReported: 'Mass debris blockage 500m north of bend 6.',
    alternativeRouteUsed: 'Ridge Crest Foot-trail (pedestrian only with rescue ropes)',
    evacuationDurationMin: 180,
    lessonsLearned: 'Hillcrest Community Hall capacity (2,200) is easily overwhelmed if lower wards flee upward without coordination.',
    verifiedOutcome: true
  }
];

export const INITIAL_MODEL_VERSIONS: ModelVersion[] = [
  {
    version: 'v2.1-hybrid',
    modelName: 'XGBoost + Geospatial Hydrological Risk Net',
    trainingDate: '2026-08-15',
    accuracy: 94.2,
    precision: 93.6,
    recall: 95.1,
    f1Score: 94.3,
    validationStatus: 'Production Active',
    trainingRecordsCount: 28400
  },
  {
    version: 'v2.2-rc1',
    modelName: 'Ensemble Random Forest & Time-Series Sensor Stream',
    trainingDate: '2026-09-01',
    accuracy: 95.8,
    precision: 94.9,
    recall: 96.4,
    f1Score: 95.6,
    validationStatus: 'Candidate',
    trainingRecordsCount: 31200
  },
  {
    version: 'v1.9-legacy',
    modelName: 'Logistic Regression Baseline + Elevation Buffer',
    trainingDate: '2025-11-20',
    accuracy: 84.5,
    precision: 81.2,
    recall: 87.0,
    f1Score: 84.0,
    validationStatus: 'Archived',
    trainingRecordsCount: 14200
  }
];

export const INITIAL_DATA_SOURCES: DataSourceStatus[] = [
  {
    id: 'ds-1',
    name: 'Satellite Surface Inundation & SAR',
    category: 'Satellite',
    provider: 'ISRO MOSDAC & NASA Sentinel-1 SAR',
    status: 'Connected',
    lastUpdated: '10 mins ago',
    recordsCount: 1420,
    recordsIngested: 1420,
    lastSync: '10 mins ago',
    syncFrequency: 'Every 15 min',
    dataClassification: 'LIVE / VERIFIED',
    sampleMetrics: {
      'Soil Saturation': '98.4%',
      'Flood Footprint': '48.6 km²',
      'Sensor Pol': 'VV/VH Dual'
    }
  },
  {
    id: 'ds-2',
    name: 'Meteorological & Doppler Radar Network',
    category: 'Weather',
    provider: 'India Meteorological Department (IMD)',
    status: 'Connected',
    lastUpdated: '5 mins ago',
    recordsCount: 4890,
    recordsIngested: 4890,
    lastSync: '5 mins ago',
    syncFrequency: 'Every 5 min',
    dataClassification: 'LIVE / VERIFIED',
    sampleMetrics: {
      '3-Hr Rainfall': '185 mm',
      'Wind Gust': '64 km/h',
      'Atm Pressure': '994 hPa'
    }
  },
  {
    id: 'ds-3',
    name: 'River Hydrograph & Discharge Telemetry',
    category: 'Ground Sensor',
    provider: 'Central Water Commission (CWC) IoT Sensors',
    status: 'Connected',
    lastUpdated: '2 mins ago',
    recordsCount: 12400,
    recordsIngested: 12400,
    lastSync: '2 mins ago',
    syncFrequency: 'Every 2 min',
    dataClassification: 'LIVE / VERIFIED',
    sampleMetrics: {
      'Gauge Level': '+4.82 m',
      'Discharge Rate': '164,000 cusecs',
      'Rate of Rise': '+0.38 m/hr'
    }
  },
  {
    id: 'ds-4',
    name: 'Citizen Hotline & Community NGO Reports',
    category: 'Community',
    provider: 'District 1077 Hotline & Field Volunteers',
    status: 'Connected',
    lastUpdated: '7 mins ago',
    recordsCount: 236,
    recordsIngested: 236,
    lastSync: '7 mins ago',
    syncFrequency: 'Real-time Push',
    dataClassification: 'UNKNOWN',
    sampleMetrics: {
      'Incoming Alerts': '18 unverified',
      'Verified Reports': '42 active',
      'Volunteers Active': '64 in field'
    }
  },
  {
    id: 'ds-5',
    name: 'National Disaster Archive & Historical Floods',
    category: 'Historical',
    provider: 'National Disaster Management Authority (NDMA)',
    status: 'Connected',
    lastUpdated: '1 day ago',
    recordsCount: 8200,
    recordsIngested: 8200,
    lastSync: '1 day ago',
    syncFrequency: 'Daily Batch',
    dataClassification: 'LIVE / VERIFIED',
    sampleMetrics: {
      'Historical Events': '142 catalogued',
      'Analog Match': '2024 Spate (96% sim)'
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2026-09-12 01:05:22',
    userRole: 'AUTHORITY',
    userName: 'District Collector Control Room',
    action: 'ALERT',
    details: 'Received Alert #001 from River Telemetry GS-04; initiated automatic hazard assessment.'
  },
  {
    id: 'log-02',
    timestamp: '2026-09-12 01:08:44',
    userRole: 'ADMIN',
    userName: 'AI Disaster Risk Engine v2.1',
    action: 'PREDICTION',
    details: 'Computed 94% Flood Probability for Rampur-Majuli Basin. Red-Zone polygon generated.'
  },
  {
    id: 'log-03',
    timestamp: '2026-09-12 01:15:10',
    userRole: 'RESCUE_TEAM',
    userName: 'NDRF Unit 7 Alpha Commander',
    action: 'RESERVATION',
    details: 'Atomic capacity reservation of 1,000 berths at District Stadium Relief Complex (Shelter A).'
  },
  {
    id: 'log-04',
    timestamp: '2026-09-12 01:45:30',
    userRole: 'AUTHORITY',
    userName: 'Traffic & Infrastructure Control Desk',
    action: 'ROUTE_CHANGE',
    details: 'Flagged Kosi Causeway Bridge as BLOCKED due to +1.4m overtopping; auto-rerouted Majuli Basti traffic to Shelter D.'
  }
];
