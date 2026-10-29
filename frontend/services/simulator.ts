import {
  OverviewTelemetry,
  ForecastResponse,
  AllocationResponse,
  BatteryDiagnosticsResponse,
  LoadAllocationItem,
  InverterTelemetry,
  BatteryHistoricalPoint,
  HourlyWeatherForecast,
  DailyWeatherForecast,
  ComprehensiveWeatherOverview,
} from '../types/microgrid';

// Hardware Specifications from design_spec.txt
const P_PEAK = 50.3; // kW (86 x 585W monocrystalline panels)
const TOTAL_STORAGE_KWH = 102.4; // Dyness ESS (2 x 51.2 kWh towers)
const RESERVE_FLOOR_KWH = 10.24; // 10% DoD protective reserve
const MAX_BATTERY_RATE_KW = 20.0; // Sunsynk 20kW continuous rating
const TEMP_COEFF_PV = 0.0035; // 0.35%/°C PV temperature derating above 25°C

/**
 * Stochastic multi-frequency noise generator for organic fluctuations
 */
export function getLiveStochasticNoise(t: number): {
  irradianceJitter: number;
  windSpeed: number;
  windDirectionDegrees: number;
  loadJitter: number;
  inverterJitter1: number;
  inverterJitter2: number;
} {
  const timeSec = Date.now() / 1000;
  
  const cloudWave = 0.03 * Math.sin(timeSec / 15 + t * 4) + 0.015 * Math.cos(timeSec / 7 + t * 8);
  const irradianceJitter = Math.max(0.88, Math.min(1.04, 1.0 + cloudWave));

  const windWave = 0.8 * Math.sin(timeSec / 12 + t * 3) + 0.4 * Math.cos(timeSec / 5);
  const windSpeed = Math.round(Math.max(1.2, 3.2 + windWave) * 10) / 10;
  const windDirectionDegrees = Math.round(45 + 8 * Math.sin(timeSec / 20));

  const loadJitter = 1.0 + 0.03 * Math.sin(timeSec / 9 + t * 5);
  const inverterJitter1 = 1.0 + 0.012 * Math.sin(timeSec / 4 + 1.1);
  const inverterJitter2 = 1.0 + 0.015 * Math.sin(timeSec / 4 + 2.7);

  return {
    irradianceJitter,
    windSpeed,
    windDirectionDegrees,
    loadJitter,
    inverterJitter1,
    inverterJitter2,
  };
}

/**
 * Formats a decimal hour (0.0 to 24.0) into proper 12-hour AM/PM clock time (e.g. 7.25 -> "07:15 AM", 14.85 -> "02:51 PM")
 */
