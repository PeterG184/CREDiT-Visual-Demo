import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import Colors from '../constants/colors';
import { InverterTelemetry } from '../types/microgrid';
import { t } from '../services/i18n';

interface MaintenanceBarChartProps {
  inverters: InverterTelemetry[];
}

export const MaintenanceBarChart: React.FC<MaintenanceBarChartProps> = ({ inverters }) => {
  const width = 640;
  const height = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxKw = 25; // 17kW rated + overhead

  const getY = (kw: number) => {
    const clamped = Math.max(0, Math.min(maxKw, kw));
    return paddingTop + chartHeight - (clamped / maxKw) * chartHeight;
  };

  const yTicks = [0, 5, 10, 15, 20, 25];

  // Group width per inverter
  const groupWidth = chartWidth / (inverters.length || 1);
  const barWidth = 36;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text style={styles.cardTitle}>{t('maintenance.inverterChartTitle')}</Text>
          <Text style={styles.cardSubtitle}>
            Comparing real-time generation against physics-based irradiance expectation
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.borderStrong }]} />
            <Text style={styles.legendText}>Expected (kW)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: Colors.sunPrimary }]} />
            <Text style={styles.legendText}>Actual (kW)</Text>
          </View>
        </View>
      </View>

      {/* Bar Chart SVG */}
      <View style={styles.svgWrapper}>
        <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
          {/* Grid lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <G key={tick}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={Colors.borderSubtle}
                  strokeWidth="1"
                />
                <SvgText
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill={Colors.textSecondary}
                  fontSize="11"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {tick}
                </SvgText>
              </G>
            );
          })}

          {/* Inverter Bar Groups */}
          {inverters.map((inv, idx) => {
            const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
            const expBarX = groupCenterX - barWidth - 4;
            const actBarX = groupCenterX + 4;

            const expY = getY(inv.expectedPowerKw);
            const expH = paddingTop + chartHeight - expY;

            const actY = getY(inv.acPowerKw);
            const actH = paddingTop + chartHeight - actY;

            // Leeway variance color
            const isWarning = inv.variancePercent > 15 && inv.variancePercent <= 30;
            const isFault = inv.variancePercent > 30;
            const actColor = isFault
              ? Colors.alertDanger
              : isWarning
              ? Colors.alertWarning
              : Colors.sunPrimary;

            return (
              <G key={inv.id}>
                {/* Expected Bar */}
                <Rect
                  x={expBarX}
                  y={expY}
                  width={barWidth}
                  height={expH}
                  fill={Colors.borderStrong}
                  rx={3}
                />
                <SvgText
                  x={expBarX + barWidth / 2}
                  y={expY - 6}
                  fill={Colors.textSecondary}
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {inv.expectedPowerKw.toFixed(1)}
                </SvgText>

                {/* Actual Bar */}
                <Rect
                  x={actBarX}
                  y={actY}
                  width={barWidth}
                  height={actH}
                  fill={actColor}
                  rx={3}
                />
                <SvgText
                  x={actBarX + barWidth / 2}
                  y={actY - 6}
                  fill={actColor}
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {inv.acPowerKw.toFixed(1)}
                </SvgText>

                {/* X-axis Label */}
                <SvgText
                  x={groupCenterX}
                  y={paddingTop + chartHeight + 18}
                  fill={Colors.textPrimary}
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {inv.name}
                </SvgText>

                {/* Variance text */}
                <SvgText
                  x={groupCenterX}
                  y={paddingTop + chartHeight + 32}
                  fill={actColor}
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {inv.variancePercent > 0
                    ? `-${inv.variancePercent}% variance (${
                        inv.variancePercent <= 15
                          ? 'Optimal Leeway'
                          : inv.variancePercent <= 30
                          ? 'Minor Variance'
                          : 'Trip Fault'
                      })`
                    : 'Balanced'}
                </SvgText>
              </G>
            );
          })}

          {/* Bottom baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke={Colors.textPrimary}
            strokeWidth="1.5"
          />
        </Svg>
      </View>

      {/* Leeway Threshold Reference Bar */}
      <View style={styles.leewayInfoBox}>
        <Text style={styles.leewayTitle}>Diagnostic Leeway Rule Reference:</Text>
        <View style={styles.leewayRow}>
          <View style={styles.leewayItem}>
            <View style={[styles.leewayIndicator, { backgroundColor: Colors.batteryHealthy }]} />
            <Text style={styles.leewayText}>0 – 15%: Normal atmospheric scatter (Optimal)</Text>
          </View>
          <View style={styles.leewayItem}>
            <View style={[styles.leewayIndicator, { backgroundColor: Colors.alertWarning }]} />
            <Text style={styles.leewayText}>15 – 30%: Soiling / dust variance (Attention)</Text>
          </View>
          <View style={styles.leewayItem}>
            <View style={[styles.leewayIndicator, { backgroundColor: Colors.alertDanger }]} />
            <Text style={styles.leewayText}>&gt; 30%: Hardware alarm / string trip (Fault)</Text>
          </View>
        </View>
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
    gap: 12,
  },
  titleArea: {
    flex: 1,
    minWidth: 240,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  svgWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  leewayInfoBox: {
    backgroundColor: Colors.bgBase,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  leewayTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  leewayRow: {
    gap: 4,
  },
  leewayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leewayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leewayText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default MaintenanceBarChart;
