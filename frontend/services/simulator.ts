import {
  OverviewTelemetry,
  ForecastResponse,
  AllocationResponse,
  BatteryDiagnosticsResponse,
  LoadAllocationItem,
  InverterTelemetry,
  BatteryHistoricalPoint,
} from '../types/microgrid';

// Diurnal model constants
const P_PEAK = 50.3; // kW
const INVERTER_EFFICIENCY = 0.98;
const TEMP_COEFF = 0.0035;
const TOTAL_STORAGE_KWH = 102.4;
const RESERVE_FLOOR_KWH = 10.24; // 10% cutoff
const MAX_BATTERY_RATE_KW = 20.0;

// Deterministic noise function so values are stable for a given time
function getPseudoNoise(t: number): number {
  const sinVal = Math.sin(t * 12.345);
  return 0.95 + 0.05 * Math.abs(sinVal);
}

// Calculate ambient temperature for hour t (0-24)
export function getAmbientTemp(t: number): number {
  if (t >= 6 && t <= 20) {
    return Math.round((22 + 10 * Math.sin((Math.PI * (t - 6)) / 14)) * 10) / 10;
  }
  return 21.5;
}

// Ideal solar power at hour t (0-24)
export function getIdealSolarKw(t: number): number {
  if (t < 6.0 || t > 18.0) return 0.0;
  return P_PEAK * Math.sin((Math.PI * (t - 6.0)) / 12.0);
}

// Actual solar power at hour t (0-24)
export function getActualSolarKw(t: number): number {
  const ideal = getIdealSolarKw(t);
  if (ideal <= 0) return 0.0;

  const temp = getAmbientTemp(t);
  const tempDerating = 1.0 - TEMP_COEFF * (temp - 25.0);
  const noise = getPseudoNoise(t);

  const actual = ideal * INVERTER_EFFICIENCY * tempDerating * noise;
  return Math.max(0, Math.round(actual * 10) / 10);
}

// Irradiance in W/m² derived from solar curve
export function getIrradiance(t: number): number {
  const ideal = getIdealSolarKw(t);
  if (ideal <= 0) return 0;
  const ratio = ideal / P_PEAK;
  return Math.round(ratio * 920 * getPseudoNoise(t));
}

// Standard baseline schedule
export const STANDARD_ALLOCATIONS: LoadAllocationItem[] = [
  {
    id: 'alloc-01',
    activityName: 'Water Pumping',
    priorityRank: 1,
    powerDemandKw: 9.0,
    plannedStartTime: '08:00',
    plannedEndTime: '10:00',
    isActiveNow: false,
    isAdjusted: false,
  },
  {
    id: 'alloc-02',
    activityName: 'Workshop Operations',
    priorityRank: 2,
    powerDemandKw: 10.0,
    plannedStartTime: '10:00',
    plannedEndTime: '13:00',
    isActiveNow: false,
    isAdjusted: false,
  },
  {
    id: 'alloc-03',
    activityName: 'Bakery Operations',
    priorityRank: 3,
    powerDemandKw: 9.0,
    plannedStartTime: '12:00',
    plannedEndTime: '15:00',
    isActiveNow: false,
    isAdjusted: false,
  },
  {
    id: 'alloc-04',
    activityName: 'Hammer Mill Operations',
    priorityRank: 4,
    powerDemandKw: 10.0,
    plannedStartTime: '15:00',
    plannedEndTime: '17:00',
    isActiveNow: false,
    isAdjusted: false,
  },
  {
    id: 'alloc-05',
    activityName: 'Teaching, Admin & Residential',
    priorityRank: 'CONTINUOUS',
    powerDemandKw: 14.0,
    plannedStartTime: '08:00',
    plannedEndTime: '22:00',
    isActiveNow: false,
    isAdjusted: false,
  },
];