export function formatClockTime(decimalHour: number): string {
  const norm = ((decimalHour % 24) + 24) % 24;
  let h24 = Math.floor(norm);
  let m = Math.round((norm - h24) * 60);
  if (m >= 60) {
    h24 = (h24 + 1) % 24;
    m = 0;
  }
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function getAmbientTemp(t: number): number {
  if (t >= 6 && t <= 20) {
    return Math.round((22 + 10 * Math.sin((Math.PI * (t - 6)) / 14)) * 10) / 10;
  }
  return 21.5;
}

export function getIdealSolarKw(t: number): number {
  if (t < 6.0 || t > 18.0) return 0.0;
  return P_PEAK * Math.sin((Math.PI * (t - 6.0)) / 12.0);
}

export function getIrradiance(t: number, noiseFactor = 1.0): number {
  const ideal = getIdealSolarKw(t);
  if (ideal <= 0) return 0;
  const ratio = ideal / P_PEAK;
  return Math.round(ratio * 920 * noiseFactor);
}

export function getPvCellTemp(ambientTemp: number, irradiance: number, windSpeed: number): number {
  if (irradiance <= 0) return ambientTemp;
  const windCooling = 1.0 - 0.03 * Math.min(4, Math.max(0, windSpeed - 1.0));
  const cellTemp = ambientTemp + ((45 - 20) / 800) * irradiance * windCooling;
  return Math.round(cellTemp * 10) / 10;
}

export function getInverterEfficiency(dcKw: number, ratedKw = 17.0, tempCelsius = 35.0): number {
  if (dcKw <= 0.1) return 0.88;
  const loadRatio = Math.min(1.2, dcKw / ratedKw);
  let eff = 0.984 - 0.07 * Math.pow(1.0 - Math.min(1.0, loadRatio), 2.5);
  if (tempCelsius > 45.0) {
    const thermalPenalty = (tempCelsius - 45.0) * 0.003;
    eff -= thermalPenalty;
  }
  return Math.max(0.85, Math.min(0.986, eff));
}

export function calculateEquipmentGeneration(t: number): {
  irradiance: number;
  ambientTemp: number;
  cellTemp: number;
  windSpeed: number;
  windDirectionDegrees: number;
  inverter1: {
    dcInputKw: number;
    acPowerKw: number;
    efficiency: number;
    heatsinkTemp: number;
    expectedPowerKw: number;
    variancePercent: number;
  };
  inverter2: {
    dcInputKw: number;
    acPowerKw: number;
    efficiency: number;
    heatsinkTemp: number;
    expectedPowerKw: number;
    variancePercent: number;
  };
  totalActualAcKw: number;
  totalDcGrossKw: number;
} {
  const noise = getLiveStochasticNoise(t);
  const ambientTemp = getAmbientTemp(t);
  const idealSolar = getIdealSolarKw(t);
  const irradiance = getIrradiance(t, noise.irradianceJitter);
  const cellTemp = getPvCellTemp(ambientTemp, irradiance, noise.windSpeed);

  if (idealSolar <= 0 || irradiance <= 0) {
    return {
      irradiance: 0,
      ambientTemp,
      cellTemp: ambientTemp,
      windSpeed: noise.windSpeed,
      windDirectionDegrees: noise.windDirectionDegrees,
      inverter1: {
        dcInputKw: 0,
        acPowerKw: 0,
        efficiency: 0.98,
        heatsinkTemp: ambientTemp + 2,
        expectedPowerKw: 0,
        variancePercent: 0,
      },
      inverter2: {
        dcInputKw: 0,
        acPowerKw: 0,
        efficiency: 0.97,
        heatsinkTemp: ambientTemp + 3,
        expectedPowerKw: 0,
        variancePercent: 0,
      },
      totalActualAcKw: 0,
      totalDcGrossKw: 0,
    };
  }

  const pvTempDerate = Math.max(0.75, 1.0 - TEMP_COEFF_PV * (cellTemp - 25.0));
  const totalDcGrossKw = idealSolar * pvTempDerate * noise.irradianceJitter;
  const expectedPerInverter = Math.round((idealSolar * 0.5) * 10) / 10;

  const dcIn1 = (totalDcGrossKw * 0.515 * 0.985) * noise.inverterJitter1;
  const temp1Base = ambientTemp + (dcIn1 / 17.0) * 11.0;
  const eff1 = getInverterEfficiency(dcIn1, 17.0, temp1Base);
  const acPower1 = Math.round(dcIn1 * eff1 * 10) / 10;
  const loss1 = Math.max(0, dcIn1 - acPower1);
  const heatsinkTemp1 = Math.round((temp1Base + loss1 * 6.5) * 10) / 10;
  const variance1 =
    expectedPerInverter > 0
      ? Math.max(0, Math.round(((expectedPerInverter - acPower1) / expectedPerInverter) * 100))
      : 0;

  const dcIn2 = (totalDcGrossKw * 0.485 * 0.845) * noise.inverterJitter2;
  const temp2Base = ambientTemp + (dcIn2 / 17.0) * 15.0 + 3.0;
  const eff2 = getInverterEfficiency(dcIn2, 17.0, temp2Base);
  const acPower2 = Math.round(dcIn2 * eff2 * 10) / 10;
  const loss2 = Math.max(0, dcIn2 - acPower2);
  const heatsinkTemp2 = Math.round((temp2Base + loss2 * 8.5) * 10) / 10;
  const variance2 =
    expectedPerInverter > 0
      ? Math.max(0, Math.round(((expectedPerInverter - acPower2) / expectedPerInverter) * 100))
      : 0;

  const totalActualAcKw = Math.round((acPower1 + acPower2) * 10) / 10;

  return {
    irradiance,
    ambientTemp,
    cellTemp,
    windSpeed: noise.windSpeed,
    windDirectionDegrees: noise.windDirectionDegrees,
    inverter1: {
      dcInputKw: Math.round(dcIn1 * 10) / 10,
      acPowerKw: acPower1,
      efficiency: Math.round(eff1 * 1000) / 10,
      heatsinkTemp: heatsinkTemp1,
      expectedPowerKw: expectedPerInverter,
      variancePercent: variance1,
    },
    inverter2: {
      dcInputKw: Math.round(dcIn2 * 10) / 10,
      acPowerKw: acPower2,
      efficiency: Math.round(eff2 * 1000) / 10,
      heatsinkTemp: heatsinkTemp2,
      expectedPowerKw: expectedPerInverter,
      variancePercent: variance2,
    },
    totalActualAcKw,
    totalDcGrossKw: Math.round(totalDcGrossKw * 10) / 10,
  };
}

export function getActualSolarKw(t: number): number {
  return calculateEquipmentGeneration(t).totalActualAcKw;
}

// Baseline Standard Schedule
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

// Dynamically Adjusted Schedule
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

function isTimeInWindow(t: number, startStr: string, endStr: string): boolean {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const start = sh + (sm || 0) / 60;
  const end = eh + (em || 0) / 60;
  return t >= start && t < end;
}

export function getAllocationsForTime(
  hour: number,
  viewType: 'planned' | 'adjusted' = 'adjusted'
): { items: LoadAllocationItem[]; totalLoadKw: number; activeLoads: { name: string; powerKw: number }[] } {
  const source = viewType === 'planned' ? STANDARD_ALLOCATIONS : ADJUSTED_ALLOCATIONS;
  const noise = getLiveStochasticNoise(hour);

  let totalLoadKw = 0;
  const activeLoads: { name: string; powerKw: number }[] = [];

  const items = source.map((item) => {
    const startStr = item.actualStartTime || item.plannedStartTime;
    const endStr = item.actualEndTime || item.plannedEndTime;
    const isActive = isTimeInWindow(hour, startStr, endStr);

    const liveLoadKw = isActive
      ? Math.round(item.powerDemandKw * noise.loadJitter * 10) / 10
      : item.powerDemandKw;

    if (isActive) {
      totalLoadKw += liveLoadKw;
      activeLoads.push({ name: item.activityName, powerKw: liveLoadKw });
    }

    return {
      ...item,
      powerDemandKw: liveLoadKw,
      isActiveNow: isActive,
    };
  });

  return { items, totalLoadKw: Math.round(totalLoadKw * 10) / 10, activeLoads };
}

export function getBatterySocAtHour(hour: number): number {
  if (hour < 6) {
    return Math.round((55 - (hour / 6) * 22) * 10) / 10;
  } else if (hour < 9) {
    return Math.round((33 + ((hour - 6) / 3) * 10) * 10) / 10;
  } else if (hour < 14.5) {
    return Math.round((43 + ((hour - 9) / 5.5) * 49) * 10) / 10;
  } else if (hour < 17.5) {
    return Math.round((92 + ((hour - 14.5) / 3) * 3) * 10) / 10;
  } else {
    return Math.round((95 - ((hour - 17.5) / 6.5) * 40) * 10) / 10;
  }
}

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

export function getOverviewTelemetry(t: number): OverviewTelemetry {
  const eq = calculateEquipmentGeneration(t);
  const { totalLoadKw, activeLoads } = getAllocationsForTime(t, 'adjusted');
  const genKw = eq.totalActualAcKw;
  const netKw = Math.round((genKw - totalLoadKw) * 10) / 10;

  const soc = getBatterySocAtHour(t);
  const storedKwh = Math.round(((TOTAL_STORAGE_KWH * soc) / 100) * 10) / 10;
  const usableKwh = Math.max(0, Math.round((storedKwh - RESERVE_FLOOR_KWH) * 10) / 10);

  let flowState: 'CHARGING' | 'DISCHARGING' | 'IDLE' = 'IDLE';
  if (netKw > 0.8) flowState = 'CHARGING';
  else if (netKw < -0.8) flowState = 'DISCHARGING';

  let plainTextProjection = '';
  if (flowState === 'CHARGING') {
    const chargeNeededKwh = TOTAL_STORAGE_KWH * 0.95 - storedKwh;
    if (chargeNeededKwh <= 0) {
      plainTextProjection = 'Batteries are fully charged. Surplus energy safely curtails.';
    } else {
      const sunsynkEfficiency = 0.965;
      const effectiveChargeRate = Math.min(netKw * sunsynkEfficiency, MAX_BATTERY_RATE_KW);
      const hoursRemaining = effectiveChargeRate > 0 ? chargeNeededKwh / effectiveChargeRate : 2;
      const finishHour = (t + hoursRemaining) % 24;
      plainTextProjection = `Batteries will reach full charge by ${formatClockTime(finishHour)} at current solar output.`;
    }
  } else {
    const activeLoad = Math.max(10, totalLoadKw);
    const hoursLeft = activeLoad > 0 ? usableKwh / activeLoad : 8;
    const cutoffHour = (t + hoursLeft) % 24;
    const timeStr = formatClockTime(cutoffHour);
    const isNight = t >= 18 || t < 6;
    plainTextProjection = isNight
      ? `Batteries will comfortably support nighttime residential and teaching loads until ${timeStr}.`
      : `Stored battery energy will support current loads until ${timeStr}.`;
  }

  let conditionLabel = 'Low Sun / Overcast';
  if (eq.irradiance > 600) conditionLabel = 'Strong Sunlight';
  else if (eq.irradiance >= 200) conditionLabel = 'Moderate Sun';

  const humidity = Math.round(75 - (eq.irradiance / 920) * 35);

  return {
    systemStatus: eq.inverter2.variancePercent > 30 ? 'WARNING' : 'OPTIMAL',
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
      irradiance: eq.irradiance,
      ambientTemp: eq.ambientTemp,
      conditionLabel,
      humidity,
      windSpeed: eq.windSpeed,
      windDirection: 'North-East',
    },
    timestamp: new Date().toISOString(),
  };
}

