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
import { ForecastDataPoint } from '../types/microgrid';
import { t } from '../services/i18n';

interface SolarForecastChartProps {
  data: ForecastDataPoint[];
  currentHour: number;
}

export const SolarForecastChart: React.FC<SolarForecastChartProps> = ({
  data,
  currentHour,
}) => {
  // Chart dimensions inside SVG viewBox
  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxKw = 55; // Up to 55 kW scale

  // Convert (hour, kw) to SVG coordinate (x, y)
  const getX = (hourIndex: number) => {
    return paddingLeft + (hourIndex / (data.length - 1)) * chartWidth;
  };

  const getY = (kw: number) => {
    const clamped = Math.max(0, Math.min(maxKw, kw));
    return paddingTop + chartHeight - (clamped / maxKw) * chartHeight;
  };

  // Build SVG path
  let pathD = `M ${getX(0)} ${getY(data[0]?.generationKw || 0)}`;
  let areaD = `M ${getX(0)} ${getY(data[0]?.generationKw || 0)}`;

  for (let i = 1; i < data.length; i++) {
    const x = getX(i);
    const y = getY(data[i].generationKw);
    pathD += ` L ${x} ${y}`;
    areaD += ` L ${x} ${y}`;
  }

  // Close the area path to base
  areaD += ` L ${getX(data.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;

  // Current time line X position
  const clampedHour = Math.max(0, Math.min(23.99, currentHour));
  const currentX = paddingLeft + (clampedHour / 23.99) * chartWidth;
  const currentKwIndex = Math.min(23, Math.floor(clampedHour));
  const currentKw = data[currentKwIndex]?.generationKw || 0;
  const currentY = getY(currentKw);

  // Y-axis ticks
  const yTicks = [0, 10, 20, 30, 40, 50];

  // X-axis label ticks
  const xTickHours = [0, 6, 9, 12, 15, 18, 21];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.chartTitle}>{t('forecast.chartTitle')}</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendColor} />
          <Text style={styles.legendText}>Solar Generation (kW)</Text>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={240}>
          <Defs>
            <LinearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={Colors.sunPrimary} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={Colors.sunPrimary} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines & Y-axis labels */}
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
                  {tick}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Filled Area */}
          <Path d={areaD} fill="url(#solarGradient)" />

          {/* Generation Stroke Curve */}
          <Path
            d={pathD}
            fill="none"
            stroke={Colors.sunPrimary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Time Vertical Marker */}
          <Line
            x1={currentX}
            y1={paddingTop}
            x2={currentX}
            y2={paddingTop + chartHeight}
            stroke={Colors.accentSky}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <Circle cx={currentX} cy={currentY} r="5" fill={Colors.accentSky} />

          {/* Current Time Tag Text */}
          <SvgText
            x={currentX > width - 80 ? currentX - 10 : currentX + 8}
            y={paddingTop + 14}
            fill={Colors.accentSky}
            fontSize="10"
            fontWeight="700"
            textAnchor={currentX > width - 80 ? 'end' : 'start'}
          >
            NOW
          </SvgText>

          {/* X-axis ticks & labels */}
          {xTickHours.map((h) => {
            const x = getX(h);
            const label = `${String(h).padStart(2, '0')}:00`;
            return (
              <React.Fragment key={h}>
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
                  fill={Colors.textSecondary}
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="500"
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: Colors.sunPrimary,
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

export default SolarForecastChart;
