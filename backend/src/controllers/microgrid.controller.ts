import { Request, Response } from 'express';
import * as simulationService from '../services/simulation.service';
import { MaintenanceReportPayload, MaintenanceReportResponse, UrgencyLevel } from '../types/microgrid';

// In-memory reports store
const maintenanceReports: Array<MaintenanceReportPayload & { reportId: string; createdAt: string; fileName?: string }> = [];

/**
 * Extract simulated hour from request or default to current wall clock time
 */
function resolveHour(req: Request): number {
  if (req.query.hour !== undefined) {
    const parsed = parseFloat(req.query.hour as string);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 24) {
      return parsed;
    }
  }
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

/**
 * GET /api/v1/microgrid/overview
 */
export function getOverview(req: Request, res: Response) {
  const hour = resolveHour(req);
  const data = simulationService.getOverviewTelemetry(hour);
  res.json(data);
}

/**
 * GET /api/v1/microgrid/forecast/24h?hour={h}
 */
export function getForecast(req: Request, res: Response) {
  const hour = resolveHour(req);
  const data = simulationService.getForecastData(hour);
  res.json(data);
}

/**
 * GET /api/v1/microgrid/allocations?view={planned|adjusted}&hour={h}
 */
export function getAllocations(req: Request, res: Response) {
  const hour = resolveHour(req);
  const view = req.query.view === 'planned' ? 'planned' : 'adjusted';
  const data = simulationService.getAllocationResponse(hour, view);
  res.json(data);
}

/**
 * GET /api/v1/microgrid/battery/diagnostics?hour={h}
 */
export function getBatteryDiagnostics(req: Request, res: Response) {
  const hour = resolveHour(req);
  const data = simulationService.getBatteryDiagnostics(hour);
  res.json(data);
}

/**
 * GET /api/v1/microgrid/maintenance/inverters?hour={h}
 */
export function getInverters(req: Request, res: Response) {
  const hour = resolveHour(req);
  const data = simulationService.getInverterDiagnostics(hour);
  res.json(data);
}

/**
 * Helper to compute urgency level if not provided
 */
function computeUrgency(equipmentIds: string[], faultTypes: string[]): UrgencyLevel {
  if (
    equipmentIds.includes('dyness_ess') ||
    equipmentIds.includes('sunsynk_inverter') ||
    faultTypes.some(
      (f) =>
        f.includes('BMS') ||
        f.includes('Lockout') ||
        f.includes('Short Circuit') ||
        f.includes('Isolation Fault')
    )
  ) {
    return 'HIGH';
  }

  if (
    equipmentIds.includes('solis_inverters') ||
    faultTypes.some((f) => f.includes('Variance') || f.includes('Over-temperature') || f.includes('String'))
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * POST /api/v1/microgrid/maintenance/report
 */
export function submitMaintenanceReport(req: Request, res: Response) {
  try {
    let {
      technicianName,
      incidentTimestamp,
      equipmentIds,
      equipmentOtherDetails,
      faultTypes,
      faultOtherDetails,
      computedUrgency,
    } = req.body;

    // Handle parsed JSON if sent as multipart form-data
    if (typeof equipmentIds === 'string') {
      try {
        equipmentIds = JSON.parse(equipmentIds);
      } catch {
        equipmentIds = [equipmentIds];
      }
    }
    if (typeof faultTypes === 'string') {
      try {
        faultTypes = JSON.parse(faultTypes);
      } catch {
        faultTypes = [faultTypes];
      }
    }

    const eqList = Array.isArray(equipmentIds) ? equipmentIds : [];
    const faultList = Array.isArray(faultTypes) ? faultTypes : [];

    const urgency: UrgencyLevel = computedUrgency || computeUrgency(eqList, faultList);
    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    const createdAt = new Date().toISOString();

    const newReport = {
      reportId,
      technicianName: technicianName || 'Unknown Technician',
      incidentTimestamp: incidentTimestamp || createdAt,
      equipmentIds: eqList,
      equipmentOtherDetails,
      faultTypes: faultList,
      faultOtherDetails,
      computedUrgency: urgency,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      fileName: req.file ? req.file.originalname : undefined,
      createdAt,
    };

    maintenanceReports.push(newReport);

    const response: MaintenanceReportResponse = {
      reportId,
      status: 'LOGGED',
      computedUrgency: urgency,
      message: 'Incident report logged successfully. Maintenance ticket created.',
      createdAt,
      storedFile: newReport.photoUrl,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting maintenance report:', error);
    res.status(500).json({
      error: 'Failed to process maintenance report',
    });
  }
}

/**
 * GET /api/v1/microgrid/maintenance/reports
 * Helper to inspect logged reports
 */
export function listMaintenanceReports(_req: Request, res: Response) {
  res.json({
    total: maintenanceReports.length,
    reports: maintenanceReports,
  });
}