// Dynamically adjusted schedule (shifted hammer mill to 12:00-14:00, bakery to 14:00-17:00)
export const ADJUSTED_ALLOCATIONS: LoadAllocationItem[] = [
  {
    id: 'alloc-01',
    activityName: 'Water Pumping',
    priorityRank: 1,
    powerDemandKw: 9.0,
    plannedStartTime: '08:00',
    plannedEndTime: '10:00',
    actualStartTime: '08:00',
    actualEndTime: '10:00',
    isActiveNow: false,
    isAdjusted: false,
  },
  {
    id: 'alloc-02',
    activityName: 'Workshop Operations',
    priorityRank: 2,
    powerDemandKw: 10.0,
    plannedStartTime: '10:00',
    plannedEndTime: '13:00',
    actualStartTime: '10:00',
    actualEndTime: '13:00',
    isActiveNow: false,
    isAdjusted: false,
  },
  {
    id: 'alloc-04',
    activityName: 'Hammer Mill Operations',
    priorityRank: 4,
    powerDemandKw: 10.0,
    plannedStartTime: '15:00',
    plannedEndTime: '17:00',
    actualStartTime: '12:00',
    actualEndTime: '14:00',
    isActiveNow: false,
    isAdjusted: true,
    adjustmentNote: 'Shifted 3 hrs earlier to capture peak solar generation.',
  },
  {
    id: 'alloc-03',
    activityName: 'Bakery Operations',
    priorityRank: 3,
    powerDemandKw: 9.0,
    plannedStartTime: '12:00',
    plannedEndTime: '15:00',
    actualStartTime: '14:00',
    actualEndTime: '17:00',
    isActiveNow: false,
    isAdjusted: true,
    adjustmentNote: 'Moved to 14:00 to balance workshop and mill peak demands.',
  },
  {
    id: 'alloc-05',
    activityName: 'Teaching, Admin & Residential',
    priorityRank: 'CONTINUOUS',
    powerDemandKw: 14.0,
    plannedStartTime: '08:00',
    plannedEndTime: '22:00',
    actualStartTime: '08:00',
    actualEndTime: '22:00',
    isActiveNow: false,
    isAdjusted: false,
  },
];

// Helper to check if hour t falls inside a window
function isTimeInWindow(t: number, startStr: string, endStr: string): boolean {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const start = sh + sm / 60;
  const end = eh + em / 60;
  return t >= start && t < end;
}

// Compute active allocations for a given simulated time and view
export function getAllocationsForTime(
  hour: number,
  viewType: 'planned' | 'adjusted' = 'adjusted'
): { items: LoadAllocationItem[]; totalLoadKw: number; activeLoads: { name: string; powerKw: number }[] } {
  const source = viewType === 'planned' ? STANDARD_ALLOCATIONS : ADJUSTED_ALLOCATIONS;

  let totalLoadKw = 0;
  const activeLoads: { name: string; powerKw: number }[] = [];

  const items = source.map((item) => {
    const startStr = item.actualStartTime || item.plannedStartTime;
    const endStr = item.actualEndTime || item.plannedEndTime;
    const isActive = isTimeInWindow(hour, startStr, endStr);

    if (isActive) {
      totalLoadKw += item.powerDemandKw;
      activeLoads.push({ name: item.activityName, powerKw: item.powerDemandKw });
    }

    return {
      ...item,
      isActiveNow: isActive,
    };
  });

  return { items, totalLoadKw, activeLoads };
}

// Model battery SoC at a specific hour
export function getBatterySocAtHour(hour: number): number {
  // Typical daily SoC curve for this microgrid:
  // 00:00 - 06:00: Discharging from ~55% down to ~35%
  // 06:00 - 09:00: Solar starts, SoC holds around 32-38%
  // 09:00 - 14:30: High solar surplus charges batteries from 40% to 92%
  // 14:30 - 17:30: Float charge ~90-95%
  // 17:30 - 24:00: Sun sets, continuous 14kW discharge pulls SoC down to ~55%
  if (hour < 6) {
    return Math.round((55 - (hour / 6) * 22) * 10) / 10; // 55% -> 33%
  } else if (hour < 9) {
    return Math.round((33 + ((hour - 6) / 3) * 10) * 10) / 10; // 33% -> 43%
  } else if (hour < 14.5) {
    return Math.round((43 + ((hour - 9) / 5.5) * 49) * 10) / 10; // 43% -> 92%
  } else if (hour < 17.5) {
    return Math.round((92 + ((hour - 14.5) / 3) * 3) * 10) / 10; // 92% -> 95%
  } else {
    return Math.round((95 - ((hour - 17.5) / 6.5) * 40) * 10) / 10; // 95% -> 55%
  }
}

