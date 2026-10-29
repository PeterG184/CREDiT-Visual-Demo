import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, TouchableOpacity, ScrollView } from 'react-native';
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
import { ForecastDataPoint, HourlyWeatherForecast } from '../types/microgrid';
import { t } from '../services/i18n';

export type ForecastMetric = 'generation' | 'irradiance' | 'temperature' | 'cloud' | 'wind';

interface SolarForecastChartProps {
  data: ForecastDataPoint[];
  hourlyWeather?: HourlyWeatherForecast[];
  currentHour: number;
}

interface MetricConfig {
  id: ForecastMetric;
  label: string;
  unit: string;
  yUnitLabel: string;
  maxVal: number;
  minVal: number;
  yTicks: number[];
  color: string;
  gradientId: string;
  subtitle: string;
  getValue: (point: ForecastDataPoint, hourly?: HourlyWeatherForecast) => number;
}

const METRIC_CONFIGS: Record<ForecastMetric, MetricConfig> = {
  generation: {
    id: 'generation',
    label: 'Solar Output',
    unit: 'kW',
    yUnitLabel: '(kW)',
    maxVal: 55,
    minVal: 0,
    yTicks: [0, 10, 20, 30, 40, 50],
    color: Colors.sunPrimary,
    gradientId: 'solarGradient',
    subtitle: 'Single-variable AC power generation profile across 24 hours',
    getValue: (p) => p.generationKw,
  },
  irradiance: {
    id: 'irradiance',
    label: 'Irradiance',
    unit: 'W/m²',
    yUnitLabel: '(W/m²)',
    maxVal: 1000,
    minVal: 0,
    yTicks: [0, 200, 400, 600, 800, 1000],
    color: Colors.accentSky,
    gradientId: 'irradianceGradient',
    subtitle: 'Global Horizontal Solar Irradiance (GHI) curve from site pyranometer',
    getValue: (_p, h) => (h ? h.irradianceWm2 : 0),
  },
  temperature: {
    id: 'temperature',
    label: 'Temperature',
    unit: '°C',
    yUnitLabel: '(°C)',
    maxVal: 40,
    minVal: 15,
    yTicks: [15, 20, 25, 30, 35, 40],
    color: '#EA580C',
    gradientId: 'tempGradient',
    subtitle: 'Ambient air temperature profile influencing PV module cell derating',
    getValue: (_p, h) => (h ? h.tempCelsius : 25),
  },
  cloud: {
    id: 'cloud',
    label: 'Cloud Cover',
    unit: '%',
    yUnitLabel: '(%)',
    maxVal: 100,
    minVal: 0,
    yTicks: [0, 20, 40, 60, 80, 100],
    color: '#64748B',
    gradientId: 'cloudGradient',
    subtitle: 'Atmospheric cloud optical density percentage over the microgrid array',
    getValue: (_p, h) => (h ? h.cloudCoverPercent : 0),
  },
  wind: {
    id: 'wind',
    label: 'Wind Speed',
    unit: 'm/s',
    yUnitLabel: '(m/s)',
    maxVal: 8,
    minVal: 0,
    yTicks: [0, 2, 4, 6, 8],
    color: '#0D9488',
    gradientId: 'windGradient',
    subtitle: 'Anemometer wind velocity providing natural convective cooling',
    getValue: (_p, h) => (h ? h.windSpeedMs : 3),
  },
};

