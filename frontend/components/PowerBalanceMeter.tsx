import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import { t } from '../services/i18n';

interface PowerBalanceProps {
  generatingKw: number;
  usingKw: number;
  netKw: number;
  activeLoads: { name: string; powerKw: number }[];
}

export const PowerBalanceMeter: React.FC<PowerBalanceProps> = ({
  generatingKw,
  usingKw,
  netKw,
  activeLoads,
}) => {
  const maxScale = Math.max(55, generatingKw, usingKw);
  const genRatio = Math.min(1, Math.max(0, generatingKw / maxScale));
  const loadRatio = Math.min(1, Math.max(0, usingKw / maxScale));

  const isSurplus = netKw >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{t('dashboard.powerBalance.title')}</Text>
        <View
          style={[
            styles.flowBadge,
            isSurplus ? styles.flowBadgeSurplus : styles.flowBadgeDeficit,
          ]}
        >
          <View
            style={[
              styles.flowDot,
              { backgroundColor: isSurplus ? Colors.batteryHealthy : Colors.alertWarning },
            ]}
          />
          <Text style={styles.flowText}>
            {isSurplus
              ? `+${netKw.toFixed(1)} kW (Storing to Battery)`
              : `${netKw.toFixed(1)} kW (Drawing from Battery)`}
          </Text>
        </View>
      </View>

      {/* Generation vs Demand Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>{t('dashboard.powerBalance.generating')}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: Colors.sunPrimary }]}>
              {generatingKw.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t('common.units.kw')}</Text>
          </View>
          {/* Generation Bar */}
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${genRatio * 100}%`, backgroundColor: Colors.sunPrimary },
              ]}
            />
          </View>
        </View>

        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>{t('dashboard.powerBalance.using')}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.metricValue, { color: Colors.accentSky }]}>
              {usingKw.toFixed(1)}
            </Text>
            <Text style={styles.metricUnit}>{t('common.units.kw')}</Text>
          </View>
          {/* Load Bar */}
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${loadRatio * 100}%`, backgroundColor: Colors.accentSky },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Currently Powering List */}
      <View style={styles.activeLoadsContainer}>
        <Text style={styles.activeLoadsHeader}>
          {t('dashboard.powerBalance.currentlyPowering')}:
        </Text>
        {activeLoads.length > 0 ? (
          <View style={styles.activeLoadsList}>
            {activeLoads.map((item, idx) => (
              <View key={idx} style={styles.loadItem}>
                <View style={styles.loadBullet} />
                <Text style={styles.loadName}>{item.name}</Text>
                <Text style={styles.loadPower}>({item.powerKw} kW)</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noLoadsText}>No high-demand operations currently active.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  flowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  flowBadgeSurplus: {
    backgroundColor: Colors.batterySubtle,
    borderColor: Colors.batteryHealthy,
  },
  flowBadgeDeficit: {
    backgroundColor: Colors.alertWarningSubtle,
    borderColor: Colors.alertWarning,
  },
  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricColumn: {
    flex: 1,
    gap: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    height: 10,
    backgroundColor: Colors.bgBase,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  activeLoadsContainer: {
    backgroundColor: Colors.bgBase,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  activeLoadsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activeLoadsList: {
    gap: 6,
  },
  loadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentSky,
  },
  loadName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  loadPower: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  noLoadsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default PowerBalanceMeter;

