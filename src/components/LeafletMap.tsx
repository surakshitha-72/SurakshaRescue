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
import { Layers, MapPin, Eye, EyeOff, Navigation, Crosshair } from 'lucide-react';

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
  const [isLegendOpen, setIsLegendOpen] = useState(true);
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

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]],
      zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Dark styled OpenStreetMap CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

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

  // Pan to center if center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center[0], center[1]], zoom || 12, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Update Layers when props or layer toggles change
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

    // 1. Risk Zones
    zonesLayer.clearLayers();
    if (visibleLayers.zones) {
      riskZones.forEach(zone => {
        let fillColor = '#ef4444'; // Red High
        let strokeColor = '#dc2626';
        if (zone.riskLevel === 'Medium') {
          fillColor = '#f59e0b'; // Yellow / Amber
          strokeColor = '#d97706';
        } else if (zone.riskLevel === 'Low') {
          fillColor = '#10b981'; // Green Safe
          strokeColor = '#059669';
        }

        const polygon = L.polygon(zone.polygon, {
          color: strokeColor,
          weight: 2,
          fillColor,
          fillOpacity: zone.riskLevel === 'High' ? 0.35 : 0.20,
          dashArray: zone.riskLevel === 'Medium' ? '5, 5' : undefined
        });

        polygon.bindPopup(`
          <div class="p-2 min-w-[220px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider ${
                zone.riskLevel === 'High' ? 'text-rose-400' : zone.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
              }">${zone.riskLevel} Risk Zone</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">${zone.hazardType}</span>
            </div>
            <p class="font-semibold text-sm mb-1">${zone.name}</p>
            <div class="text-xs space-y-1 text-slate-300">
              <div><span class="text-slate-400">Probability:</span> <strong>${zone.probability}%</strong></div>
              <div><span class="text-slate-400">Exposed Population:</span> <strong>${zone.population.toLocaleString()}</strong></div>
              <div><span class="text-slate-400">Vulnerable:</span> <strong class="text-rose-300">${zone.vulnerablePopulation.toLocaleString()}</strong></div>
              <div class="mt-2 text-[11px] bg-slate-800/80 p-1.5 rounded text-slate-300 border border-slate-700">
                ${zone.recommendedAction}
              </div>
            </div>
          </div>
        `);

        polygon.addTo(zonesLayer);
      });
    }

    // 2. Routes & Road Segments
    routesLayer.clearLayers();
    if (visibleLayers.routes) {
      // 2A. Render Evacuation Routes if provided
      if (routes && routes.length > 0) {
        routes.forEach(r => {
          const isHighlighted = r.id === highlightRouteId;
          let color = '#10b981'; // CLEAR green
          let dashArray: string | undefined = undefined;
          let weight = isHighlighted ? 6 : 4;
          let opacity = isHighlighted ? 1.0 : 0.75;

          const status = r.statusText || (r.riskLevel === 'BLOCKED' ? 'BLOCKED' : r.riskLevel === 'RISKY' ? 'CAUTION' : 'CLEAR');

          if (status === 'BLOCKED') {
            color = '#ef4444';
            weight = isHighlighted ? 7 : 5;
          } else if (status === 'CAUTION') {
            color = '#f59e0b';
            dashArray = '7, 6';
          } else if (status === 'UNKNOWN') {
            color = '#94a3b8';
            dashArray = '5, 5';
          }

          if (r.waypoints && r.waypoints.length > 1) {
            const polyline = L.polyline(r.waypoints, {
              color,
              weight,
              opacity,
              dashArray
            });

            polyline.bindPopup(`
              <div class="p-2 min-w-[240px] text-slate-100 font-sans">
                <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
                  <span class="text-xs font-bold ${
                    status === 'BLOCKED' ? 'text-rose-400' : status === 'CAUTION' ? 'text-amber-400' : status === 'UNKNOWN' ? 'text-slate-400' : 'text-emerald-400'
                  }">â— ${status} ROUTE</span>
                  <span class="text-[10px] text-slate-400">${r.distanceKm} km â€¢ ${r.estimatedTravelTimeMin} min</span>
                </div>
                <div class="font-bold text-xs mb-1 text-slate-100">${r.shelterName}</div>
                <div class="text-[11px] text-slate-300 mb-2">
                  ${r.roadConditionNote || r.reason}
                </div>
                <div class="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                  ${r.lastUpdatedTime || 'Updated recently'}
                </div>
              </div>
            `);

            polyline.on('click', () => {
              onSelectRoute?.(r.id);
            });

            polyline.addTo(routesLayer);

            // Blocked icon on middle of blocked route
            if (status === 'BLOCKED') {
              const midIdx = Math.floor(r.waypoints.length / 2);
              const midPt = r.waypoints[midIdx];
              const blockIcon = L.divIcon({
                className: 'route-block-icon',
                html: `
                  <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-lg animate-pulse">
                    âœ•
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });
              L.marker(midPt, { icon: blockIcon }).addTo(routesLayer);
            }
          }
        });
      }

      // 2B. Base Road Segments
      routeSegments.forEach(seg => {
        let color = '#10b981';
        let dashArray: string | undefined = undefined;
        let weight = 4;
        let opacity = 0.8;

        if (seg.status === 'BLOCKED') {
          color = '#ef4444';
          weight = 5;
        } else if (seg.status === 'RISKY') {
          color = '#f59e0b';
          dashArray = '6, 6';
        } else if (seg.status === 'UNKNOWN') {
          color = '#94a3b8';
          dashArray = '4, 4';
        }

        const polyline = L.polyline(seg.coordinates, {
          color,
          weight,
          opacity,
          dashArray
        });

        polyline.bindPopup(`
          <div class="p-2 min-w-[220px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
              <span class="text-xs font-bold ${
                seg.status === 'BLOCKED' ? 'text-rose-400' : seg.status === 'RISKY' ? 'text-amber-400' : 'text-emerald-400'
              }">${seg.status} SEGMENT</span>
              <span class="text-[10px] text-slate-400">Updated: ${seg.lastUpdated}</span>
            </div>
            <div class="font-medium text-xs mb-1 text-slate-200">${seg.name}</div>
            <div class="text-[11px] text-slate-300">
              From: <strong>${seg.from}</strong><br/>
              To: <strong>${seg.to}</strong>
            </div>
            ${
              seg.blockageReason ? `
              <div class="mt-2 p-1.5 bg-rose-950/60 border border-rose-800/50 rounded text-[11px] text-rose-200">
                âš  ${seg.blockageReason}
              </div>
            ` : ''
            }
          </div>
        `);

        polyline.addTo(routesLayer);

        if (seg.status === 'BLOCKED' && seg.coordinates.length > 1) {
          const midIdx = Math.floor(seg.coordinates.length / 2);
          const midPoint = seg.coordinates[midIdx];
          const blockIcon = L.divIcon({
            className: 'custom-blocked-icon',
            html: `
              <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-lg animate-pulse">
                âœ•
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          L.marker(midPoint, { icon: blockIcon }).addTo(routesLayer);
        }
      });
    }

    // 3. Habitations Markers
    habitationsLayer.clearLayers();
    if (visibleLayers.habitations) {
      habitations.forEach((hab, idx) => {
        const isSelected = hab.id === selectedHabitationId;
        const isRescued = hab.evacuationStatus === 'Rescued';
        const isCritical = hab.vulnerabilityLevel === 'Critical' && !isRescued;

        let badgeBg = 'bg-emerald-500';
        let badgeContent = `${hab.vulnerabilityScore}`;

        if (isRescued) {
          badgeBg = 'bg-emerald-500 ring-2 ring-emerald-300';
          badgeContent = 'âœ“';
        } else if (hab.vulnerabilityLevel === 'Critical') {
          badgeBg = 'bg-rose-500';
        } else if (hab.vulnerabilityLevel === 'High') {
          badgeBg = 'bg-amber-500';
        } else if (hab.vulnerabilityLevel === 'Medium') {
          badgeBg = 'bg-blue-500';
        }

        const iconHtml = `
          <div class="relative group cursor-pointer">
            ${isCritical ? '<div class="absolute -inset-1 rounded-full bg-rose-500/50 animate-ping"></div>' : ''}
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${badgeBg} text-white font-bold text-xs shadow-lg border-2 ${
              isSelected ? 'border-amber-300 ring-4 ring-amber-400/50' : 'border-slate-900'
            }">
              ${badgeContent}
            </div>
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 text-slate-100 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 shadow pointer-events-none font-medium flex items-center gap-1">
              ${isRescued ? '<span class="text-emerald-400 font-bold">RESCUED</span>' : ''}
              ${hab.name.replace('Village ', '').replace(' Settlement', '')}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-hab-icon',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([hab.lat, hab.lng], { icon: customIcon });

        const d = hab.demographics;
        const vulnerableSum = d.children + d.elderly + d.disabilities + d.pregnantWomen + d.medicalDependency;

        marker.bindPopup(`
          <div class="p-2.5 min-w-[260px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
              <span class="text-xs font-bold ${isRescued ? 'text-emerald-400' : 'text-amber-400'}">
                ${isRescued ? 'âœ… RESCUED HABITATION' : 'AFFECTED HABITATION'}
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded font-semibold ${
                isRescued
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : hab.vulnerabilityLevel === 'Critical'
                  ? 'bg-rose-900/70 text-rose-300'
                  : 'bg-slate-800 text-slate-200'
              }">Vulnerability: ${hab.vulnerabilityScore}/100</span>
            </div>
            <div class="font-bold text-sm text-slate-100 mb-1">${hab.name}</div>
            
            ${
              isRescued ? `
                <div class="bg-emerald-950/70 border border-emerald-700/60 p-2 rounded mb-2 text-xs text-emerald-200">
                  <div class="font-bold">Rescue Completed</div>
                  <div>Rescued Count: <strong>${hab.rescuedCount || hab.demographics.total} people</strong></div>
                  <div>Timestamp: ${hab.rescuedAt || 'Recently completed'}</div>
                  ${hab.rescueNotes ? `<div class="mt-1 text-[11px] text-emerald-300">Notes: ${hab.rescueNotes}</div>` : ''}
                </div>
              ` : `
                <div class="grid grid-cols-2 gap-1.5 text-xs text-slate-300 mb-2.5 bg-slate-800/60 p-2 rounded border border-slate-700/60">
                  <div>Total Pop: <strong>${d.total.toLocaleString()}</strong></div>
                  <div>Vulnerable: <strong class="text-rose-300">${vulnerableSum.toLocaleString()}</strong></div>
                  <div>Children: <strong>${d.children}</strong></div>
                  <div>Elderly: <strong>${d.elderly}</strong></div>
                  <div>Medical Need: <strong class="text-amber-300">${d.medicalDependency}</strong></div>
                  <div>Road Access: <strong>${hab.roadAccessibilityScore}/100</strong></div>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  <div>Status: <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    hab.evacuationStatus === 'Alerted' ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'
                  }">${hab.evacuationStatus}</span></div>
                  <div class="mt-1">Nearest Shelter: <strong>${hab.distanceToNearestShelterKm} km</strong></div>
                </div>
              `
            }

            <div class="flex gap-2 pt-1 border-t border-slate-700/60">
              <button id="btn-evac-${hab.id}" class="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-1.5 px-2 rounded shadow transition">
                ${isRescued ? 'Rescue Details' : 'Evacuate'}
              </button>
              <button id="btn-ai-${hab.id}" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-2 rounded shadow transition">
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

    // 4. Shelters Markers
    sheltersLayer.clearLayers();
    if (visibleLayers.shelters) {
      shelters.forEach(shelter => {
        const avail = shelter.totalCapacity - shelter.occupiedCapacity - shelter.reservedCapacity;
        const isFull = avail <= 100;
        const isSelected = shelter.id === selectedShelterId;

        const shelterHtml = `
          <div class="relative group cursor-pointer">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg ${
              isFull ? 'bg-rose-600' : 'bg-blue-600'
            } text-white shadow-xl border-2 ${isSelected ? 'border-cyan-300 ring-4 ring-cyan-400/40' : 'border-slate-900'} text-sm font-bold">
              âŒ‚
            </div>
            <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-cyan-300 text-[10px] px-1 py-0.2 rounded font-mono font-bold border border-slate-700">
              ${Math.max(0, avail)} free
            </div>
          </div>
        `;

        const shelterIcon = L.divIcon({
          className: 'custom-shelter-icon',
          html: shelterHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon });

        marker.bindPopup(`
          <div class="p-2.5 min-w-[270px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
              <span class="text-xs font-bold text-cyan-400">RELOCATION CENTRE</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                isFull ? 'bg-rose-900 text-rose-300' : 'bg-blue-900 text-blue-200'
              }">${shelter.status}</span>
            </div>
            <div class="font-bold text-sm text-slate-100 mb-1">${shelter.name}</div>
            <div class="text-[11px] text-slate-400 mb-2">${shelter.address}</div>

            <div class="bg-slate-800/80 p-2 rounded border border-slate-700/80 mb-2 text-xs">
              <div class="flex justify-between text-slate-300 mb-1">
                <span>Total Capacity:</span> <strong>${shelter.totalCapacity.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-slate-300 mb-1">
                <span>Occupied:</span> <strong class="text-slate-100">${shelter.occupiedCapacity.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-amber-300 mb-1">
                <span>Reserved:</span> <strong>${shelter.reservedCapacity.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-emerald-400 font-semibold border-t border-slate-700 pt-1">
                <span>Available Berths:</span> <strong>${Math.max(0, avail).toLocaleString()}</strong>
              </div>
            </div>

            <button id="btn-shelter-select-${shelter.id}" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-1.5 rounded shadow transition">
              Select for Rescue Route
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

    // 5. Rescue Teams Markers
    teamsLayer.clearLayers();
    if (visibleLayers.teams) {
      teams.forEach(team => {
        const teamHtml = `
          <div class="relative cursor-pointer">
            <div class="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-lg border border-white">
              ${team.boatAvailability ? 'âš“' : 'âš’'}
            </div>
            <div class="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-950/90 text-amber-300 text-[9px] px-1 rounded font-bold border border-amber-700">
              ${team.unit.includes('National') ? 'NDRF' : 'SDRF'}
            </div>
          </div>
        `;

        const teamIcon = L.divIcon({
          className: 'custom-team-icon',
          html: teamHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([team.currentLocation.lat, team.currentLocation.lng], { icon: teamIcon });

        marker.bindPopup(`
          <div class="p-2 min-w-[230px] text-slate-100 font-sans">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-1.5">
              <span class="text-xs font-bold text-amber-400">RESCUE TEAM UNIT</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${
                team.status === 'Available' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'
              }">${team.status}</span>
            </div>
            <div class="font-bold text-xs text-slate-100">${team.name}</div>
            <div class="text-[11px] text-slate-400 mb-1.5">${team.unit}</div>
            <div class="text-xs space-y-0.5 text-slate-300 bg-slate-800/70 p-1.5 rounded border border-slate-700">
              <div>Capacity: <strong>${team.teamCapacity}</strong> | Transport: <strong>${team.vehicleCapacity}</strong></div>
              <div>Boats: <strong>${team.boatAvailability ? `${team.boatCount} Boats` : 'None'}</strong></div>
              <div>Medical: <strong>${team.medicalCapability}</strong></div>
            </div>
          </div>
        `);

        marker.addTo(teamsLayer);
      });
    }

    // 6. User GPS Location Marker (if provided)
    gpsLayer.clearLayers();
    if (gpsLocation) {
      const gpsHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 rounded-full bg-cyan-500/40 animate-ping"></div>
          <div class="relative w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-bold text-[10px]">
            â—‰
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-slate-900/90 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-cyan-700 shadow">
            ${gpsLocation.name || 'GPS START'}
          </div>
        </div>
      `;

      const gpsIcon = L.divIcon({
        className: 'user-gps-icon',
        html: gpsHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([gpsLocation.lat, gpsLocation.lng], { icon: gpsIcon });
      marker.bindPopup(`
        <div class="p-2 text-slate-100 font-sans text-xs">
          <div class="font-bold text-cyan-400 mb-0.5">Rescue Team GPS Position</div>
          <div class="font-medium">${gpsLocation.name || 'Live GPS Location'}</div>
          <div class="text-slate-400 mt-1 font-mono">${gpsLocation.lat.toFixed(4)}Â° N, ${gpsLocation.lng.toFixed(4)}Â° E</div>
        </div>
      `);
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
        const sensorIcon = L.divIcon({
          className: 'sensor-icon',
          html: `
            <div class="w-5 h-5 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center text-[10px] font-bold shadow-lg border border-slate-900 animate-pulse cursor-pointer">
              â—Ž
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([sensor.lat, sensor.lng], { icon: sensorIcon });
        marker.bindPopup(`
          <div class="p-1.5 text-slate-100 font-sans text-xs">
            <div class="font-bold text-cyan-300 mb-0.5">Telemetry Sensor</div>
            <div class="font-medium">${sensor.name}</div>
            <div class="text-rose-400 font-bold mt-1">${sensor.reading}</div>
          </div>
        `);
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
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Top Floating Map Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 pointer-events-auto">
        {onLocateUser && (
          <button
            onClick={onLocateUser}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-lg text-xs font-semibold text-cyan-300 transition"
            title="Locate my GPS"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My GPS</span>
          </button>
        )}

        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-lg text-xs font-semibold text-slate-200 transition"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Legend</span>
        </button>
      </div>

      {/* Floating Collapsible Map Legend */}
      {isLegendOpen && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-xs text-slate-200 pointer-events-auto max-w-[270px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">
              India Geospatial Layers
            </span>
            <button
              onClick={() => setIsLegendOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm animate-pulse"></span>
                <span>Critical / Disaster Point</span>
              </div>
              <button
                onClick={() => setVisibleLayers(v => ({ ...v, habitations: !v.habitations }))}
                className="text-slate-400 hover:text-slate-200"
              >
                {visibleLayers.habitations ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 text-[9px] text-white flex items-center justify-center font-bold">H</span>
                <span>Relocation Centre</span>
              </div>
              <button
                onClick={() => setVisibleLayers(v => ({ ...v, shelters: !v.shelters }))}
                className="text-slate-400 hover:text-slate-200"
              >
                {visibleLayers.shelters ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] text-slate-950 flex items-center justify-center font-bold">T</span>
                <span>Rescue Team (NDRF/SDRF)</span>
              </div>
              <button
                onClick={() => setVisibleLayers(v => ({ ...v, teams: !v.teams }))}
                className="text-slate-400 hover:text-slate-200"
              >
                {visibleLayers.teams ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-cyan-200/50"></span>
                <span>GPS Location (Start Point)</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-1.5 mt-1.5 space-y-1 font-mono text-[10px]">
              <div className="font-semibold text-slate-400 uppercase">Route Status:</div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-emerald-500 rounded"></span>
                <span className="text-emerald-300 font-bold">CLEAR</span>
                <span className="text-slate-400 text-[10px]">(Usable)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-amber-500 rounded border-dashed"></span>
                <span className="text-amber-300 font-bold">CAUTION</span>
                <span className="text-slate-400 text-[10px]">(Risk/Slow)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-rose-500 rounded"></span>
                <span className="text-rose-400 font-bold">BLOCKED</span>
                <span className="text-slate-400 text-[10px]">(Impassable)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-slate-400 rounded"></span>
                <span className="text-slate-400 font-bold">UNKNOWN</span>
                <span className="text-slate-400 text-[10px]">(Verify first)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