export const SolarForecastChart: React.FC<SolarForecastChartProps> = ({
  data,
  hourlyWeather,
  currentHour,
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [selectedMetric, setSelectedMetric] = useState<ForecastMetric>('generation');

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 200 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const metricConfig = METRIC_CONFIGS[selectedMetric];

  const height = 290;
  const paddingLeft = 70; // Ample width to ensure Y-axis numbers are never cut off
  const paddingRight = 30;
  const paddingTop = 32;
  const paddingBottom = 42;

  const chartWidth = Math.max(200, containerWidth - paddingLeft - paddingRight);
  const chartHeight = height - paddingTop - paddingBottom;

  const totalPoints = data.length;
  const maxVal = metricConfig.maxVal;
  const minVal = metricConfig.minVal;
  const valRange = maxVal - minVal;

  const getX = (hourIndex: number) => {
    return paddingLeft + (hourIndex / (totalPoints - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const normalized = (clamped - minVal) / valRange;
    return paddingTop + chartHeight - normalized * chartHeight;
  };

  // Extract values for the active metric
  const points = data.map((d, i) => {
    const hw = hourlyWeather && hourlyWeather[i] ? hourlyWeather[i] : undefined;
    return metricConfig.getValue(d, hw);
  });

  // Build SVG path
  let pathD = `M ${getX(0)} ${getY(points[0] || 0)}`;
  let areaD = `M ${getX(0)} ${getY(points[0] || 0)}`;

  for (let i = 1; i < totalPoints; i++) {
    const x = getX(i);
    const y = getY(points[i]);
    pathD += ` L ${x} ${y}`;
    areaD += ` L ${x} ${y}`;
  }

  // Close area
  areaD += ` L ${getX(totalPoints - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`;

  // Current time line X position
  const clampedHour = Math.max(0, Math.min(23.99, currentHour));
  const currentX = paddingLeft + (clampedHour / 23.99) * chartWidth;
  const currentHourIndex = Math.min(totalPoints - 1, Math.floor(clampedHour));
  const currentVal = points[currentHourIndex] || 0;
  const currentY = getY(currentVal);

  // X-axis label ticks
  const xTickHours =
    containerWidth > 700
      ? [0, 3, 6, 9, 12, 15, 18, 21, 24]
      : [0, 6, 9, 12, 15, 18, 21];

  const metricsList: ForecastMetric[] = [
    'generation',
    'irradiance',
    'temperature',
    'cloud',
    'wind',
  ];

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Title & Interactive Metric Selector Segmented Control */}
      <View style={styles.topControlRow}>
        <View style={styles.titleCol}>
          <Text style={styles.chartTitle}>{t('forecast.chartTitle')}</Text>
          <Text style={styles.chartSubtitle}>{metricConfig.subtitle}</Text>
        </View>

        {/* Metric Selector Pills (Strictly Single-Variable Compliance) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorScroll}
        >
          {metricsList.map((mId) => {
            const conf = METRIC_CONFIGS[mId];
            const isSelected = selectedMetric === mId;

            return (
              <TouchableOpacity
                key={mId}
                style={[
                  styles.metricPill,
                  isSelected && {
                    backgroundColor: conf.color,
                    borderColor: conf.color,
                  },
                ]}
                onPress={() => setSelectedMetric(mId)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.pillDot,
                    { backgroundColor: isSelected ? Colors.bgSurface : conf.color },
                  ]}
                />
                <Text
                  style={[
                    styles.metricPillText,
                    isSelected && styles.metricPillTextSelected,
                  ]}
                >
                  {conf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SVG Canvas (Strict Single Metric Visualization) */}
      <View style={styles.svgWrapper}>
        <Svg viewBox={`0 0 ${containerWidth} ${height}`} width="100%" height={height}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={metricConfig.color} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={metricConfig.color} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Y-axis Unit Label */}
          <SvgText
            x={paddingLeft - 14}
            y={paddingTop - 12}
            fill={Colors.textSecondary}
            fontSize="11"
            textAnchor="end"
            fontWeight="700"
            fontFamily={FONT_FAMILY}
          >
            {metricConfig.yUnitLabel}
          </SvgText>

          {/* Horizontal grid lines & Y-axis labels */}
          {metricConfig.yTicks.map((tick) => {
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
                  x={paddingLeft - 14}
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
          <Path d={areaD} fill="url(#chartGradient)" />

          {/* Metric Stroke Curve */}
          <Path
            d={pathD}
            fill="none"
            stroke={metricConfig.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Time Vertical Indicator */}
          <Line
            x1={currentX}
            y1={paddingTop}
            x2={currentX}
            y2={paddingTop + chartHeight}
            stroke={Colors.accentSky}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <Circle
            cx={currentX}
            cy={currentY}
            r="6"
            fill={Colors.accentSky}
            stroke={Colors.bgSurface}
            strokeWidth="2"
          />

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
            NOW: {typeof currentVal === 'number' ? currentVal.toFixed(1) : currentVal} {metricConfig.unit}
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
            const index = Math.min(totalPoints - 1, h);
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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
    width: '100%',
  },
  topControlRow: {
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
  selectorScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  metricPillTextSelected: {
    color: Colors.bgSurface,
    fontWeight: '700',
  },
  svgWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default SolarForecastChart;
