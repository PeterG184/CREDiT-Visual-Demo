import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
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

  // X-axis label points: every 6 hours (-24h, -18h, -12h, -6h, 0h/Now)
  const xIndices = [0, 6, 12, 18, 24];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.chartTitle}>{t('battery.historyTitle')}</Text>
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
        <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={240}>
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
                  {tick}%
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* 10% Reserve Floor Dotted Line */}
          <Line
            x1={paddingLeft}
            y1={reserveY}
            x2={width - paddingRight}
            y2={reserveY}
            stroke={Colors.alertDanger}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Area fill */}
          <Path d={areaD} fill="url(#batteryGradient)" />

          {/* Stroke curve */}
          <Path
            d={pathD}
            fill="none"
            stroke={Colors.batteryHealthy}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current point (Now) */}
          <Circle
            cx={getX(data.length - 1)}
            cy={getY(currentSoc)}
            r="5"
            fill={Colors.batteryHealthy}
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
                  y2={paddingTop + chartHeight + 4}
                  stroke={Colors.textSecondary}
                  strokeWidth="1"
                />
                <SvgText
                  x={x}
                  y={paddingTop + chartHeight + 18}
                  fill={isNow ? Colors.batteryHealthy : Colors.textSecondary}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight={isNow ? '700' : '500'}
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
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendDash: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
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
});

export default BatteryHistoryChart;

