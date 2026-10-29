import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  OverviewTelemetry,
  ForecastResponse,
  AllocationResponse,
  BatteryDiagnosticsResponse,
  InverterTelemetry,
} from '../types/microgrid';
import ApiService from './api';
import * as simulator from './simulator';
import { LocaleCode, getLocale, setLocale as setI18nLocale, subscribeLocale } from './i18n';

interface SimulationContextType {
  currentHour: number;
  isLiveMode: boolean;
  isLiveBackend: boolean;
  activeScheduleView: 'planned' | 'adjusted';
  overview: OverviewTelemetry;
  forecast: ForecastResponse;
  allocations: AllocationResponse;
  battery: BatteryDiagnosticsResponse;
  inverters: InverterTelemetry[];
  locale: LocaleCode;
  setLocale: (loc: LocaleCode) => void;
  setLiveMode: (live: boolean) => void;
  setSimulatedHour: (hour: number) => void;
  setActiveScheduleView: (view: 'planned' | 'adjusted') => void;
  refreshData: () => void;
  formattedTime: string;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getNowHour = () => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  };

  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [currentHour, setCurrentHour] = useState<number>(getNowHour());
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [activeScheduleView, setActiveScheduleView] = useState<'planned' | 'adjusted'>('adjusted');
  const [locale, setLocaleState] = useState<LocaleCode>(getLocale());

  useEffect(() => {
    return subscribeLocale((newLoc) => {
      setLocaleState(newLoc);
    });
  }, []);

  const changeLocale = useCallback((newLoc: LocaleCode) => {
    setI18nLocale(newLoc);
    setLocaleState(newLoc);
  }, []);

  // Telemetry state initialized with simulator data
  const [overview, setOverview] = useState<OverviewTelemetry>(() =>
    simulator.getOverviewTelemetry(getNowHour())
  );
  const [forecast, setForecast] = useState<ForecastResponse>(() =>
    simulator.getForecastData(getNowHour())
  );
  const [allocations, setAllocations] = useState<AllocationResponse>(() =>
    simulator.getAllocationResponse(getNowHour(), 'adjusted')
  );
  const [battery, setBattery] = useState<BatteryDiagnosticsResponse>(() =>
    simulator.getBatteryDiagnostics(getNowHour())
  );
  const [inverters, setInverters] = useState<InverterTelemetry[]>(() =>
    simulator.getInverterDiagnostics(getNowHour())
  );

  const loadData = useCallback(async (hour: number, scheduleView: 'planned' | 'adjusted') => {
    try {
      const [ovRes, fcRes, alRes, btRes, invRes] = await Promise.all([
        ApiService.getOverview(hour),
        ApiService.getForecast(hour),
        ApiService.getAllocations(scheduleView, hour),
        ApiService.getBatteryDiagnostics(hour),
        ApiService.getInverters(hour),
      ]);

      setOverview(ovRes.data);
      setForecast(fcRes.data);
      setAllocations(alRes.data);
      setBattery(btRes.data);
      setInverters(invRes.data);
      setIsLiveBackend(ovRes.isLiveBackend);
    } catch {
      // Fallback already handled inside ApiService
    }
  }, []);

  // Update loop for live mode (every 10s)
  useEffect(() => {
    if (!isLiveMode) return;

    const tick = () => {
      const h = getNowHour();
      setCurrentHour(h);
      loadData(h, activeScheduleView);
    };

    tick();
    const timer = setInterval(tick, 10000);
    return () => clearInterval(timer);
  }, [isLiveMode, activeScheduleView, loadData]);

  // When manually changing simulated hour
  const handleSetSimulatedHour = (hour: number) => {
    setIsLiveMode(false);
    setCurrentHour(hour);
    loadData(hour, activeScheduleView);
  };

  const handleSetLiveMode = (live: boolean) => {
    setIsLiveMode(live);
    if (live) {
      const h = getNowHour();
      setCurrentHour(h);
      loadData(h, activeScheduleView);
    }
  };

  const handleScheduleViewChange = (view: 'planned' | 'adjusted') => {
    setActiveScheduleView(view);
    loadData(currentHour, view);
  };

  const refreshData = () => {
    loadData(currentHour, activeScheduleView);
  };

  // Format the current hour into HH:MM
  const hFloor = Math.floor(currentHour);
  const mFloor = Math.round((currentHour - hFloor) * 60);
  const formattedTime = `${String(hFloor).padStart(2, '0')}:${String(mFloor).padStart(2, '0')}`;

  return (
    <SimulationContext.Provider
      value={{
        currentHour,
        isLiveMode,
        isLiveBackend,
        activeScheduleView,
        overview,
        forecast,
        allocations,
        battery,
        inverters,
        locale,
        setLocale: changeLocale,
        setLiveMode: handleSetLiveMode,
        setSimulatedHour: handleSetSimulatedHour,
        setActiveScheduleView: handleScheduleViewChange,
        refreshData,
        formattedTime,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export default useSimulation;

