import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FONT_FAMILY } from '../constants/typography';
import { HourlyWeatherForecast } from '../types/microgrid';

interface HourlyWeatherStripProps {
  hourlyWeather: HourlyWeatherForecast[];
  currentHour: number;
}

export const HourlyWeatherStrip: React.FC<HourlyWeatherStripProps> = ({
  hourlyWeather,
  currentHour,
}) => {
  const currentIntHour = Math.floor(currentHour);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.cardTitle}>24-Hour Chronological Weather Forecast</Text>
          <Text style={styles.cardSubtitle}>
            Hourly progression of solar irradiance, temperature, cloud cover, and precipitation
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Hourly Strip</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {hourlyWeather.map((item) => {
          const isCurrent = item.decimalHour === currentIntHour;

          return (
            <View
              key={item.hour}
              style={[
                styles.hourCard,
                isCurrent && styles.hourCardCurrent,
              ]}
            >
              {/* Top: Hour Label + Active Tag */}
              <View style={styles.timeTagRow}>
                <Text style={[styles.hourText, isCurrent && styles.hourTextCurrent]}>
                  {item.hour}
                </Text>
                {isCurrent && (
                  <View style={styles.nowBadge}>
                    <Text style={styles.nowText}>NOW</Text>
                  </View>
                )}
              </View>

              {/* Weather Icon */}
              <View
                style={[
                  styles.iconCircle,
                  item.generationKw > 20
                    ? styles.iconCircleSun
                    : item.rainProbabilityPercent > 30
                    ? styles.iconCircleRain
                    : styles.iconCircleNeutral,
                ]}
              >
                <Feather
                  name={
                    item.conditionIcon === 'cloud-rain'
                      ? 'cloud-rain'
                      : item.conditionIcon === 'cloud'
                      ? 'cloud'
                      : item.conditionIcon === 'moon'
                      ? 'moon'
                      : 'sun'
                  }
                  size={20}
                  color={
                    item.conditionIcon === 'moon'
                      ? Colors.textSecondary
                      : item.conditionIcon === 'cloud-rain'
                      ? Colors.accentSky
                      : Colors.sunPrimary
                  }
                />
              </View>

              {/* Temperature */}
              <Text style={styles.tempText}>{Math.round(item.tempCelsius)}°C</Text>

              {/* Solar Generation */}
              <View style={styles.metricRow}>
                <Feather name="zap" size={11} color={Colors.sunPrimary} />
                <Text style={styles.metricText}>
                  {item.generationKw.toFixed(1)} <Text style={styles.metricUnit}>kW</Text>
                </Text>
              </View>

              {/* Solar Irradiance */}
              <View style={styles.metricRow}>
                <Feather name="sun" size={11} color={Colors.accentSky} />
                <Text style={styles.metricText}>
                  {item.irradianceWm2} <Text style={styles.metricUnit}>W/m²</Text>
                </Text>
              </View>

              {/* Rain Chance */}
              <View style={styles.metricRow}>
                <Feather
                  name="droplet"
                  size={11}
                  color={item.rainProbabilityPercent > 0 ? Colors.accentSky : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.metricText,
                    item.rainProbabilityPercent > 0 && { color: Colors.accentSky },
                  ]}
                >
                  {item.rainProbabilityPercent}%
                </Text>
              </View>

              {/* Wind Speed */}
              <View style={styles.metricRow}>
                <Feather name="wind" size={11} color={Colors.textSecondary} />
                <Text style={styles.metricText}>
                  {item.windSpeedMs.toFixed(1)} <Text style={styles.metricUnit}>m/s</Text>
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
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
    gap: 8,
  },
  titleCol: {
    gap: 4,
    flex: 1,
    minWidth: 240,
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
  badge: {
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  scrollContent: {
    gap: 10,
    paddingVertical: 4,
  },
  hourCard: {
    width: 104,
    backgroundColor: Colors.bgBase,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  hourCardCurrent: {
    backgroundColor: Colors.cardActiveBg,
    borderColor: Colors.cardActiveBorder,
    borderWidth: 1.5,
  },
  timeTagRow: {
    alignItems: 'center',
    gap: 2,
  },
  hourText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  hourTextCurrent: {
    color: Colors.cardActiveBorder,
  },
  nowBadge: {
    backgroundColor: Colors.cardActiveBorder,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nowText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.bgSurface,
    fontFamily: FONT_FAMILY,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginVertical: 2,
  },
  iconCircleSun: {
    backgroundColor: Colors.sunSubtle,
    borderColor: Colors.sunPrimary,
  },
  iconCircleRain: {
    backgroundColor: Colors.accentSkySubtle,
    borderColor: Colors.accentSky,
  },
  iconCircleNeutral: {
    backgroundColor: Colors.bgSurface,
  },
  tempText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  metricUnit: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
});

export default HourlyWeatherStrip;

