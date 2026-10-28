import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
  Circle,
} from 'react-native-svg';
import Colors from '../constants/colors';
import { FONT_FAMILY } from '../constants/typography';
import { BatteryHistoricalPoint } from '../types/microgrid';
import { t } from '../services/i18n';

interface BatteryHistoryChartProps {
  data: BatteryHistoricalPoint[];
  currentSoc: number;
}

export const BatteryHistoryChart: React.FC<BatteryHistoryChartProps> = ({
  data,
  currentSoc,
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 200 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const height = 280;
  const paddingLeft = 70; // Ample margin so 100%, 75%, 50%, 25%, 0% are fully visible
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = Math.max(200, containerWidth - paddingLeft - paddingRight);
  const chartHeight = height - paddingTop - paddingBottom;

  const maxPercent = 100;

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (soc: number) => {
    const clamped = Math.max(0, Math.min(maxPercent, soc));
    return paddingTop + chartHeight - (clamped / maxPercent) * chartHeight;
  };

  let pathD = `M ${getX(0)} ${getY(data[0]?.socPercent || 0)}`;
  let areaD = `M ${getX(0)} ${getY(data[0]?.socPercent || 0)}`;

  for (let i = 1; i < data.length; i++) {
    const x = getX(i);
    const y = getY(data[i].socPercent);
    pathD += ` L ${x} ${y}`;
    areaD += ` L ${x} ${y}`;
  }

  // Close area
  areaD += ` L ${getX(data.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;

  const yTicks = [0, 25, 50, 75, 100];
  const reserveY = getY(10); // 10% cutoff line

  // X-axis label points: every 3 or 4 hours on wide screens, every 6 on small
  const xIndices = containerWidth > 800
    ? [0, 3, 6, 9, 12, 15, 18, 21, 24]
    : [0, 6, 12, 18, 24];

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.chartTitle}>{t('battery.historyTitle')}</Text>
          <Text style={styles.chartSubtitle}>
            Continuous state of charge telemetry over the past 24 hours
          </Text>
        </View>
        <View style={styles.badgesRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.batteryHealthy }]} />
            <Text style={styles.legendText}>Dyness SoC (%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { borderColor: Colors.alertDanger }]} />
            <Text style={styles.legendText}>10% Reserve Floor</Text>
          </View>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg viewBox={`0 0 ${containerWidth} ${height}`} width="100%" height={height}>
          <Defs>
            <LinearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={Colors.batteryHealthy} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={Colors.batteryHealthy} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Grid lines & Y ticks */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <React.Fragment key={tick}>
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
                  {tick}%
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* 10% Reserve Floor Dotted Line */}
          <Line
            x1={paddingLeft}
            y1={reserveY}
            x2={containerWidth - paddingRight}
            y2={reserveY}
            stroke={Colors.alertDanger}
            strokeWidth="2"
            strokeDasharray="5 5"
          />

          {/* Reserve Floor Tag */}
          <SvgText
            x={containerWidth - paddingRight - 6}
            y={reserveY - 6}
            fill={Colors.alertDanger}
            fontSize="11"
            fontWeight="700"
            fontFamily={FONT_FAMILY}
            textAnchor="end"
          >
            10% DoD Cutoff
          </SvgText>

          {/* Area fill */}
          <Path d={areaD} fill="url(#batteryGradient)" />

          {/* Stroke curve */}
          <Path
            d={pathD}
            fill="none"
            stroke={Colors.batteryHealthy}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current point (Now) */}
          <Circle
            cx={getX(data.length - 1)}
            cy={getY(currentSoc)}
            r="6"
            fill={Colors.batteryHealthy}
            stroke={Colors.bgSurface}
            strokeWidth="2"
          />

          {/* Bottom baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={containerWidth - paddingRight}
            y2={paddingTop + chartHeight}
            stroke={Colors.textPrimary}
            strokeWidth="2"
          />

          {/* X ticks */}
          {xIndices.map((idx) => {
            const point = data[idx];
            if (!point) return null;
            const x = getX(idx);
            const isNow = idx === data.length - 1;
            const label = isNow ? 'NOW' : point.timeLabel;

            return (
              <React.Fragment key={idx}>
                <Line
                  x1={x}
                  y1={paddingTop + chartHeight}
                  x2={x}
                  y2={paddingTop + chartHeight + 6}
                  stroke={Colors.textPrimary}
                  strokeWidth="1.5"
                />
                <SvgText
                  x={x}
                  y={paddingTop + chartHeight + 20}
                  fill={isNow ? Colors.batteryHealthy : Colors.textSecondary}
                  fontSize="12"
                  textAnchor="middle"
                  fontWeight={isNow ? '700' : '500'}
                  fontFamily={FONT_FAMILY}
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleCol: {
    gap: 2,
    flex: 1,
    minWidth: 260,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  chartSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendDash: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
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
});

export default BatteryHistoryChart;
