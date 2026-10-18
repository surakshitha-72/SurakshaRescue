import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Habitation,
  Shelter,
  RescueTeam,
  RouteSegment,
  EvacuationRoute,
  RiskZone
} from '../types/disaster';
import { Layers, MapPin, Eye, EyeOff, Navigation, Crosshair, Check, Globe, Map as MapIcon, Shield } from 'lucide-react';

interface LeafletMapProps {
  habitations: Habitation[];
  shelters: Shelter[];
  teams: RescueTeam[];
  riskZones: RiskZone[];
  routeSegments: RouteSegment[];
  routes: EvacuationRoute[];
  selectedHabitationId?: string;
  selectedShelterId?: string;
  highlightRouteId?: string;
  gpsLocation?: { lat: number; lng: number; name?: string };
  center?: [number, number];
  zoom?: number;
  onSelectHabitation?: (id: string) => void;
  onSelectShelter?: (id: string) => void;
  onSelectRoute?: (id: string) => void;
  onTriggerEvacuation?: (habId: string) => void;
  onRequestAIExplanation?: (habId: string) => void;
  onLocateUser?: () => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  habitations = [],
  shelters = [],
  teams = [],
  riskZones = [],
  routeSegments = [],
  routes = [],
  selectedHabitationId,
  selectedShelterId,
  highlightRouteId,
  gpsLocation,
  center = [25.575, 87.245],
  zoom = 12,
  onSelectHabitation,
  onSelectShelter,
  onSelectRoute,
  onTriggerEvacuation,
  onRequestAIExplanation,
  onLocateUser
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Environment Variable Integration (Requirement 1)
  const googleMapsApiKey =
    (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY as string) ||
    ((typeof process !== 'undefined' && process.env?.REACT_APP_GOOGLE_MAPS_API_KEY) as string) ||
    '';

  // Floating legend toggle button
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Basemap style toggle: default to 'google' if key exists, otherwise 'dark'
  const [tileStyle, setTileStyle] = useState<'google' | 'dark' | 'osm'>(
    googleMapsApiKey ? 'google' : 'dark'
  );

  const [visibleLayers, setVisibleLayers] = useState({
    zones: true,
    routes: true,
    habitations: true,
    shelters: true,
    teams: true,
    sensors: true
  });

  const layersRef = useRef<{
    zonesLayer: L.LayerGroup;
    routesLayer: L.LayerGroup;
    habitationsLayer: L.LayerGroup;
    sheltersLayer: L.LayerGroup;
    teamsLayer: L.LayerGroup;
    sensorsLayer: L.LayerGroup;
    gpsLayer: L.LayerGroup;
  } | null>(null);