export function getForecastData(simulatedHour: number = 12.0): ForecastResponse {
  const hourlyTimeSeries = [];
  const hourlyWeather: HourlyWeatherForecast[] = [];
  let peakKw = 0;
  let totalYieldKwh = 0;

  for (let h = 0; h <= 23; h++) {
    const ideal = getIdealSolarKw(h);
    const amb = getAmbientTemp(h);
    const irr = getIrradiance(h, 1.0);
    const cellT = getPvCellTemp(amb, irr, 3.2);
    const tempDerate = Math.max(0.75, 1.0 - TEMP_COEFF_PV * (cellT - 25.0));
    const dcGross = ideal * tempDerate;

    const dc1 = dcGross * 0.515 * 0.985;
    const dc2 = dcGross * 0.485 * 0.845;
    const ac1 = dc1 * getInverterEfficiency(dc1, 17.0, amb + 10);
    const ac2 = dc2 * getInverterEfficiency(dc2, 17.0, amb + 15);
    const kw = Math.round((ac1 + ac2) * 10) / 10;

    if (kw > peakKw) peakKw = kw;
    totalYieldKwh += kw;

    const timeLabel = `${String(h).padStart(2, '0')}:00`;
    hourlyTimeSeries.push({
      hour: timeLabel,
      generationKw: kw,
    });

    // Cloud cover profile: lowest during peak midday sun
    let cloudCover = 15;
    if (h < 6 || h > 18) cloudCover = 25;
    else if (h >= 11 && h <= 15) cloudCover = 10;
    else cloudCover = 20;

    // Relative humidity inversely related to temperature
    const humidity = Math.round(75 - (irr / 920) * 35);

    // Wind speed: light at night, building up to thermal afternoon breezes
    const windSpeed =
      Math.round((2.0 + (h >= 9 && h <= 17 ? Math.sin(((h - 9) / 8) * Math.PI) * 2.2 : 0)) * 10) / 10;

    // UV Index curve
    const uvIndex = Math.round((irr / 920) * 10 * 10) / 10;

    // Condition icon & text
    let conditionLabel = 'Clear Night';
    let conditionIcon: 'sun' | 'cloud' | 'cloud-rain' | 'cloud-snow' | 'wind' | 'cloud-drizzle' | 'moon' = 'moon';
    if (h >= 6 && h <= 18) {
      if (cloudCover <= 15) {
        conditionLabel = 'Clear & Sunny';
        conditionIcon = 'sun';
      } else if (cloudCover <= 30) {
        conditionLabel = 'Scattered Clouds';
        conditionIcon = 'cloud';
      } else {
        conditionLabel = 'Partly Cloudy';
        conditionIcon = 'cloud';
      }
    }

    hourlyWeather.push({
      hour: timeLabel,
      decimalHour: h,
      generationKw: kw,
      irradianceWm2: irr,
      tempCelsius: amb,
      feelsLikeCelsius: Math.round((amb + (humidity > 50 ? 1.5 : -0.5)) * 10) / 10,
      cloudCoverPercent: cloudCover,
      humidityPercent: humidity,
      windSpeedMs: windSpeed,
      windDirectionCardinal: 'NE',
      rainProbabilityPercent: h >= 15 && h <= 18 ? 10 : 0,
      uvIndex,
      conditionLabel,
      conditionIcon,
    });
  }

  const todayStr = '2026-10-29';

  const sevenDayOutlook: DailyWeatherForecast[] = [
    {
      date: '2026-10-29',
      dayName: 'Thursday',
      dayShort: 'Today',
      conditionLabel: 'Clear & Sunny',
      conditionIcon: 'sun',
      highTempCelsius: 34.2,
      lowTempCelsius: 21.5,
      expectedSolarYieldKwh: 285.0,
      yieldRating: 'EXCELLENT',
      rainProbabilityPercent: 5,
      cloudCoverPercent: 12,
      uvIndexMax: 10,
      windSpeedMaxMs: 4.4,
      operationalSuitability: 'Peak Solar Day: Ideal for Hammer Mill & Commercial Bakery',
    },
    {
      date: '2026-10-30',
      dayName: 'Friday',
      dayShort: 'Fri',
      conditionLabel: 'Mostly Sunny',
      conditionIcon: 'sun',
      highTempCelsius: 33.5,
      lowTempCelsius: 22.0,
      expectedSolarYieldKwh: 274.0,
      yieldRating: 'EXCELLENT',
      rainProbabilityPercent: 10,
      cloudCoverPercent: 18,
      uvIndexMax: 9.5,
      windSpeedMaxMs: 4.1,
      operationalSuitability: 'High continuous yield: Optimal for all daytime community loads',
    },
    {
      date: '2026-10-31',
      dayName: 'Saturday',
      dayShort: 'Sat',
      conditionLabel: 'Scattered Clouds',
      conditionIcon: 'cloud',
      highTempCelsius: 31.8,
      lowTempCelsius: 20.8,
      expectedSolarYieldKwh: 242.0,
      yieldRating: 'GOOD',
      rainProbabilityPercent: 20,
      cloudCoverPercent: 32,
      uvIndexMax: 8.5,
      windSpeedMaxMs: 3.8,
      operationalSuitability: 'Stable generation with brief 14:00 cloud dips; run loads early',
    },
    {
      date: '2026-11-01',
      dayName: 'Sunday',
      dayShort: 'Sun',
      conditionLabel: 'Passing Afternoon Showers',
      conditionIcon: 'cloud-rain',
      highTempCelsius: 28.4,
      lowTempCelsius: 19.5,
      expectedSolarYieldKwh: 198.0,
      yieldRating: 'MODERATE',
      rainProbabilityPercent: 45,
      cloudCoverPercent: 58,
      uvIndexMax: 6.5,
      windSpeedMaxMs: 5.2,
      operationalSuitability: 'Natural panel washing expected; prioritize residential & pumping',
    },
    {
      date: '2026-11-02',
      dayName: 'Monday',
      dayShort: 'Mon',
      conditionLabel: 'Clear Post-Rain Skies',
      conditionIcon: 'sun',
      highTempCelsius: 30.5,
      lowTempCelsius: 20.0,
      expectedSolarYieldKwh: 282.0,
      yieldRating: 'EXCELLENT',
      rainProbabilityPercent: 10,
      cloudCoverPercent: 15,
      uvIndexMax: 9.0,
      windSpeedMaxMs: 3.6,
      operationalSuitability: 'Clean washed panels deliver high optical yield; ideal for all machines',
    },
    {
      date: '2026-11-03',
      dayName: 'Tuesday',
      dayShort: 'Tue',
      conditionLabel: 'Warm & Dry Sunlight',
      conditionIcon: 'sun',
      highTempCelsius: 33.0,
      lowTempCelsius: 21.2,
      expectedSolarYieldKwh: 278.0,
      yieldRating: 'EXCELLENT',
      rainProbabilityPercent: 5,
      cloudCoverPercent: 14,
      uvIndexMax: 9.8,
      windSpeedMaxMs: 4.0,
      operationalSuitability: 'Full daytime capacity available for scheduled microgrid activities',
    },
    {
      date: '2026-11-04',
      dayName: 'Wednesday',
      dayShort: 'Wed',
      conditionLabel: 'Sunny with Light Breeze',
      conditionIcon: 'sun',
      highTempCelsius: 33.8,
      lowTempCelsius: 21.8,
      expectedSolarYieldKwh: 280.0,
      yieldRating: 'EXCELLENT',
      rainProbabilityPercent: 5,
      cloudCoverPercent: 16,
      uvIndexMax: 10.0,
      windSpeedMaxMs: 4.2,
      operationalSuitability: 'High solar availability; full workshop and bakery capacity',
    },
  ];

  const nowAmb = getAmbientTemp(simulatedHour);
  const nowIrr = getIrradiance(simulatedHour, 1.0);
  const nowCellT = getPvCellTemp(nowAmb, nowIrr, 3.4);
  const heatDeratingPct = Math.max(0, Math.round(TEMP_COEFF_PV * (nowCellT - 25.0) * 100 * 10) / 10);
  const nowHum = Math.round(75 - (nowIrr / 920) * 35);
  const nowUv = Math.round((nowIrr / 920) * 10 * 10) / 10;
  const nowFeels = Math.round((nowAmb + (nowHum > 50 ? 1.5 : -0.5)) * 10) / 10;
  let uvLvl = 'Low';
  if (nowUv >= 8) uvLvl = 'Very High';
  else if (nowUv >= 6) uvLvl = 'High';
  else if (nowUv >= 3) uvLvl = 'Moderate';

  let condLabel = 'Clear Night';
  let condIcon: 'sun' | 'cloud' | 'cloud-rain' | 'wind' = 'sun';
  let condDesc = 'Stable nocturnal atmospheric conditions with clear skies.';
  if (simulatedHour >= 6 && simulatedHour <= 18) {
    if (nowIrr > 600) {
      condLabel = 'Sunny & Clear Skies';
      condIcon = 'sun';
      condDesc = 'Direct solar radiation under high atmospheric clarity with light thermal updrafts.';
    } else if (nowIrr >= 200) {
      condLabel = 'Scattered Sunlight';
      condIcon = 'sun';
      condDesc = 'Moderate solar irradiance with scattered thin clouds and steady generation.';
    } else {
      condLabel = 'Overcast / Soft Sun';
      condIcon = 'cloud';
      condDesc = 'Diffuse solar radiation filtered through cloud layers.';
    }
  }

  const weatherOverview: ComprehensiveWeatherOverview = {
    currentTemp: nowAmb,
    feelsLikeTemp: nowFeels,
    tempHigh: 34.2,
    tempLow: 21.5,
    irradianceWm2: nowIrr,
    conditionLabel: condLabel,
    conditionDescription: condDesc,
    conditionIcon: condIcon,
    humidityPercent: nowHum,
    barometricPressureHpa: 1014.2,
    uvIndex: nowUv,
    uvLevel: uvLvl,
    windSpeedMs: 3.4,
    windGustMs: 4.8,
    windDirectionCardinal: 'NE',
    windDirectionDegrees: 45,
    visibilityKm: 16.0,
    dewPointCelsius: 16.8,
    cloudCoverPercent: simulatedHour >= 6 && simulatedHour <= 18 ? 12 : 25,
    sunriseTime: '06:12 AM',
    sunsetTime: '06:24 PM',
    daylightDuration: '12h 12m',
    solarZenithTime: '12:18 PM',
    precipitationRiskPercent: 5,
    rainfallAmountMm: 0.0,
    dustRiskIndex: 'MODERATE',
    heatDeratingImpactPercent: heatDeratingPct,
  };

  return {
    date: todayStr,
    projectedTotalYieldKwh: Math.round(totalYieldKwh * 10) / 10,
    peakKw: Math.round(peakKw * 10) / 10,
    hourlyTimeSeries,
    operationalAdvice: 'Optimal machinery window between 10:30 and 14:30 for high-energy operations.',
    weatherOverview,
    hourlyWeather,
    sevenDayOutlook,
  };
}

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