// Generate the past 24 hours of battery history leading up to the current simulated hour
export function getPast24HoursBattery(currentHour: number): BatteryHistoricalPoint[] {
  const points: BatteryHistoricalPoint[] = [];
  for (let offset = -24; offset <= 0; offset += 1) {
    let h = (currentHour + offset) % 24;
    if (h < 0) h += 24;
    const soc = getBatterySocAtHour(h);
    const labelHour = Math.floor(h);
    const label = `${String(labelHour).padStart(2, '0')}:00`;
    points.push({
      timeLabel: label,
      hourOffset: offset,
      socPercent: soc,
    });
  }
  return points;
}

// Generate complete system overview telemetry for hour t
export function getOverviewTelemetry(t: number): OverviewTelemetry {
  const genKw = getActualSolarKw(t);
  const { totalLoadKw, activeLoads } = getAllocationsForTime(t, 'adjusted');
  const netKw = Math.round((genKw - totalLoadKw) * 10) / 10;

  const soc = getBatterySocAtHour(t);
  const storedKwh = Math.round(((TOTAL_STORAGE_KWH * soc) / 100) * 10) / 10;
  const usableKwh = Math.max(0, Math.round((storedKwh - RESERVE_FLOOR_KWH) * 10) / 10);

  let flowState: 'CHARGING' | 'DISCHARGING' | 'IDLE' = 'IDLE';
  if (netKw > 1.0) flowState = 'CHARGING';
  else if (netKw < -1.0) flowState = 'DISCHARGING';

  let plainTextProjection = '';
  if (flowState === 'CHARGING') {
    const chargeNeededKwh = TOTAL_STORAGE_KWH * 0.95 - storedKwh;
    if (chargeNeededKwh <= 0) {
      plainTextProjection = 'Batteries are fully charged. Surplus energy safely curtails.';
    } else {
      const chargeRate = Math.min(netKw, MAX_BATTERY_RATE_KW);
      const hoursRemaining = chargeRate > 0 ? chargeNeededKwh / chargeRate : 2;
      const finishHour = (t + hoursRemaining) % 24;
      const fh = Math.floor(finishHour);
      const fm = Math.round((finishHour - fh) * 60);
      plainTextProjection = `Batteries will reach full charge by ${String(fh).padStart(2, '0')}:${String(fm).padStart(2, '0')} at current solar generation.`;
    }
  } else {
    // Night/discharging projection
    const nightLoad = Math.max(10, totalLoadKw);
    const hoursLeft = nightLoad > 0 ? usableKwh / nightLoad : 8;
    const cutoffHour = (t + hoursLeft) % 24;
    const ch = Math.floor(cutoffHour);
    const cm = Math.round((cutoffHour - ch) * 60);
    plainTextProjection = `Batteries will comfortably support nighttime residential and teaching loads until ${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')} AM.`;
  }

  const irradiance = getIrradiance(t);
  let conditionLabel = 'Low Sun / Overcast';
  if (irradiance > 600) conditionLabel = 'Strong Sunlight';
  else if (irradiance >= 200) conditionLabel = 'Moderate Sun';

  const ambientTemp = getAmbientTemp(t);
  const humidity = Math.round(75 - (irradiance / 920) * 35);

  return {
    systemStatus: 'OPTIMAL',
    totalGenerationKw: genKw,
    totalLoadDemandKw: totalLoadKw,
    netPowerKw: netKw,
    activeLoads,
    batterySummary: {
      aggregateSocPercent: soc,
      storedKwh,
      usableKwh,
      flowState,
      plainTextProjection,
    },
    weatherSummary: {
      irradiance,
      ambientTemp,
      conditionLabel,
      humidity,
      windSpeed: 3.4,
      windDirection: 'North-East',
    },
    timestamp: new Date().toISOString(),
  };
}

// 24-hour solar generation forecast
export function getForecastData(): ForecastResponse {
  const hourlyTimeSeries = [];
  let peakKw = 0;
  let totalYieldKwh = 0;

  for (let h = 0; h <= 23; h++) {
    const kw = getActualSolarKw(h);
    if (kw > peakKw) peakKw = kw;
    totalYieldKwh += kw;
    hourlyTimeSeries.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      generationKw: kw,
    });
  }

  return {
    date: new Date().toISOString().split('T')[0],
    projectedTotalYieldKwh: Math.round(totalYieldKwh * 10) / 10,
    peakKw: Math.round(peakKw * 10) / 10,
    hourlyTimeSeries,
    operationalAdvice: 'Optimal machinery window between 10:30 and 14:30 for high-energy operations.',
  };
}

