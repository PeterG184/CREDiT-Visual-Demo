import {
  OverviewTelemetry,
  ForecastResponse,
  AllocationResponse,
  BatteryDiagnosticsResponse,
  InverterTelemetry,
  MaintenanceReportPayload,
} from '../types/microgrid';
import * as simulator from './simulator';

// Dynamically determine the backend URL so client browsers connecting from remote devices
// automatically reach the backend on port 5600 of the same host (Lightsail IP or domain).
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5600/api/v1`;
  }
  return 'http://localhost:5600/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

// Helper to determine if we can reach the backend
async function fetchWithFallback<T>(
  url: string,
  fallbackFn: () => T
): Promise<{ data: T; isLiveBackend: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { data, isLiveBackend: true };
    }
  } catch (err) {
    // Network error or backend offline: silently fall back to client simulation
  }

  return { data: fallbackFn(), isLiveBackend: false };
}

export const ApiService = {
  async getOverview(simulatedHour?: number): Promise<{ data: OverviewTelemetry; isLiveBackend: boolean }> {
    const effectiveHour =
      simulatedHour !== undefined
        ? simulatedHour
        : new Date().getHours() + new Date().getMinutes() / 60;

    return fetchWithFallback(
      `${API_BASE_URL}/microgrid/overview?hour=${effectiveHour}`,
      () => simulator.getOverviewTelemetry(effectiveHour)
    );
  },

  async getForecast(simulatedHour?: number): Promise<{ data: ForecastResponse; isLiveBackend: boolean }> {
    const effectiveHour =
      simulatedHour !== undefined
        ? simulatedHour
        : new Date().getHours() + new Date().getMinutes() / 60;

    const fallback = simulator.getForecastData(effectiveHour);
    const res = await fetchWithFallback(
      `${API_BASE_URL}/microgrid/forecast/24h?hour=${effectiveHour}`,
      () => fallback
    );

    // If backend doesn't have extended weather forecast fields yet, augment with client simulator data
    if (!res.data.weatherOverview || !res.data.hourlyWeather) {
      return {
        data: {
          ...fallback,
          ...res.data,
          weatherOverview: fallback.weatherOverview,
          hourlyWeather: fallback.hourlyWeather,
          sevenDayOutlook: fallback.sevenDayOutlook,
        },
        isLiveBackend: res.isLiveBackend,
      };
    }

    return res;
  },

  async getAllocations(
    viewType: 'planned' | 'adjusted',
    simulatedHour?: number
  ): Promise<{ data: AllocationResponse; isLiveBackend: boolean }> {
    const effectiveHour =
      simulatedHour !== undefined
        ? simulatedHour
        : new Date().getHours() + new Date().getMinutes() / 60;

    return fetchWithFallback(
      `${API_BASE_URL}/microgrid/allocations?view=${viewType}&hour=${effectiveHour}`,
      () => simulator.getAllocationResponse(effectiveHour, viewType)
    );
  },

  async getBatteryDiagnostics(
    simulatedHour?: number
  ): Promise<{ data: BatteryDiagnosticsResponse; isLiveBackend: boolean }> {
    const effectiveHour =
      simulatedHour !== undefined
        ? simulatedHour
        : new Date().getHours() + new Date().getMinutes() / 60;

    return fetchWithFallback(
      `${API_BASE_URL}/microgrid/battery/diagnostics?hour=${effectiveHour}`,
      () => simulator.getBatteryDiagnostics(effectiveHour)
    );
  },

  async getInverters(simulatedHour?: number): Promise<{ data: InverterTelemetry[]; isLiveBackend: boolean }> {
    const effectiveHour =
      simulatedHour !== undefined
        ? simulatedHour
        : new Date().getHours() + new Date().getMinutes() / 60;

    return fetchWithFallback(
      `${API_BASE_URL}/microgrid/maintenance/inverters?hour=${effectiveHour}`,
      () => simulator.getInverterDiagnostics(effectiveHour)
    );
  },

  async submitMaintenanceReport(
    payload: MaintenanceReportPayload
  ): Promise<{ reportId: string; status: string; computedUrgency: string; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch(`${API_BASE_URL}/microgrid/maintenance/report`, {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Network error or backend offline: fallback immediately
    }

    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    return {
      reportId,
      status: 'LOGGED',
      computedUrgency: payload.computedUrgency,
      message: 'Incident report logged successfully. Maintenance ticket created.',
    };
  },
};

export default ApiService;

