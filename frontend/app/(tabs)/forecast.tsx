import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FONT_FAMILY } from '../../constants/typography';
import useSimulation from '../../services/SimulationContext';
import SolarForecastChart from '../../components/SolarForecastChart';
import WeatherOverviewCard from '../../components/WeatherOverviewCard';
import HourlyWeatherStrip from '../../components/HourlyWeatherStrip';
import SevenDayOutlook from '../../components/SevenDayOutlook';
import { t } from '../../services/i18n';

export default function ForecastScreen() {
  const { forecast, currentHour } = useSimulation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>{t('forecast.title')}</Text>
          <View style={styles.stationPill}>
            <Feather name="cloud" size={13} color={Colors.accentSky} />
            <Text style={styles.stationPillText}>Atmospheric & Solar Station</Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>
          Real-time weather telemetry, 24-hour single-variable parameter curves, hourly progression, and 7-day solar generation outlook
        </Text>
      </View>

      {/* Summary Meteorological & Solar KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('forecast.peakProduction')}</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.sunPrimary }]}>
              {forecast.peakKw.toFixed(1)}
            </Text>
            <Text style={styles.kpiUnit}>kW</Text>
          </View>
          <Text style={styles.kpiSubtext}>Estimated at 12:30 solar noon</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('forecast.estimatedDailyYield')}</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.accentSky }]}>
              {forecast.projectedTotalYieldKwh.toFixed(1)}
            </Text>
            <Text style={styles.kpiUnit}>kWh</Text>
          </View>
          <Text style={styles.kpiSubtext}>Projected daily clean energy</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Daylight Production Window</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.batteryHealthy }]}>12.2</Text>
            <Text style={styles.kpiUnit}>hrs</Text>
          </View>
          <Text style={styles.kpiSubtext}>06:12 AM to 18:24 PM</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Peak Thermal Derating</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.alertWarning }]}>-10.5</Text>
            <Text style={styles.kpiUnit}>%</Text>
          </View>
          <Text style={styles.kpiSubtext}>NOCT module cell heating (55°C)</Text>
        </View>
      </View>

      {/* 1. Atmospheric Overview & Live Station Card */}
      {forecast.weatherOverview && (
        <WeatherOverviewCard weather={forecast.weatherOverview} />
      )}

      {/* 2. 24-Hour Chronological Hourly Weather Strip */}
      {forecast.hourlyWeather && (
        <HourlyWeatherStrip
          hourlyWeather={forecast.hourlyWeather}
          currentHour={currentHour}
        />
      )}

      {/* 3. Interactive Single-Variable 24-Hour Forecast Curve (with metric selector) */}
      <SolarForecastChart
        data={forecast.hourlyTimeSeries}
        hourlyWeather={forecast.hourlyWeather}
        currentHour={currentHour}
      />

      {/* 4. 7-Day Microgrid Weather & Solar Outlook */}
      {forecast.sevenDayOutlook && (
        <SevenDayOutlook outlook={forecast.sevenDayOutlook} />
      )}

      {/* Operational Recommendation Banner */}
      <View style={styles.adviceBanner}>
        <View style={styles.adviceDot} />
        <View style={styles.adviceContent}>
          <Text style={styles.adviceTitle}>{t('forecast.operationalAdvice')}</Text>
          <Text style={styles.adviceBody}>{forecast.operationalAdvice}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
    width: '100%',
  },
  pageHeader: {
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentSkySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSky,
    fontFamily: FONT_FAMILY,
    textTransform: 'uppercase',
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  kpiUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  kpiSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: FONT_FAMILY,
  },
  adviceBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.sunSubtle,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
    gap: 10,
    alignItems: 'flex-start',
  },
  adviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sunPrimary,
    marginTop: 4,
  },
  adviceContent: {
    flex: 1,
    gap: 2,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  adviceBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
});