export function getBatteryDiagnostics(hour: number): BatteryDiagnosticsResponse {
  const eq = calculateEquipmentGeneration(hour);
  const { totalLoadKw } = getAllocationsForTime(hour, 'adjusted');
  const netKw = eq.totalActualAcKw - totalLoadKw;

  const soc = getBatterySocAtHour(hour);
  const usableKwh = Math.max(0, (TOTAL_STORAGE_KWH * soc) / 100 - RESERVE_FLOOR_KWH);
  const storedKwh = (TOTAL_STORAGE_KWH * soc) / 100;

  const sunsynkEff = netKw >= 0 ? 0.965 : 0.958;
  const dcBatteryPowerKw = netKw >= 0 ? netKw * sunsynkEff : Math.abs(netKw) / sunsynkEff;
  const totalBatteryCurrentA = Math.min(220, Math.round((dcBatteryPowerKw * 1000) / 51.2 * 10) / 10);

  const current1 = Math.round(totalBatteryCurrentA * 0.508 * 10) / 10;
  const current2 = Math.round(totalBatteryCurrentA * 0.492 * 10) / 10;

  // Temperature rises with ambient thermal transfer and C-rate resistive heating (I^2 * R)
  const amb = getAmbientTemp(hour);
  const baseBatteryRoomTemp = 20.0 + (amb - 22.0) * 0.25;
  const towerTemp1 = Math.round((baseBatteryRoomTemp + 5.5 + 0.07 * current1) * 10) / 10;
  const towerTemp2 = Math.round((baseBatteryRoomTemp + 5.8 + 0.075 * current2) * 10) / 10;

  const vOffset = netKw > 0 ? (totalBatteryCurrentA / 200) * 0.4 : -(totalBatteryCurrentA / 200) * 0.4;
  const voltage1 = Math.round((51.3 + vOffset) * 10) / 10;
  const voltage2 = Math.round((51.2 + vOffset) * 10) / 10;

  let projectedCutoffTimestamp = '';
  let descriptiveMessage = '';

  if (netKw >= 0.8) {
    const chargeNeededKwh = TOTAL_STORAGE_KWH * 0.95 - storedKwh;
    if (chargeNeededKwh <= 0) {
      projectedCutoffTimestamp = 'Fully Charged';
      descriptiveMessage = 'Batteries are fully charged at 95% protective threshold. Solar generation safely covers campus loads.';
    } else {
      const sunsynkEfficiency = 0.965;
      const effectiveChargeRate = Math.min(netKw * sunsynkEfficiency, MAX_BATTERY_RATE_KW);
      const hoursRemaining = effectiveChargeRate > 0 ? chargeNeededKwh / effectiveChargeRate : 2;
      const finishHour = (hour + hoursRemaining) % 24;
      const timeStr = formatClockTime(finishHour);
      projectedCutoffTimestamp = timeStr;
      descriptiveMessage = `Solar surplus is actively charging storage. Batteries are projected to reach full capacity by ${timeStr}.`;
    }
  } else {
    const activeLoad = Math.max(10, totalLoadKw);
    const hoursLeft = activeLoad > 0 ? usableKwh / activeLoad : 8;
    const cutoffH = (hour + hoursLeft) % 24;
    const timeStr = formatClockTime(cutoffH);
    projectedCutoffTimestamp = timeStr;
    const isNight = hour >= 18 || hour < 6;
    descriptiveMessage = isNight
      ? `Batteries will comfortably support nighttime residential and teaching loads until ${timeStr}.`
      : `Stored battery energy will support current microgrid loads until ${timeStr}.`;
  }

  return {
    batteryInverter: {
      model: 'Sunsynk SUN-20K-SG05LP3-EU-SM2',
      operatingMode: 'GRID_FORMING_ISLAND',
      acOutputKw: Math.round(Math.min(20.0, Math.abs(netKw)) * 10) / 10,
      inverterTempCelsius: Math.round((amb * 0.35 + 23.3 + (dcBatteryPowerKw / 20.0) * 8.5) * 10) / 10,
      status: 'OPTIMAL',
    },
    towers: [
      {
        towerId: 1,
        moduleCount: 10,
        totalCapacityKwh: 51.2,
        currentSocPercent: Math.min(100, Math.round(soc * 10) / 10),
        voltageV: voltage1,
        currentA: current1,
        temperatureCelsius: towerTemp1,
        isBalanced: true,
        bmsStatus: 'OPTIMAL',
      },
      {
        towerId: 2,
        moduleCount: 10,
        totalCapacityKwh: 51.2,
        currentSocPercent: Math.min(100, Math.round((soc - 0.2) * 10) / 10),
        voltageV: voltage2,
        currentA: current2,
        temperatureCelsius: towerTemp2,
        isBalanced: true,
        bmsStatus: 'OPTIMAL',
      },
    ],
    history24h: getPast24HoursBattery(hour),
    runtimeProjection: {
      projectedCutoffTimestamp,
      descriptiveMessage,
    },
  };
}

