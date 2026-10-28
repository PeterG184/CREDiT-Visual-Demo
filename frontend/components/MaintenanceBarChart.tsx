import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import Colors from '../constants/colors';
import { FONT_FAMILY } from '../constants/typography';
import { InverterTelemetry } from '../types/microgrid';
import { t } from '../services/i18n';

interface MaintenanceBarChartProps {
  inverters: InverterTelemetry[];
}

export const MaintenanceBarChart: React.FC<MaintenanceBarChartProps> = ({ inverters }) => {
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 200 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const height = 260;
  const paddingLeft = 65; // Ample margin so Y-axis labels (0, 5, 10, 15, 20, 25) are never cut off
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = Math.max(200, containerWidth - paddingLeft - paddingRight);
  const chartHeight = height - paddingTop - paddingBottom;

  const maxKw = 25; // 17kW rated + overhead

  const getY = (kw: number) => {
    const clamped = Math.max(0, Math.min(maxKw, kw));
    return paddingTop + chartHeight - (clamped / maxKw) * chartHeight;
  };

  const yTicks = [0, 5, 10, 15, 20, 25];

  // Group width per inverter
  const groupWidth = chartWidth / (inverters.length || 1);
  const barWidth = Math.min(70, Math.max(38, chartWidth * 0.08));

  return (
    <View style={styles.card} onLayout={handleLayout}>
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
        <Svg viewBox={`0 0 ${containerWidth} ${height}`} width="100%" height={height}>
          {/* Y-axis Unit Label */}
          <SvgText
            x={paddingLeft - 12}
            y={paddingTop - 12}
            fill={Colors.textSecondary}
            fontSize="11"
            textAnchor="end"
            fontWeight="700"
            fontFamily={FONT_FAMILY}
          >
            (kW)
          </SvgText>

          {/* Grid lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <G key={tick}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={containerWidth - paddingRight}
                  y2={y}
                  stroke={Colors.borderSubtle}
                  strokeWidth="1"
                />
                <SvgText
                  x={paddingLeft - 12}
                  y={y + 4}
                  fill={Colors.textSecondary}
                  fontSize="12"
                  textAnchor="end"
                  fontWeight="600"
                  fontFamily={FONT_FAMILY}
                >
                  {tick}
                </SvgText>
              </G>
            );
          })}

          {/* Inverter Bar Groups */}
          {inverters.map((inv, idx) => {
            const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
            const expBarX = groupCenterX - barWidth - 6;
            const actBarX = groupCenterX + 6;

            const expY = getY(inv.expectedPowerKw);
            const expH = Math.max(2, paddingTop + chartHeight - expY);

            const actY = getY(inv.acPowerKw);
            const actH = Math.max(2, paddingTop + chartHeight - actY);

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
                  rx={4}
                />
                <SvgText
                  x={expBarX + barWidth / 2}
                  y={expY - 8}
                  fill={Colors.textSecondary}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily={FONT_FAMILY}
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
                  rx={4}
                />
                <SvgText
                  x={actBarX + barWidth / 2}
                  y={actY - 8}
                  fill={actColor}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily={FONT_FAMILY}
                  textAnchor="middle"
                >
                  {inv.acPowerKw.toFixed(1)}
                </SvgText>

                {/* X-axis Label */}
                <SvgText
                  x={groupCenterX}
                  y={paddingTop + chartHeight + 20}
                  fill={Colors.textPrimary}
                  fontSize="13"
                  fontWeight="700"
                  fontFamily={FONT_FAMILY}
                  textAnchor="middle"
                >
                  {inv.name}
                </SvgText>

                {/* Variance text */}
                <SvgText
                  x={groupCenterX}
                  y={paddingTop + chartHeight + 36}
                  fill={actColor}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily={FONT_FAMILY}
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
            x2={containerWidth - paddingRight}
            y2={paddingTop + chartHeight}
            stroke={Colors.textPrimary}
            strokeWidth="2"
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
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
    width: '100%',
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
    minWidth: 260,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  svgWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  leewayInfoBox: {
    backgroundColor: Colors.bgBase,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  leewayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  leewayRow: {
    gap: 6,
  },
  leewayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leewayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leewayText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
  },
});

export default MaintenanceBarChart;
