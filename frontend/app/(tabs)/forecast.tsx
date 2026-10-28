import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/colors';
import useSimulation from '../../services/SimulationContext';
import SolarForecastChart from '../../components/SolarForecastChart';
import { t } from '../../services/i18n';

export default function ForecastScreen() {
  const { forecast, currentHour } = useSimulation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('forecast.title')}</Text>
        <Text style={styles.pageSubtitle}>
          Forward-looking solar generation capacity for load planning and machinery scheduling
        </Text>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('forecast.peakProduction')}</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.sunPrimary }]}>
              {forecast.peakKw.toFixed(1)}
            </Text>
            <Text style={styles.kpiUnit}>kW</Text>
          </View>
          <Text style={styles.kpiSubtext}>Estimated at 12:30 peak solar zenith</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t('forecast.estimatedDailyYield')}</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.accentSky }]}>
              {forecast.projectedTotalYieldKwh.toFixed(1)}
            </Text>
            <Text style={styles.kpiUnit}>kWh</Text>
          </View>
          <Text style={styles.kpiSubtext}>Based on clear atmospheric model</Text>
        </View>
      </View>

      {/* Single-Variable 24-Hour Solar Generation Curve */}
      <SolarForecastChart data={forecast.hourlyTimeSeries} currentHour={currentHour} />

      {/* Operational Recommendation Banner */}
      <View style={styles.adviceBanner}>
        <View style={styles.adviceDot} />
        <View style={styles.adviceContent}>
          <Text style={styles.adviceTitle}>Operational Recommendation</Text>
          <Text style={styles.adviceBody}>{forecast.operationalAdvice}</Text>
        </View>
      </View>

      {/* Plain English Daily Summary Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('forecast.summaryTitle')}</Text>
        <View style={styles.summaryList}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>{t('forecast.periods.morning')}</Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>{t('forecast.periods.midday')}</Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>{t('forecast.periods.afternoon')}</Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={styles.summaryBullet} />
            <Text style={styles.summaryText}>{t('forecast.periods.night')}</Text>
          </View>
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
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  kpiUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kpiSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
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
  },
  adviceBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryList: {
    gap: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  summaryBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentSky,
    marginTop: 6,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
    flex: 1,
  },
});