export function getInverterDiagnostics(t: number): InverterTelemetry[] {
  const eq = calculateEquipmentGeneration(t);

  return [
    {
      id: 'solis_inverter_1',
      name: 'Inverter 1 (Solis 17kW)',
      status: eq.inverter1.variancePercent <= 15 ? 'OPTIMAL' : 'WARNING',
      acPowerKw: eq.inverter1.acPowerKw,
      expectedPowerKw: eq.inverter1.expectedPowerKw,
      variancePercent: eq.inverter1.variancePercent,
      acVoltageV: 400.2,
      frequencyHz: 50.02,
      dcInputKw: eq.inverter1.dcInputKw,
      temperatureCelsius: eq.inverter1.heatsinkTemp,
      faultCode: null,
    },
    {
      id: 'solis_inverter_2',
      name: 'Inverter 2 (Solis 17kW)',
      status: eq.inverter2.variancePercent <= 15 ? 'OPTIMAL' : eq.inverter2.variancePercent <= 30 ? 'WARNING' : 'FAULT',
      acPowerKw: eq.inverter2.acPowerKw,
      expectedPowerKw: eq.inverter2.expectedPowerKw,
      variancePercent: eq.inverter2.variancePercent,
      acVoltageV: 398.8,
      frequencyHz: 49.98,
      dcInputKw: eq.inverter2.dcInputKw,
      temperatureCelsius: eq.inverter2.heatsinkTemp,
      faultCode: null,
    },
  ];
}
