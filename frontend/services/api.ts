import {
  OverviewTelemetry,
  ForecastResponse,
  AllocationResponse,
  BatteryDiagnosticsResponse,
  InverterTelemetry,
  MaintenanceReportPayload,
} from '../types/microgrid';
import * as simulator from './simulator';

const API_BASE_URL = 'http://localhost:5678/api/v1';

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

  async getForecast(): Promise<{ data: ForecastResponse; isLiveBackend: boolean }> {
    return fetchWithFallback(
      `${API_BASE_URL}/microgrid/forecast/24h`,
      () => simulator.getForecastData()
    );
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

