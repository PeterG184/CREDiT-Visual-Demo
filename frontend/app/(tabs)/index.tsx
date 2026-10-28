import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/colors';
import useSimulation from '../../services/SimulationContext';
import PowerBalanceMeter from '../../components/PowerBalanceMeter';
import { t } from '../../services/i18n';

export default function DashboardScreen() {
  const { overview } = useSimulation();
  const { batterySummary, weatherSummary, totalGenerationKw, totalLoadDemandKw, netPowerKw, activeLoads } =
    overview;

  const soc = batterySummary.aggregateSocPercent;
  const isHealthy = soc > 20;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('dashboard.title')}</Text>
        <Text style={styles.pageSubtitle}>
          Real-time physical telemetry and automated community power distribution
        </Text>
      </View>

      {/* Power Balance Hero Card */}
      <PowerBalanceMeter
        generatingKw={totalGenerationKw}
        usingKw={totalLoadDemandKw}
        netKw={netPowerKw}
        activeLoads={activeLoads}
      />

      {/* Responsive Two-Column Row for Desktop / 1920x1080 Displays */}
      <View style={styles.twoColumnGrid}>
        {/* Battery Quick-Status Card */}
        <View style={[styles.card, styles.columnCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('dashboard.battery.title')}</Text>
            <View
              style={[
                styles.badge,
                isHealthy ? styles.badgeGreen : styles.badgeOrange,
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: isHealthy ? Colors.batteryHealthy : Colors.alertWarning },
                ]}
              />
              <Text style={styles.badgeText}>
                {batterySummary.flowState === 'CHARGING'
                  ? t('common.status.charging')
                  : batterySummary.flowState === 'DISCHARGING'
                  ? t('common.status.discharging')
                  : t('common.status.idle')}
              </Text>
            </View>
          </View>

          {/* Battery Capacity & SoC */}
          <View style={styles.batteryMainRow}>
            <View style={styles.batteryNumberCol}>
              <Text style={styles.batterySocText}>{soc.toFixed(1)}%</Text>
              <Text style={styles.batterySubLabel}>
                {batterySummary.storedKwh.toFixed(1)} kWh / 102.4 kWh
              </Text>
            </View>

            <View style={styles.usableBox}>
              <Text style={styles.usableLabel}>Usable Energy</Text>
              <Text style={styles.usableValue}>{batterySummary.usableKwh.toFixed(1)} kWh</Text>
              <Text style={styles.usableReserve}>(Above 10% Reserve)</Text>
            </View>
          </View>

          {/* Dynamic Context Explanation */}
          <View style={styles.projectionBox}>
            <Text style={styles.projectionText}>"{batterySummary.plainTextProjection}"</Text>
          </View>
        </View>

        {/* Weather Conditions Card */}
        <View style={[styles.card, styles.columnCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('dashboard.weather.title')}</Text>
            <View style={styles.weatherBadge}>
              <Text style={styles.weatherConditionText}>{weatherSummary.conditionLabel}</Text>
            </View>
          </View>

          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>{t('dashboard.weather.irradiance')}</Text>
              <Text style={styles.weatherValue}>
                {weatherSummary.irradiance} <Text style={styles.unit}>W/m²</Text>
              </Text>
            </View>

            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>{t('dashboard.weather.temperature')}</Text>
              <Text style={styles.weatherValue}>
                {weatherSummary.ambientTemp} <Text style={styles.unit}>°C</Text>
              </Text>
            </View>

            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>{t('dashboard.weather.humidity')}</Text>
              <Text style={styles.weatherValue}>
                {weatherSummary.humidity} <Text style={styles.unit}>%</Text>
              </Text>
            </View>

            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>{t('dashboard.weather.wind')}</Text>
              <Text style={styles.weatherValue}>
                {weatherSummary.windSpeed} <Text style={styles.unit}>m/s {weatherSummary.windDirection}</Text>
              </Text>
            </View>
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
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
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
    fontSize: 14,
    color: Colors.textSecondary,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  columnCard: {
    flex: 1,
    minWidth: 360,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  badgeGreen: {
    backgroundColor: Colors.batterySubtle,
    borderColor: Colors.batteryHealthy,
  },
  badgeOrange: {
    backgroundColor: Colors.alertWarningSubtle,
    borderColor: Colors.alertWarning,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  batteryMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  batteryNumberCol: {
    gap: 2,
  },
  batterySocText: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.batteryHealthy,
  },
  batterySubLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  usableBox: {
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'flex-end',
  },
  usableLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  usableValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  usableReserve: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  projectionBox: {
    backgroundColor: Colors.batterySubtle,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.batteryHealthy,
  },
  projectionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  weatherBadge: {
    backgroundColor: Colors.sunSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
  },
  weatherConditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weatherItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.bgBase,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  weatherLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  weatherValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
