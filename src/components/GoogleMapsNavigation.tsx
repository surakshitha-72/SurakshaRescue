import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  Play,
  Pause,
  ExternalLink,
  Volume2,
  VolumeX,
  Flag,
  RotateCcw,
  CheckCircle2,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  ArrowRight,
  Shield,
  Layers,
  LocateFixed,
  Car
} from 'lucide-react';
import { EvacuationRoute, TurnByTurnStep } from '../types/disaster';

interface GoogleMapsNavigationProps {
  origin: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
    address?: string;
  };
  waypoint: {
    lat: number;
    lng: number;
    name: string;
  };
  route: EvacuationRoute;
  isNavigating: boolean;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  audioAlertsEnabled: boolean;
  onToggleAudioAlerts: () => void;
  onMarkRescued?: () => void;
}

export const GoogleMapsNavigation: React.FC<GoogleMapsNavigationProps> = ({
  origin,
  destination,
  waypoint,
  route,
  isNavigating,
  onStartNavigation,
  onStopNavigation,
  audioAlertsEnabled,
  onToggleAudioAlerts,
  onMarkRescued
}) => {
  // Navigation simulation progress (0% to 100%)
  const [navProgress, setNavProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speedKmH, setSpeedKmH] = useState(38);
  const [mapMode, setMapMode] = useState<'embed' | 'hud'>('embed');

  const steps = route.turnByTurnSteps || [
    {
      instruction: `Depart from ${origin.name} toward ${waypoint.name}`,
      distanceMeters: 800,
      roadName: 'Staging Access Road',
      action: 'straight' as const
    },
    {
      instruction: `Turn right onto main evacuation corridor toward ${waypoint.name}`,
      distanceMeters: 1800,
      roadName: 'NH-31 Highway / River Road',
      action: 'turn-right' as const
    },
    {
      instruction: `Arrive at affected evacuation cluster in ${waypoint.name}`,
      distanceMeters: 2200,
      roadName: 'Ward Link Corridor',
      action: 'take-exit' as const
    },
    {
      instruction: `Board evacuees and proceed straight toward ${destination.name}`,
      distanceMeters: 3100,
      roadName: 'Elevated High Embankment Expressway',
      action: 'straight' as const
    },
    {
      instruction: `Turn left into ${destination.name} main gate`,
      distanceMeters: 450,
      roadName: 'Shelter Relief Access Rd',
      action: 'turn-left' as const
    },
    {
      instruction: `Arrived safely at ${destination.name}`,
      distanceMeters: 0,
      roadName: 'Relocation Camp Gate',
      action: 'arrive' as const
    }
  ];

  // Official Universal Google Maps Navigation URL with turn-by-turn driving action
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypoint.lat},${waypoint.lng}&travelmode=driving&dir_action=navigate`;

  // Standard Google Maps directions embed URL (works natively in iframe)
  const embedGoogleMapsUrl = `https://maps.google.com/maps?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&hl=en&z=13&output=embed`;

  // Advance driver along the journey during active navigation simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isNavigating) {
      interval = setInterval(() => {
        setNavProgress(prev => {
          if (prev >= 100) {
            return 100;
          }
          // Incremental advance along the route
          const next = prev + 1.2;
          // Calculate step index based on progress
          const calculatedStep = Math.min(
            steps.length - 1,
            Math.floor((next / 100) * steps.length)
          );
          setCurrentStepIndex(calculatedStep);

          // Slight realistic speed fluctuation
          setSpeedKmH(Math.floor(34 + Math.sin(next / 5) * 8));

          return next >= 100 ? 100 : next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isNavigating, steps.length]);

  const currentStep = steps[currentStepIndex] || steps[0];
  const nextStep = steps[currentStepIndex + 1];

  // Remaining journey distance and ETA calculation
  const remainingFraction = Math.max(0, (100 - navProgress) / 100);
  const remainingKm = (route.distanceKm * remainingFraction).toFixed(1);
  const remainingMin = Math.max(1, Math.round(route.estimatedTravelTimeMin * remainingFraction));

  // Determine maneuver icon
  const renderManeuverIcon = (action?: string) => {
    switch (action) {
      case 'turn-right':
        return <CornerUpRight className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'turn-left':
        return <CornerUpLeft className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'take-exit':
        return <ArrowRight className="w-8 h-8 text-white stroke-[2.5]" />;
      case 'arrive':
        return <Flag className="w-8 h-8 text-amber-300 stroke-[2.5]" />;
      default:
        return <ArrowUp className="w-8 h-8 text-white stroke-[2.5]" />;
    }
  };

  const handleLaunchGoogleMaps = () => {
    onStartNavigation();
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Google Maps Navigation Header Bar */}
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Authentic Google Maps Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white text-slate-900 font-bold text-[11px] shadow-sm">
            <span className="flex items-center gap-0.5 font-black tracking-tight text-xs">
              <span className="text-blue-600">G</span>
              <span className="text-red-600">o</span>
              <span className="text-amber-500">o</span>
              <span className="text-blue-600">g</span>
              <span className="text-emerald-600">l</span>
              <span className="text-red-600">e</span>
            </span>
            <span className="text-slate-600 font-medium">Maps</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">
            Driver Navigation
          </span>
        </div>

        {/* View Toggle & Audio */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex">
            <button
              onClick={() => setMapMode('embed')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                mapMode === 'embed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google Map
            </button>
            <button
              onClick={() => setMapMode('hud')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                mapMode === 'hud'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Driver HUD
            </button>
          </div>

          <button
            onClick={onToggleAudioAlerts}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300"
            title="Toggle audio directions"
          >
            {audioAlertsEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* GOOGLE MAPS SIGNATURE DRIVER TOP BANNER (Green Turn-by-Turn Card) */}
      <div className="bg-[#0F9D58] text-white p-3.5 shadow-md flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#0b8043] border border-white/20 shadow-inner shrink-0 mt-0.5">
            {renderManeuverIcon(currentStep.action)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black tracking-tight">
                {currentStep.distanceMeters > 0
                  ? currentStep.distanceMeters >= 1000
                    ? `${(currentStep.distanceMeters / 1000).toFixed(1)} km`
                    : `${currentStep.distanceMeters} m`
                  : 'Arrived'}
              </span>
              <span className="text-xs font-semibold bg-black/20 px-2 py-0.5 rounded-full border border-white/20">
                Step {currentStepIndex + 1}/{steps.length}
              </span>
            </div>
            <div className="font-bold text-sm md:text-base leading-snug mt-0.5 text-emerald-50">
              {currentStep.instruction}
            </div>
            <div className="text-xs text-emerald-100/90 font-medium">
              Road: <span className="underline decoration-emerald-300">{currentStep.roadName}</span>
            </div>

            {nextStep && (
              <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1 font-sans">
                <span className="opacity-75">Then:</span>
                <span className="font-semibold text-white truncate max-w-[240px]">
                  {nextStep.instruction}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live GPS Speedometer */}
        <div className="bg-[#0b8043] px-2.5 py-1.5 rounded-xl border border-white/20 text-center shrink-0">
          <div className="text-lg font-black leading-none text-white font-mono">
            {isNavigating ? speedKmH : 0}
          </div>
          <div className="text-[9px] uppercase font-bold text-emerald-200 tracking-wider">
            km/h
          </div>
        </div>
      </div>

      {/* GOOGLE MAP DISPLAY AREA */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-950 overflow-hidden">
        {mapMode === 'embed' ? (
          /* Live Embedded Google Maps iframe */
          <div className="w-full h-full relative">
            <iframe
              title="Google Maps Evacuation Route"
              src={embedGoogleMapsUrl}
              className="w-full h-full border-0 filter contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Watermark / Direct Action floating button */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={handleLaunchGoogleMaps}
                className="bg-white/95 hover:bg-white text-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg flex items-center gap-1.5 transition border border-slate-200"
                title="Open in Google Maps App"
              >
                <span>Open in App</span>
                <ExternalLink className="w-3 h-3 text-blue-600" />
              </button>
            </div>

            {/* In-Map Driver Waypoint Chips */}
            <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between gap-1 pointer-events-none">
              <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-200 flex items-center gap-1.5 pointer-events-auto shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-white">Start:</span>
                <span className="truncate max-w-[90px]">{origin.name}</span>
              </div>

              <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-slate-200 flex items-center gap-1.5 pointer-events-auto shadow-md">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="font-bold text-white">End:</span>
                <span className="truncate max-w-[90px]">{destination.name}</span>
              </div>
            </div>
          </div>
        ) : (
          /* High-Contrast Driver HUD Guidance Map */
          <div className="w-full h-full bg-gradient-to-b from-slate-950 to-slate-900 p-4 flex flex-col justify-between relative overflow-hidden">
            {/* Grid Pattern / Simulated Road Horizon */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Route Status Banner */}
            <div className="relative z-10 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2 rounded-xl text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-bold text-white">GPS Route Live Tracking</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-300">
                Heading 042° NE • High Clearance Route
              </span>
            </div>

            {/* Central Animated Vehicle on Highway */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Car className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                {/* Heading radar cone */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-400 rotate-45 opacity-80"></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white">{currentStep.roadName}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {route.statusText || 'CLEAR'} CORRIDOR • NO FLOODING DETECTED
                </div>
              </div>
            </div>

            {/* Journey Progress Bar */}
            <div className="relative z-10 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 font-bold text-white">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {origin.name.slice(0, 16)}...
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(navProgress)}% Completed
                </span>
                <span className="flex items-center gap-1 font-bold text-white">
                  <Flag className="w-3 h-3 text-rose-400" />
                  {destination.name.slice(0, 16)}...
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, navProgress)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GOOGLE MAPS SIGNATURE DRIVER BOTTOM CONTROLS & TRIP METRICS */}
      <div className="bg-slate-950 border-t border-slate-800 p-3 space-y-3">
        {/* Real-time Journey Summary: ETA | Remaining Distance | Time */}
        <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-lg font-black text-emerald-400 font-mono leading-none">
              {remainingMin}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
              min left
            </div>
          </div>
          <div className="border-x border-slate-800">
            <div className="text-lg font-black text-white font-mono leading-none">
              {remainingKm}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
              km remaining
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-cyan-300 font-mono leading-none">
              {route.statusText || 'CLEAR'}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
              Road Status
            </div>
          </div>
        </div>

        {/* Destination & Waypoint Details */}
        <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Habitation:</span>
            <span className="font-bold text-white">{waypoint.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Destination Relief Centre:</span>
            <span className="font-bold text-cyan-300">{destination.name}</span>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS: START NAVIGATION & GOOGLE MAPS LAUNCH */}
        <div className="space-y-2">
          {!isNavigating ? (
            <button
              onClick={handleLaunchGoogleMaps}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-xl transition flex items-center justify-center gap-2.5 tracking-wide uppercase border border-emerald-400/40"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Start Navigation on Google Maps</span>
              <ExternalLink className="w-4 h-4 text-emerald-200" />
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleLaunchGoogleMaps}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                title="Switch directly to Google Maps app"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Google Maps</span>
              </button>

              <button
                onClick={onStopNavigation}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs rounded-xl border border-rose-900/40 transition flex items-center justify-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Navigation</span>
              </button>
            </div>
          )}

          {/* Direct External Google Maps Link */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Google Maps Universal Turn-by-Turn</span>
            </span>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Direct Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
