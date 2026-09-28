import React, { useState } from 'react';
import { CloudRain, Waves, Wind, Mountain, Activity, Cpu, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { HazardPrediction, HazardType } from '../types/disaster';
import { HazardPredictionEngine } from '../services/hazardEngine';
import { ApiClient } from '../services/apiClient';

interface HazardPredictionViewProps {
  onApplyPredictionToMap?: (pred: HazardPrediction) => void;
}

export const HazardPredictionView: React.FC<HazardPredictionViewProps> = ({ onApplyPredictionToMap }) => {
  const [selectedHazard, setSelectedHazard] = useState<HazardType>('Flood');

  // Sliders for Flood prediction
  const [rainfallMm3h, setRainfallMm3h] = useState<number>(185);
  const [riverGaugeMeters, setRiverGaugeMeters] = useState<number>(4.82);
  const [rateOfRise, setRateOfRise] = useState<number>(0.38);
  const [soilSaturation, setSoilSaturation] = useState<number>(96);
  const [embankmentIntegrity, setEmbankmentIntegrity] = useState<number>(62);

  // Sliders for Landslide
  const [slopeAngle, setSlopeAngle] = useState<number>(38);
  const [rainfall24h, setRainfall24h] = useState<number>(145);

  // Sliders for Cyclone
  const [centralPressure, setCentralPressure] = useState<number>(955);
  const [windSpeed, setWindSpeed] = useState<number>(155);

  const [prediction, setPrediction] = useState<HazardPrediction>(() => {
    return HazardPredictionEngine.predictFlood({
      rainfallMm3h: 185,
      riverGaugeMeters: 4.82,
      rateOfRiseMPerHour: 0.38,
      soilSaturationPercent: 96,
      embankmentIntegrityPercent: 62
    });
  });

  const [isCalculating, setIsCalculating] = useState(false);

  const handleComputePrediction = async () => {
    setIsCalculating(true);
    let pred: HazardPrediction;

    if (selectedHazard === 'Flood') {
      pred = await ApiClient.predictHazard('Flood', {
        rainfallMm3h,
        riverGaugeMeters,
        rateOfRiseMPerHour: rateOfRise,
        soilSaturationPercent: soilSaturation,
        embankmentIntegrityPercent: embankmentIntegrity
      });
    } else if (selectedHazard === 'Landslide') {
      pred = await ApiClient.predictHazard('Landslide', {
        slopeAngleDegrees: slopeAngle,
        rainfallPast24hMm: rainfall24h,
        soilShearStrengthKPa: 22,
        vegetationCoverPercent: 30
      });
    } else {
      pred = await ApiClient.predictHazard('Cyclone', {
        centralPressureHPa: centralPressure,
        sustainedWindSpeedKmh: windSpeed,
        seaSurfaceTempC: 30.5
      });
    }

    setPrediction(pred);
    setIsCalculating(false);
    onApplyPredictionToMap?.(pred);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Modular Hazard Prediction Engine</h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-indigo-950 text-indigo-300 border border-indigo-700 font-mono">
              ML ENSEMBLE ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Combines satellite surface water indices, IMD Doppler precipitation, river hydrograph telemetry, and terrain slope physics.
          </p>
        </div>

        {/* Hazard Model Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => { setSelectedHazard('Flood'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              selectedHazard === 'Flood' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Flood Model</span>
          </button>
          <button
            onClick={() => { setSelectedHazard('Landslide'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              selectedHazard === 'Landslide' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Landslide Model</span>
          </button>
          <button
            onClick={() => { setSelectedHazard('Cyclone'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              selectedHazard === 'Cyclone' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Cyclone Model</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Prediction Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Input Features (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200">
              Input Sensor &amp; Telemetry Variables ({selectedHazard})
            </h3>
            <span className="text-xs text-slate-400 font-mono">LIVE INGEST</span>
          </div>

          {selectedHazard === 'Flood' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Doppler 3-Hour Rainfall:</span>
                  <strong className="text-cyan-400 font-mono text-sm">{rainfallMm3h} mm</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={rainfallMm3h}
                  onChange={(e) => setRainfallMm3h(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">River Stage Gauge (GS-04):</span>
                  <strong className="text-rose-400 font-mono text-sm">{riverGaugeMeters} m (Danger: +4.00m)</strong>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="6.5"
                  step="0.05"
                  value={riverGaugeMeters}
                  onChange={(e) => setRiverGaugeMeters(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Rate of Water Rise:</span>
                  <strong className="text-amber-400 font-mono text-sm">+{rateOfRise} m/hour</strong>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.01"
                  value={rateOfRise}
                  onChange={(e) => setRateOfRise(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Soil Saturation Index:</span>
                  <strong className="text-slate-200 font-mono text-sm">{soilSaturation}%</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={soilSaturation}
                  onChange={(e) => setSoilSaturation(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Embankment Structural Integrity:</span>
                  <strong className="text-amber-300 font-mono text-sm">{embankmentIntegrity}%</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={embankmentIntegrity}
                  onChange={(e) => setEmbankmentIntegrity(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {selectedHazard === 'Landslide' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Slope Escarpment Angle:</span>
                  <strong className="text-rose-400 font-mono text-sm">{slopeAngle}°</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={slopeAngle}
                  onChange={(e) => setSlopeAngle(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">24-Hour Cumulative Rain:</span>
                  <strong className="text-cyan-400 font-mono text-sm">{rainfall24h} mm</strong>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={rainfall24h}
                  onChange={(e) => setRainfall24h(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {selectedHazard === 'Cyclone' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Central Atmospheric Pressure:</span>
                  <strong className="text-rose-400 font-mono text-sm">{centralPressure} hPa</strong>
                </div>
                <input
                  type="range"
                  min="920"
                  max="1010"
                  value={centralPressure}
                  onChange={(e) => setCentralPressure(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-300">Sustained Wind Speed:</span>
                  <strong className="text-amber-400 font-mono text-sm">{windSpeed} km/h</strong>
                </div>
                <input
                  type="range"
                  min="60"
                  max="240"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleComputePrediction}
              disabled={isCalculating}
              className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>{isCalculating ? 'Computing Hydrological Mesh...' : 'Re-Execute Hazard Model'}</span>
            </button>
          </div>
        </div>

        {/* Right: Output Prediction Metrics Card (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono">
                  AI-Assisted Prediction Result
                </span>
                <h3 className="font-bold text-base text-white mt-0.5">{prediction.hazardType} Probability Index</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md font-mono bg-slate-800 text-slate-300">
                Confidence: {prediction.confidence}%
              </span>
            </div>

            {/* Big Indicator Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Probability</div>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-0.5">{prediction.probability}%</div>
                <div className="text-[10px] text-rose-300 font-mono">Very High</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Severity</div>
                <div className="text-base font-bold text-amber-300 mt-1">{prediction.severity}</div>
                <div className="text-[10px] text-slate-400 font-mono">Stage IV</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Affected Area</div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">{prediction.affectedAreaKm2} km²</div>
                <div className="text-[10px] text-slate-400 font-mono">Inundation</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Exposed Pop</div>
                <div className="text-xl font-bold font-mono text-indigo-300 mt-0.5">{prediction.expectedPopulation.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 font-mono">In Impact Zone</div>
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="mb-4">
              <div className="font-semibold text-xs text-slate-300 mb-2">Contributing Predictive Factors:</div>
              <div className="space-y-2">
                {prediction.contributingFactors.map((cf, i) => (
                  <div key={i} className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-slate-200">{cf.factor}</span>
                      <span className="text-[11px] text-amber-400 font-mono font-semibold">Weight: {cf.weight}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{cf.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Explanation Callout */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-200">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Decision Support Synthesis</span>
              </div>
              <p className="text-xs leading-relaxed">{prediction.explanation}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Model: <strong className="text-slate-300 font-mono">{prediction.modelUsed}</strong></span>
            <span className="text-amber-400 font-medium">⚠️ Human validation required before issuing evacuations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
