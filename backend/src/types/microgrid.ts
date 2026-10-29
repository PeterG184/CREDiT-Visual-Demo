export type HealthStatus = 'OPTIMAL' | 'WARNING' | 'FAULT';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WeatherTelemetry {
  ambientTemperatureCelsius: number;
  relativeHumidityPercent: number;
  irradianceWattsPerSquareMeter: number;
  windSpeedMetersPerSecond: number;
  windDirectionDegrees: number;
  conditionLabel: string;
  timestamp: string;
}

export interface InverterTelemetry {
  id: 'solis_inverter_1' | 'solis_inverter_2';
  name: string;
  status: HealthStatus;
  acPowerKw: number;
  expectedPowerKw: number;
  variancePercent: number;
  acVoltageV: number;
  frequencyHz: number;
  dcInputKw: number;
  temperatureCelsius: number;
  faultCode: string | null;
}

export interface BatteryTowerTelemetry {
  towerId: 1 | 2;
  moduleCount: number; // 10 units per tower
  totalCapacityKwh: number; // 51.2 kWh per tower
  currentSocPercent: number;
  voltageV: number;
  currentA: number;
  temperatureCelsius: number;
  isBalanced: boolean;
  bmsStatus: HealthStatus;
}

export interface LoadAllocationItem {
  id: string;
  activityName: string;
  priorityRank: 1 | 2 | 3 | 4 | 'CONTINUOUS';
  powerDemandKw: number;
  plannedStartTime: string; // "08:00"
  plannedEndTime: string;   // "10:00"
  actualStartTime?: string;
  actualEndTime?: string;
  isActiveNow: boolean;
  isAdjusted: boolean;
  adjustmentNote?: string;
}

export interface OverviewTelemetry {
  systemStatus: HealthStatus;
  totalGenerationKw: number;
  totalLoadDemandKw: number;
  netPowerKw: number;
  activeLoads: { name: string; powerKw: number }[];
  batterySummary: {
    aggregateSocPercent: number;
    storedKwh: number;
    usableKwh: number;
    flowState: 'CHARGING' | 'DISCHARGING' | 'IDLE';
    plainTextProjection: string;
  };
  weatherSummary: {
    irradiance: number;
    ambientTemp: number;
    conditionLabel: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
  };
  timestamp: string;
}

export interface ForecastDataPoint {
  hour: string;
  generationKw: number;
}

export interface HourlyWeatherForecast {
  hour: string;
  decimalHour: number;
  generationKw: number;
  irradianceWm2: number;
  tempCelsius: number;
  feelsLikeCelsius: number;
  cloudCoverPercent: number;
  humidityPercent: number;
  windSpeedMs: number;
  windDirectionCardinal: string;
  rainProbabilityPercent: number;
  uvIndex: number;
  conditionLabel: string;
  conditionIcon: 'sun' | 'cloud' | 'cloud-rain' | 'cloud-snow' | 'wind' | 'cloud-drizzle' | 'moon';
}

export interface DailyWeatherForecast {
  date: string;
  dayName: string;
  dayShort: string;
  conditionLabel: string;
  conditionIcon: 'sun' | 'cloud' | 'cloud-rain' | 'cloud-snow' | 'wind' | 'cloud-drizzle';
  highTempCelsius: number;
  lowTempCelsius: number;
  expectedSolarYieldKwh: number;
  yieldRating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  rainProbabilityPercent: number;
  cloudCoverPercent: number;
  uvIndexMax: number;
  windSpeedMaxMs: number;
  operationalSuitability: string;
}

export interface ComprehensiveWeatherOverview {
  currentTemp: number;
  feelsLikeTemp: number;
  tempHigh: number;
  tempLow: number;
  irradianceWm2: number;
  conditionLabel: string;
  conditionDescription: string;
  conditionIcon: 'sun' | 'cloud' | 'cloud-rain' | 'wind';
  humidityPercent: number;
  barometricPressureHpa: number;
  uvIndex: number;
  uvLevel: string;
  windSpeedMs: number;
  windGustMs: number;
  windDirectionCardinal: string;
  windDirectionDegrees: number;
  visibilityKm: number;
  dewPointCelsius: number;
  cloudCoverPercent: number;
  sunriseTime: string;
  sunsetTime: string;
  daylightDuration: string;
  solarZenithTime: string;
  precipitationRiskPercent: number;
  rainfallAmountMm: number;
  dustRiskIndex: 'LOW' | 'MODERATE' | 'HIGH';
  heatDeratingImpactPercent: number;
}

export interface ForecastResponse {
  date: string;
  projectedTotalYieldKwh: number;
  peakKw: number;
  hourlyTimeSeries: ForecastDataPoint[];
  operationalAdvice: string;
  weatherOverview: ComprehensiveWeatherOverview;
  hourlyWeather: HourlyWeatherForecast[];
  sevenDayOutlook: DailyWeatherForecast[];
}

export interface AllocationResponse {
  viewType: 'planned' | 'adjusted';
  totalScheduledKwh: number;
  algorithmNotes: string;
  items: LoadAllocationItem[];
}

export interface BatteryHistoricalPoint {
  timeLabel: string;
  hourOffset: number;
  socPercent: number;
}

export interface BatteryDiagnosticsResponse {
  batteryInverter: {
    model: string;
    operatingMode: string;
    acOutputKw: number;
    inverterTempCelsius: number;
    status: HealthStatus;
  };
  towers: BatteryTowerTelemetry[];
  history24h: BatteryHistoricalPoint[];
  runtimeProjection: {
    projectedCutoffTimestamp: string;
    descriptiveMessage: string;
  };
}

export interface MaintenanceReportPayload {
  technicianName: string;
  incidentTimestamp: string;
  equipmentIds: string[];
  equipmentOtherDetails?: string;
  faultTypes: string[];
  faultOtherDetails?: string;
  photoUrl?: string;
  computedUrgency: UrgencyLevel;
}

export interface MaintenanceReportResponse {
  reportId: string;
  status: string;
  computedUrgency: string;
  message: string;
  createdAt: string;
  storedFile?: string;
}