// Allocation schedule response
export function getAllocationResponse(
  hour: number,
  view: 'planned' | 'adjusted' = 'adjusted'
): AllocationResponse {
  const { items } = getAllocationsForTime(hour, view);
  return {
    viewType: view,
    totalScheduledKwh: 235.0,
    algorithmNotes:
      view === 'adjusted'
        ? 'Hammer mill rescheduled earlier to 12:00 to maximize direct daytime solar yield.'
        : 'Baseline microgrid standard allocation plan without environmental weather shifting.',
    items,
  };
}

// Battery diagnostics telemetry
export function getBatteryDiagnostics(hour: number): BatteryDiagnosticsResponse {
  const soc = getBatterySocAtHour(hour);
  const usableKwh = Math.max(0, ((TOTAL_STORAGE_KWH * soc) / 100) - RESERVE_FLOOR_KWH);
  const hoursLeft = usableKwh / 14;
  const cutoffH = (hour + hoursLeft) % 24;
  const ch = Math.floor(cutoffH);
  const cm = Math.round((cutoffH - ch) * 60);

  return {
    batteryInverter: {
      model: 'Sunsynk SUN-20K-SG05LP3-EU-SM2',
      operatingMode: 'GRID_FORMING_ISLAND',
      acOutputKw: 20.0,
      inverterTempCelsius: 33.8,
      status: 'OPTIMAL',
    },
    towers: [
      {
        towerId: 1,
        moduleCount: 10,
        totalCapacityKwh: 51.2,
        currentSocPercent: Math.min(100, Math.round(soc * 10) / 10),
        voltageV: 51.4,
        currentA: 42.1,
        temperatureCelsius: 28.2,
        isBalanced: true,
        bmsStatus: 'OPTIMAL',
      },
      {
        towerId: 2,
        moduleCount: 10,
        totalCapacityKwh: 51.2,
        currentSocPercent: Math.min(100, Math.round((soc - 0.2) * 10) / 10),
        voltageV: 51.3,
        currentA: 41.8,
        temperatureCelsius: 28.5,
        isBalanced: true,
        bmsStatus: 'OPTIMAL',
      },
    ],
    history24h: getPast24HoursBattery(hour),
    runtimeProjection: {
      projectedCutoffTimestamp: `07:15 AM`,
      descriptiveMessage: `Batteries will comfortably support nighttime residential and teaching loads until ${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')} AM.`,
    },
  };
}

// Inverter diagnostics for maintenance screen
export function getInverterDiagnostics(t: number): InverterTelemetry[] {
  const expectedPerInverter = Math.round((getIdealSolarKw(t) * 0.5) * 10) / 10;
  const totalActual = getActualSolarKw(t);
  
  // Inverter 1 is performing optimally (e.g. ~52% of actual, variance ~4%)
  const actual1 = Math.round(totalActual * 0.52 * 10) / 10;
  const variance1 = expectedPerInverter > 0 ? Math.round(((expectedPerInverter - actual1) / expectedPerInverter) * 100) : 0;

  // Inverter 2 has a slight dust/heat variance (e.g. ~48% of actual, variance ~18% yellow leeway)
  const actual2 = Math.round(totalActual * 0.44 * 10) / 10;
  const variance2 = expectedPerInverter > 0 ? Math.round(((expectedPerInverter - actual2) / expectedPerInverter) * 100) : 0;

  return [
    {
      id: 'solis_inverter_1',
      name: 'Inverter 1 (Solis 17kW)',
      status: variance1 <= 15 ? 'OPTIMAL' : 'WARNING',
      acPowerKw: actual1,
      expectedPowerKw: expectedPerInverter,
      variancePercent: Math.max(0, variance1),
      acVoltageV: 400.2,
      frequencyHz: 50.02,
      dcInputKw: Math.round(actual1 * 1.02 * 10) / 10,
      temperatureCelsius: 34.5,
      faultCode: null,
    },
    {
      id: 'solis_inverter_2',
      name: 'Inverter 2 (Solis 17kW)',
      status: variance2 <= 15 ? 'OPTIMAL' : variance2 <= 30 ? 'WARNING' : 'FAULT',
      acPowerKw: actual2,
      expectedPowerKw: expectedPerInverter,
      variancePercent: Math.max(0, variance2),
      acVoltageV: 398.8,
      frequencyHz: 49.98,
      dcInputKw: Math.round(actual2 * 1.02 * 10) / 10,
      temperatureCelsius: 38.1,
      faultCode: null,
    },
  ];
}
