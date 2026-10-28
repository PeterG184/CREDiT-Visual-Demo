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

export interface ForecastResponse {
  date: string;
  projectedTotalYieldKwh: number;
  peakKw: number;
  hourlyTimeSeries: ForecastDataPoint[];
  operationalAdvice: string;
}

export interface AllocationResponse {
  viewType: 'planned' | 'adjusted';
  totalScheduledKwh: number;
  algorithmNotes: string;
  items: LoadAllocationItem[];
}

export interface BatteryHistoricalPoint {
  timeLabel: string; // "14:00" or ISO
  hourOffset: number; // -24 to 0
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

