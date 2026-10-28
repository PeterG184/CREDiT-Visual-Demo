import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/colors';
import useSimulation from '../../services/SimulationContext';
import BatteryHistoryChart from '../../components/BatteryHistoryChart';
import { t } from '../../services/i18n';

export default function BatteryScreen() {
  const { battery, overview } = useSimulation();
  const { towers, history24h, runtimeProjection, batteryInverter } = battery;
  const { batterySummary, netPowerKw } = overview;

  const isCharging = netPowerKw > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('battery.title')}</Text>
        <Text style={styles.pageSubtitle}>
          102.4 kWh Dyness DL5.0C Pro Energy Storage System & Sunsynk 20kW Battery Inverter
        </Text>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Current Storage</Text>
          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValue, { color: Colors.batteryHealthy }]}>
              {batterySummary.storedKwh.toFixed(1)}
            </Text>
            <Text style={styles.kpiUnit}>kWh ({batterySummary.aggregateSocPercent.toFixed(1)}%)</Text>
          </View>
          <Text style={styles.kpiSubtext}>Usable: {batterySummary.usableKwh.toFixed(1)} kWh above 10% reserve</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Net Power Flow</Text>
          <View style={styles.kpiValueRow}>
            <Text
              style={[
                styles.kpiValue,
                { color: isCharging ? Colors.batteryHealthy : Colors.alertWarning },
              ]}
            >
              {isCharging ? `+${netPowerKw.toFixed(1)}` : `${netPowerKw.toFixed(1)}`}
            </Text>
            <Text style={styles.kpiUnit}>kW</Text>
          </View>
          <Text style={styles.kpiSubtext}>
            {isCharging ? 'Charging from PV arrays' : 'Discharging to community load'}
          </Text>
        </View>
      </View>

      {/* Past 24 Hours Battery Life History Chart */}
      <BatteryHistoryChart
        data={history24h}
        currentSoc={batterySummary.aggregateSocPercent}
      />

      {/* Predictive Runtime Projection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('battery.runtimeProjectionTitle')}</Text>
          <View style={styles.projectedBadge}>
            <Text style={styles.projectedBadgeText}>Depletion: {runtimeProjection.projectedCutoffTimestamp}</Text>
          </View>
        </View>

        {/* Visual Progress Bar to Reserve Cutoff */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>State of Charge</Text>
            <Text style={styles.progressValue}>{batterySummary.aggregateSocPercent.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${batterySummary.aggregateSocPercent}%`,
                  backgroundColor:
                    batterySummary.aggregateSocPercent > 20
                      ? Colors.batteryHealthy
                      : Colors.alertWarning,
                },
              ]}
            />
          </View>
          <Text style={styles.reserveFootnote}>10% Depth-of-Discharge cutoff protected by Dyness BMS</Text>
        </View>

        <View style={styles.projectionNotice}>
          <Text style={styles.projectionMessage}>"{runtimeProjection.descriptiveMessage}"</Text>
        </View>
      </View>

      {/* Dual Tower Comparison Cards */}
      <View style={styles.towersGrid}>
        {towers.map((tower) => (
          <View key={tower.towerId} style={styles.towerCard}>
            <View style={styles.towerHeader}>
              <View>
                <Text style={styles.towerTitle}>Tower {tower.towerId} Status</Text>
                <Text style={styles.towerModules}>10 x Dyness DL5.0C Pro (51.2 kWh)</Text>
              </View>
              <View style={styles.towerBadge}>
                <View style={styles.towerBadgeDot} />
                <Text style={styles.towerBadgeText}>Balanced</Text>
              </View>
            </View>

            <View style={styles.towerMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>State of Charge</Text>
                <Text style={styles.metricItemValue}>{tower.currentSocPercent.toFixed(1)}%</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>Temperature</Text>
                <Text style={styles.metricItemValue}>{tower.temperatureCelsius.toFixed(1)} °C</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>DC Voltage</Text>
                <Text style={styles.metricItemValue}>{tower.voltageV.toFixed(1)} V</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricItemLabel}>Current Flow</Text>
                <Text style={styles.metricItemValue}>{tower.currentA.toFixed(1)} A</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Sunsynk Inverter Telemetry */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Battery Inverter: {batteryInverter.model}</Text>
          <View style={styles.towerBadge}>
            <View style={styles.towerBadgeDot} />
            <Text style={styles.towerBadgeText}>Operational</Text>
          </View>
        </View>

        <View style={styles.inverterGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>Operating Mode</Text>
            <Text style={styles.metricItemValue}>{batteryInverter.operatingMode}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>AC Output Power</Text>
            <Text style={styles.metricItemValue}>{batteryInverter.acOutputKw.toFixed(1)} kW</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>Inverter Temp</Text>
            <Text style={styles.metricItemValue}>{batteryInverter.inverterTempCelsius.toFixed(1)} °C</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>AC/DC Coupling</Text>
            <Text style={styles.metricItemValue}>Synchronized</Text>
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
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 14,
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
  projectedBadge: {
    backgroundColor: Colors.accentSkySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accentSky,
  },
  projectedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 12,
    backgroundColor: Colors.bgBase,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  reserveFootnote: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  projectionNotice: {
    backgroundColor: Colors.batterySubtle,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.batteryHealthy,
  },
  projectionMessage: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  towersGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  towerCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  towerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  towerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  towerModules: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  towerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.batterySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.batteryHealthy,
    gap: 5,
  },
  towerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.batteryHealthy,
  },
  towerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  towerMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: Colors.bgBase,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 2,
  },
  metricItemLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metricItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inverterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
