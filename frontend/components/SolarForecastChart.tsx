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
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 200 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const height = 280;
  const paddingLeft = 65; // Generous gutter to ensure Y-axis labels are never cut off
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = Math.max(200, containerWidth - paddingLeft - paddingRight);
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

  // X-axis label ticks (more detailed on wide screens)
  const xTickHours = containerWidth > 700
    ? [0, 3, 6, 9, 12, 15, 18, 21, 24]
    : [0, 6, 9, 12, 15, 18, 21];

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.chartTitle}>{t('forecast.chartTitle')}</Text>
          <Text style={styles.chartSubtitle}>Single-variable power generation (kW) profile over 24 hours</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendColor} />
          <Text style={styles.legendText}>Solar Generation (kW)</Text>
        </View>
      </View>

      <View style={styles.svgWrapper}>
        <Svg viewBox={`0 0 ${containerWidth} ${height}`} width="100%" height={height}>
          <Defs>
            <LinearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={Colors.sunPrimary} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={Colors.sunPrimary} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

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

          {/* Horizontal grid lines & Y-axis labels */}
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
            strokeWidth="3.5"
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
          <Circle cx={currentX} cy={currentY} r="6" fill={Colors.accentSky} stroke={Colors.bgSurface} strokeWidth="2" />

          {/* Current Time Tag Text */}
          <SvgText
            x={currentX > containerWidth - 90 ? currentX - 12 : currentX + 10}
            y={paddingTop + 14}
            fill={Colors.accentSky}
            fontSize="11"
            fontWeight="700"
            fontFamily={FONT_FAMILY}
            textAnchor={currentX > containerWidth - 90 ? 'end' : 'start'}
          >
            NOW
          </SvgText>

          {/* Bottom baseline */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={containerWidth - paddingRight}
            y2={paddingTop + chartHeight}
            stroke={Colors.textPrimary}
            strokeWidth="2"
          />

          {/* X-axis ticks & labels */}
          {xTickHours.map((h) => {
            const index = Math.min(data.length - 1, h);
            const x = getX(index);
            const label = `${String(h).padStart(2, '0')}:00`;
            return (
              <React.Fragment key={h}>
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
                  fill={Colors.textSecondary}
                  fontSize="12"
                  textAnchor="middle"
                  fontWeight="500"
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: Colors.sunPrimary,
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

export default SolarForecastChart;