  // 2. Map Script Loading: Inject Google Maps JS SDK dynamically if API key is present (Requirement 2)
  useEffect(() => {
    if (!googleMapsApiKey) return;
    if (document.getElementById('google-maps-js-sdk')) return;

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&libraries=places,geometry&v=weekly`;
    script.async = true;
    document.head.appendChild(script);
  }, [googleMapsApiKey]);

  // Safe initial center coordinates
  const safeInitialCenter: [number, number] = (center && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1]))
    ? [center[0], center[1]]
    : [25.575, 87.245];

  // Helper to determine tile configuration
  const getTileConfig = (style: 'google' | 'dark' | 'osm') => {
    if (style === 'google' && googleMapsApiKey) {
      return {
        url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${encodeURIComponent(googleMapsApiKey)}`,
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps Platform'
      };
    }
    if (style === 'osm') {
      return {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors'
      };
    }
    // Default fallback: Clean dark tactical basemap (CartoDB)
    return {
      url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    };
  };

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: safeInitialCenter,
      zoom,
      zoomControl: false,
      attributionControl: false
    });

    const activeConfig = getTileConfig(tileStyle);
    const tileLayer = L.tileLayer(activeConfig.url, {
      maxZoom: 19,
      subdomains: activeConfig.subdomains,
      attribution: activeConfig.attribution
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const zonesLayer = L.layerGroup().addTo(map);
    const routesLayer = L.layerGroup().addTo(map);
    const habitationsLayer = L.layerGroup().addTo(map);
    const sheltersLayer = L.layerGroup().addTo(map);
    const teamsLayer = L.layerGroup().addTo(map);
    const sensorsLayer = L.layerGroup().addTo(map);
    const gpsLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      zonesLayer,
      routesLayer,
      habitationsLayer,
      sheltersLayer,
      teamsLayer,
      sensorsLayer,
      gpsLayer
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer if provider toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const activeConfig = getTileConfig(tileStyle);
    const newTileLayer = L.tileLayer(activeConfig.url, {
      maxZoom: 19,
      subdomains: activeConfig.subdomains,
      attribution: activeConfig.attribution
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [tileStyle]);

  // Pan to center if center prop changes (with LatLng validation)
  useEffect(() => {
    if (mapInstanceRef.current && center && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
      mapInstanceRef.current.setView([center[0], center[1]], zoom || 12, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Update Layers with Visual Styling for Alert Zones (Requirement 3)
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current) return;
    const {
      zonesLayer,
      routesLayer,
      habitationsLayer,
      sheltersLayer,
      teamsLayer,
      sensorsLayer,
      gpsLayer
    } = layersRef.current;

    // 1. Red Critical Zones & Alert Polygons (Requirement 3: Red Critical Zones)
    zonesLayer.clearLayers();
    if (visibleLayers.zones && riskZones && riskZones.length > 0) {
      riskZones.forEach(zone => {
        if (!zone?.polygon || !Array.isArray(zone.polygon) || zone.polygon.length < 3) return;

        const validPolygon = zone.polygon.filter(
          p => Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1])
        ) as [number, number][];

        if (validPolygon.length < 3) return;

        // Dynamic RAG Alert Zone Styling:
        // - Red Critical Zones: High risk score (>80%) or active flood breach
        // - Orange Caution Zones: Medium risk score (50–80%) or predicted inundation within 60 mins
        // - Green Safe Zones: Secured zones or active relocation shelters with available capacity
        const riskScore = zone.ragRiskScore || zone.probability || 50;
        const isCritical = zone.riskLevel === 'Critical' || zone.riskLevel === 'High' || riskScore > 80 || zone.activeBreach;
        const isCaution = !isCritical && (zone.riskLevel === 'Medium' || (riskScore >= 50 && riskScore <= 80));

        let fillColor = '#ef4444'; // Red Critical
        let strokeColor = '#dc2626';
        let fillOpacity = 0.44;
        let riskCategoryLabel = 'RED CRITICAL ZONE';

        if (isCaution) {
          fillColor = '#f97316'; // Vivid Orange Caution
          strokeColor = '#ea580c';
          fillOpacity = 0.32;
          riskCategoryLabel = 'ORANGE CAUTION ZONE';
        } else if (!isCritical && !isCaution) {
          fillColor = '#10b981'; // Green Safe
          strokeColor = '#059669';
          fillOpacity = 0.22;
          riskCategoryLabel = 'GREEN SAFE SANCTUARY';
        }

        const polygon = L.polygon(validPolygon, {
          color: strokeColor,
          weight: isCritical ? 3.0 : 2.0,
          fillColor,
          fillOpacity,
          dashArray: isCaution ? '6, 5' : undefined
        });

        polygon.bindPopup(`
          <div class="p-3.5 min-w-[260px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <span class="text-xs font-black uppercase tracking-wider ${
                isCritical ? 'text-rose-400' : isCaution ? 'text-orange-400' : 'text-emerald-400'
              }">● ${riskCategoryLabel}</span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">${zone.hazardType}</span>
            </div>
            <p class="font-bold text-sm mb-1.5 text-white">${zone.name}</p>
            <div class="text-xs space-y-1.5 text-slate-300">
              <div class="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                <span class="text-slate-400 font-mono">RAG Risk Score:</span>
                <strong class="font-mono text-sm ${isCritical ? 'text-rose-400 font-black' : isCaution ? 'text-orange-400' : 'text-emerald-400'}">${riskScore}%</strong>
              </div>
              ${zone.inundationEtaWindow ? `
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Inundation ETA:</span>
                  <strong class="text-amber-300 font-mono">${zone.inundationEtaWindow}</strong>
                </div>
              ` : ''}
              <div><span class="text-slate-400">Exposed Population:</span> <strong class="text-white">${(zone.population || 0).toLocaleString()} citizens</strong></div>
              <div><span class="text-slate-400">Vulnerable Headcount:</span> <strong class="text-rose-300">${(zone.vulnerablePopulation || 0).toLocaleString()}</strong></div>
              <div class="mt-2 text-xs bg-slate-950 p-2.5 rounded-lg text-slate-200 border border-slate-800 leading-relaxed font-sans">
                ${zone.recommendedAction}
              </div>
            </div>
          </div>
        `);

        polygon.addTo(zonesLayer);
      });
    }

    // 2. Corridors & Safe Routes (Requirement 3: Green safe routes, Sky Blue highlighted route)
    routesLayer.clearLayers();
    if (visibleLayers.routes && routes && routes.length > 0) {
      routes.forEach(r => {
        if (!r?.waypoints || !Array.isArray(r.waypoints) || r.waypoints.length < 2) return;

        const validWaypoints = r.waypoints.filter(
          wp => Array.isArray(wp) && typeof wp[0] === 'number' && typeof wp[1] === 'number' && !isNaN(wp[0]) && !isNaN(wp[1])
        ) as [number, number][];

        if (validWaypoints.length < 2) return;

        const isHighlighted = r.id === highlightRouteId;
        const status = r.statusText || (r.riskLevel === 'BLOCKED' ? 'BLOCKED' : r.riskLevel === 'RISKY' ? 'CAUTION' : 'CLEAR');

        // Sky Blue for Highlighted Route, Green for Clear, Red for Blocked
        let color = isHighlighted ? '#38bdf8' : '#10b981';
        let dashArray: string | undefined = undefined;
        let weight = isHighlighted ? 7 : 4.5;
        let opacity = isHighlighted ? 1.0 : 0.85;

        if (status === 'BLOCKED') {
          color = '#ef4444';
          weight = isHighlighted ? 8 : 5.5;
        } else if (status === 'CAUTION') {
          color = '#f59e0b';
          dashArray = '7, 6';
        }

        const polyline = L.polyline(validWaypoints, {
          color,
          weight,
          opacity,
          dashArray
        });

        polyline.bindPopup(`
          <div class="p-3 min-w-[260px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
              <span class="text-xs font-bold ${
                status === 'BLOCKED' ? 'text-rose-400' : status === 'CAUTION' ? 'text-amber-400' : 'text-emerald-400'
              }">● ${status} ROUTE CORRIDOR</span>
              <span class="text-xs text-slate-300 font-mono">${r.distanceKm} km • ${r.estimatedTravelTimeMin} min</span>
            </div>
            <div class="font-bold text-sm mb-1 text-white">${r.shelterName}</div>
            <div class="text-xs text-slate-300 mb-2 leading-relaxed">
              ${r.roadConditionNote || r.reason}
            </div>
          </div>
        `);

        polyline.on('click', () => {
          onSelectRoute?.(r.id);
        });

        polyline.addTo(routesLayer);
      });
    }

    // 3. Habitations Markers (Requirement 3: Sky Blue highlight on selection, Green for Rescued)
    habitationsLayer.clearLayers();
    if (visibleLayers.habitations && habitations && habitations.length > 0) {
      habitations.forEach((hab) => {
        const lat = hab?.lat ?? (hab as any)?.coordinates?.[0];
        const lng = hab?.lng ?? (hab as any)?.coordinates?.[1];

        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
          return;
        }

        const isSelected = hab.id === selectedHabitationId;
        const isRescued = hab.evacuationStatus === 'Rescued';
        const isCritical = hab.vulnerabilityLevel === 'Critical' && !isRescued;

        let badgeBg = 'bg-emerald-500';
        let badgeContent = isRescued ? '✓' : `${hab.vulnerabilityScore}`;

        if (isRescued) {
          badgeBg = 'bg-emerald-500 ring-2 ring-emerald-300';
        } else if (hab.vulnerabilityLevel === 'Critical') {
          badgeBg = 'bg-rose-500';
        } else if (hab.vulnerabilityLevel === 'High') {
          badgeBg = 'bg-amber-500';
        } else if (hab.vulnerabilityLevel === 'Medium') {
          badgeBg = 'bg-blue-500';
        }

        // Sky Blue halo highlight when selected (Requirement 3: Sky Blue highlight markers)
        const highlightRing = isSelected
          ? 'ring-4 ring-sky-400/80 border-sky-300 scale-125 shadow-sky-500/50 shadow-xl'
          : 'border-slate-900 shadow-md';

        const iconHtml = `
          <div class="relative group cursor-pointer" style="z-index: ${isSelected ? 100 : isRescued ? 80 : 50}">
            ${isCritical ? '<div class="absolute -inset-1 rounded-full bg-rose-500/60 animate-ping"></div>' : ''}
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${badgeBg} text-white font-black text-xs border-2 ${highlightRing} transition-transform">
              ${badgeContent}
            </div>
            ${
              (isSelected || isRescued) ? `
                <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-slate-100 text-xs px-2 py-0.5 rounded-md border border-slate-700 shadow-lg font-bold flex items-center gap-1.5 pointer-events-none">
                  ${isRescued ? '<span class="text-emerald-400 font-extrabold">✓ SECURED</span>' : ''}
                  <span>${hab.name.replace('Village ', '').replace(' Settlement', '')}</span>
                </div>
              ` : ''
            }
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'clean-hab-marker',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.bindTooltip(
          `${hab.name} (${isRescued ? 'Rescued' : `Vulnerability ${hab.vulnerabilityScore}`})`,
          {
            direction: 'top',
            offset: [0, -18],
            className: 'map-marker-tooltip',
            opacity: 0.95
          }
        );

        const d = hab.demographics;
        const vulnerableSum = d ? (d.children + d.elderly + d.disabilities + d.pregnantWomen + d.medicalDependency) : 0;

        marker.bindPopup(`
          <div class="p-3 min-w-[270px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <span class="text-xs font-bold ${isRescued ? 'text-emerald-400' : 'text-amber-400'}">
                ${isRescued ? '✓ RESCUED / SECURED' : 'AFFECTED SETTLEMENT'}
              </span>
              <span class="text-xs px-2 py-0.5 rounded font-semibold ${
                isRescued
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : hab.vulnerabilityLevel === 'Critical'
                  ? 'bg-rose-900/80 text-rose-200'
                  : 'bg-slate-800 text-slate-200'
              }">Vulnerability: ${hab.vulnerabilityScore}/100</span>
            </div>
            <div class="font-bold text-base text-white mb-1.5">${hab.name}</div>
            
            ${
              isRescued ? `
                <div class="bg-emerald-950/80 border border-emerald-700/60 p-2.5 rounded-xl mb-2 text-xs text-emerald-200">
                  <div class="font-bold text-emerald-300">Evacuation Completed</div>
                  <div>Evacuated: <strong>${hab.rescuedCount || hab.demographics?.total || 0} residents</strong></div>
                  <div>Timestamp: ${hab.rescuedAt || 'Recently completed'}</div>
                </div>
              ` : `
                <div class="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>Total Pop: <strong class="text-white">${d?.total?.toLocaleString() ?? 0}</strong></div>
                  <div>Vulnerable: <strong class="text-rose-300">${vulnerableSum.toLocaleString()}</strong></div>
                  <div>Hazard: <strong class="text-amber-300">${hab.currentHazard || 'Flood'}</strong></div>
                  <div>Road Access: <strong class="text-white">${hab.roadAccessibilityScore}/100</strong></div>
                </div>
              `
            }

            <div class="flex gap-2 pt-1 border-t border-slate-700/60">
              <button id="btn-evac-${hab.id}" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 px-3 rounded-lg shadow transition cursor-pointer">
                ${isRescued ? 'Mission Details' : 'Evacuate Now'}
              </button>
              <button id="btn-ai-${hab.id}" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-lg shadow transition cursor-pointer">
                AI Why?
              </button>
            </div>
          </div>
        `);

        marker.on('popupopen', () => {
          const evacBtn = document.getElementById(`btn-evac-${hab.id}`);
          if (evacBtn) evacBtn.onclick = () => onTriggerEvacuation?.(hab.id);
          const aiBtn = document.getElementById(`btn-ai-${hab.id}`);
          if (aiBtn) aiBtn.onclick = () => onRequestAIExplanation?.(hab.id);
        });

        marker.on('click', () => {
          onSelectHabitation?.(hab.id);
        });

        marker.addTo(habitationsLayer);
      });
    }

    // 4. Shelters Markers (Requirement 3: Green Active Relocation Indicators + Sky Blue selection halo)
    sheltersLayer.clearLayers();
    if (visibleLayers.shelters && shelters && shelters.length > 0) {
      shelters.forEach(shelter => {
        const sLat = shelter?.lat ?? (shelter as any)?.coordinates?.[0];
        const sLng = shelter?.lng ?? (shelter as any)?.coordinates?.[1];

        if (typeof sLat !== 'number' || typeof sLng !== 'number' || isNaN(sLat) || isNaN(sLng)) {
          return;
        }

        const avail = Math.max(0, shelter.totalCapacity - shelter.occupiedCapacity - shelter.reservedCapacity);
        const isFull = avail <= 100;
        const isSelected = shelter.id === selectedShelterId;

        // Sky Blue halo on selection
        const highlightRing = isSelected
          ? 'border-sky-300 ring-4 ring-sky-400/80 scale-125 shadow-sky-500/50 shadow-xl'
          : 'border-slate-900 shadow-md';

        const shelterHtml = `
          <div class="relative group cursor-pointer" style="z-index: ${isSelected ? 90 : 60}">
            <div class="flex items-center justify-center w-8 h-8 rounded-xl ${
              isFull ? 'bg-rose-600' : 'bg-emerald-600'
            } text-white shadow-lg border-2 ${highlightRing} text-sm font-bold transition-transform">
              ⌂
            </div>
            ${
              isSelected ? `
                <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-emerald-400 text-xs px-2 py-0.5 rounded-md font-mono font-bold border border-slate-700 shadow-lg pointer-events-none">
                  ${avail.toLocaleString()} berths free
                </div>
              ` : ''
            }
          </div>
        `;

        const shelterIcon = L.divIcon({
          className: 'clean-shelter-marker',
          html: shelterHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([sLat, sLng], { icon: shelterIcon });

        marker.bindTooltip(
          `${shelter.name} (${avail.toLocaleString()} berths free)`,
          {
            direction: 'bottom',
            offset: [0, 18],
            className: 'map-shelter-tooltip',
            opacity: 0.95
          }
        );

        marker.bindPopup(`
          <div class="p-3 min-w-[280px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
              <span class="text-xs font-bold text-emerald-400">RELOCATION CENTRE</span>
              <span class="text-xs px-2 py-0.5 rounded font-semibold ${
                isFull ? 'bg-rose-900 text-rose-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }">${shelter.status || 'Active'}</span>
            </div>
            <div class="font-bold text-base text-white mb-1">${shelter.name}</div>
            <div class="text-xs text-slate-400 mb-2.5">${shelter.location || shelter.address}</div>

            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-3 text-xs font-mono space-y-1">
              <div class="flex justify-between text-slate-300">
                <span>Total Capacity:</span> <strong class="text-white">${shelter.totalCapacity.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-rose-400">
                <span>Occupied:</span> <strong>${shelter.occupiedCapacity.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-amber-300">
                <span>Reserved:</span> <strong>${shelter.reservedCapacity.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                <span>Available Berths:</span> <strong>${avail.toLocaleString()}</strong>
              </div>
            </div>

            <button id="btn-shelter-select-${shelter.id}" class="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold py-2 rounded-lg shadow transition cursor-pointer">
              Select Relocation Centre
            </button>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-shelter-select-${shelter.id}`);
          if (btn) btn.onclick = () => onSelectShelter?.(shelter.id);
        });

        marker.on('click', () => {
          onSelectShelter?.(shelter.id);
        });

        marker.addTo(sheltersLayer);
      });
    }

    // 5. Rescue Teams Markers (Requirement 3: Sky Blue NDRF markers)
    teamsLayer.clearLayers();
    if (visibleLayers.teams && teams && teams.length > 0) {
      teams.forEach(team => {
        const tLat = team?.currentLocation?.lat ?? (team as any)?.lat ?? (team as any)?.coordinates?.[0];
        const tLng = team?.currentLocation?.lng ?? (team as any)?.lng ?? (team as any)?.coordinates?.[1];

        if (typeof tLat !== 'number' || typeof tLng !== 'number' || isNaN(tLat) || isNaN(tLng)) {
          return;
        }

        const teamIcon = L.divIcon({
          className: 'clean-team-marker',
          html: `
            <div class="w-7 h-7 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center font-extrabold text-xs shadow-lg border-2 border-slate-900 cursor-pointer ring-2 ring-sky-300/50">
              T
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([tLat, tLng], { icon: teamIcon });

        marker.bindTooltip(
          `${team.name} (${team.status})`,
          { direction: 'top', offset: [0, -16], className: 'map-marker-tooltip' }
        );

        marker.bindPopup(`
          <div class="p-2.5 text-slate-100 font-sans text-xs">
            <div class="font-bold text-sky-400 text-sm">${team.name}</div>
            <div class="text-slate-200 mt-1">Status: <strong>${team.status}</strong></div>
            <div class="text-slate-400 mt-0.5">Personnel: ${team.teamCapacity || 12} • Boats: ${team.boatCount || 2}</div>
          </div>
        `);

        marker.addTo(teamsLayer);
      });
    }

    // 6. GPS Location (Requirement 3: Sky Blue highlight beacon)
    gpsLayer.clearLayers();
    if (gpsLocation && typeof gpsLocation.lat === 'number' && typeof gpsLocation.lng === 'number' && !isNaN(gpsLocation.lat) && !isNaN(gpsLocation.lng)) {
      const gpsIcon = L.divIcon({
        className: 'clean-gps-marker',
        html: `
          <div class="w-7 h-7 rounded-full bg-sky-400 ring-4 ring-sky-400/50 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xl animate-pulse">
            ●
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([gpsLocation.lat, gpsLocation.lng], { icon: gpsIcon });
      marker.bindTooltip(`My GPS Staging: ${gpsLocation.name || 'Current Base'}`, { direction: 'top' });
      marker.addTo(gpsLayer);
    }

    // 7. Sensors
    sensorsLayer.clearLayers();
    if (visibleLayers.sensors) {
      const sensors = [
        { id: 'sens-1', name: 'Kosi River Gauge GS-04', lat: 25.589, lng: 87.208, reading: '+4.82m (Spate Alert)' },
        { id: 'sens-2', name: 'Doppler Radar Station DP-2', lat: 25.560, lng: 87.240, reading: '185mm/3h Rain' }
      ];

      sensors.forEach(sensor => {
        if (typeof sensor.lat !== 'number' || typeof sensor.lng !== 'number' || isNaN(sensor.lat) || isNaN(sensor.lng)) {
          return;
        }

        const sensorIcon = L.divIcon({
          className: 'clean-sensor-marker',
          html: `
            <div class="w-5 h-5 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center text-[10px] font-black shadow-md border border-slate-900 animate-pulse cursor-pointer">
              ◎
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([sensor.lat, sensor.lng], { icon: sensorIcon });
        marker.bindTooltip(`${sensor.name}: ${sensor.reading}`, { direction: 'top', offset: [0, -12] });
        marker.addTo(sensorsLayer);
      });
    }

  }, [
    habitations,
    shelters,
    teams,
    riskZones,
    routeSegments,
    routes,
    selectedHabitationId,
    selectedShelterId,
    highlightRouteId,
    gpsLocation,
    visibleLayers
  ]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Top-Right Floating Controls with Basemap Switcher & Collapsed Legend */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          {onLocateUser && (
            <button
              onClick={onLocateUser}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg text-xs font-semibold text-cyan-300 transition backdrop-blur-md cursor-pointer"
              title="Locate my GPS Staging Base"
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden sm:inline">My GPS</span>
            </button>
          )}

          {/* Map Tile Style Switcher: Google Maps (if key present), Dark Tactical, or Street OSM */}
          <div className="bg-slate-900/90 border border-slate-700 p-1 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1">
            {googleMapsApiKey && (
              <button
                onClick={() => setTileStyle('google')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tileStyle === 'google'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Google Maps Platform Vector Roadmap"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </button>
            )}

            <button
              onClick={() => setTileStyle('dark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                tileStyle === 'dark'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Dark Tactical Basemap (CartoDB)"
            >
              <span>Dark Map</span>
            </button>

            <button
              onClick={() => setTileStyle('osm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                tileStyle === 'osm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Street Map (OpenStreetMap)"
            >
              <span>OSM</span>
            </button>
          </div>

          {/* Small Floating Toggle Button for Layers */}
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold transition border backdrop-blur-md cursor-pointer ${
              isLegendOpen
                ? 'bg-amber-600 text-slate-950 border-amber-500 font-extrabold'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Toggle Geospatial Layers & Legend"
          >
            <Layers className="w-4 h-4" />
            <span>Layers</span>
          </button>
        </div>

        {/* Floating Dropdown Panel (Only visible when toggled) */}
        {isLegendOpen && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-xs text-slate-200 w-72 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Geospatial Layers &amp; Legends
              </span>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="text-slate-400 hover:text-white text-sm px-1 font-bold cursor-pointer"
                aria-label="Close layers menu"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm animate-pulse"></span>
                  <span>Threatened Settlements</span>
                </div>
                <button
                  onClick={() => setVisibleLayers(v => ({ ...v, habitations: !v.habitations }))}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {visibleLayers.habitations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
                  <span>Rescued / Secured Settlements</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-xs text-white flex items-center justify-center font-bold">⌂</span>
                  <span>Relocation Centres (Green)</span>
                </div>
                <button
                  onClick={() => setVisibleLayers(v => ({ ...v, shelters: !v.shelters }))}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {visibleLayers.shelters ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-sky-400 text-xs text-slate-950 flex items-center justify-center font-bold">T</span>
                  <span>NDRF Rescue Teams (Sky Blue)</span>
                </div>
                <button
                  onClick={() => setVisibleLayers(v => ({ ...v, teams: !v.teams }))}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {visibleLayers.teams ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded bg-rose-500/40 border border-rose-500"></span>
                  <span>Red Critical Hazard Zones</span>
                </div>
                <button
                  onClick={() => setVisibleLayers(v => ({ ...v, zones: !v.zones }))}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {visibleLayers.zones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              </div>

              <div className="border-t border-slate-800 pt-2 mt-2 space-y-1.5 font-mono text-xs">
                <div className="font-semibold text-slate-400 uppercase">Route Status:</div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1.5 bg-emerald-500 rounded"></span>
                  <span className="text-emerald-300 font-bold">CLEAR</span>
                  <span className="text-slate-400 text-[11px]">(Safe Inbound)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1.5 bg-sky-400 rounded"></span>
                  <span className="text-sky-300 font-bold">ACTIVE NAVIGATION</span>
                  <span className="text-slate-400 text-[11px]">(Highlight)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1.5 bg-amber-500 rounded border-dashed"></span>
                  <span className="text-amber-300 font-bold">CAUTION</span>
                  <span className="text-slate-400 text-[11px]">(Slow Traffic)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1.5 bg-rose-500 rounded"></span>
                  <span className="text-rose-400 font-bold">BLOCKED</span>
                  <span className="text-slate-400 text-[11px]">(Impassable)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
