import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FONT_FAMILY } from '../constants/typography';
import { ComprehensiveWeatherOverview } from '../types/microgrid';

interface WeatherOverviewCardProps {
  weather: ComprehensiveWeatherOverview;
}

export const WeatherOverviewCard: React.FC<WeatherOverviewCardProps> = ({ weather }) => {
  return (
    <View style={styles.card}>
      {/* Header with Station Identifier */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.stationBadge}>
            <Feather name="radio" size={12} color={Colors.accentSky} />
            <Text style={styles.stationText}>Site Weather Station</Text>
          </View>
          <Text style={styles.cardTitle}>Current Atmospheric & Solar Telemetry</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Sensors</Text>
        </View>
      </View>

      {/* Hero Weather Condition Banner */}
      <View style={styles.heroWeatherRow}>
        <View style={styles.heroLeft}>
          <View style={styles.weatherIconCircle}>
            <Feather
              name={
                weather.conditionIcon === 'cloud-rain'
                  ? 'cloud-rain'
                  : weather.conditionIcon === 'cloud'
                  ? 'cloud'
                  : weather.conditionIcon === 'wind'
                  ? 'wind'
                  : 'sun'
              }
              size={36}
              color={Colors.sunPrimary}
            />
          </View>
          <View style={styles.tempCol}>
            <View style={styles.tempValueRow}>
              <Text style={styles.tempValue}>{weather.currentTemp.toFixed(1)}°</Text>
              <Text style={styles.tempUnit}>C</Text>
            </View>
            <Text style={styles.feelsLikeText}>
              Feels like {weather.feelsLikeTemp.toFixed(1)}°C | High: {weather.tempHigh.toFixed(1)}°C Low: {weather.tempLow.toFixed(1)}°C
            </Text>
          </View>
        </View>

        <View style={styles.heroRight}>
          <View style={styles.conditionPill}>
            <Text style={styles.conditionPillText}>{weather.conditionLabel}</Text>
          </View>
          <Text style={styles.conditionDescription}>{weather.conditionDescription}</Text>
        </View>
      </View>

      {/* 6 Key Atmospheric Gauges Grid */}
      <View style={styles.gaugesGrid}>
        {/* Irradiance */}
        <View style={styles.gaugeBox}>
          <View style={styles.gaugeHeader}>
            <Feather name="sun" size={14} color={Colors.sunPrimary} />
            <Text style={styles.gaugeLabel}>Solar Irradiance</Text>
          </View>
          <Text style={[styles.gaugeValue, { color: Colors.sunPrimary }]}>
            {weather.irradianceWm2 !== undefined ? weather.irradianceWm2 : 890} <Text style={styles.gaugeUnit}>W/m²</Text>
          </Text>
          <Text style={styles.gaugeSubtext}>Direct GHI sensor</Text>
        </View>

        {/* UV Index */}
        <View style={styles.gaugeBox}>
          <View style={styles.gaugeHeader}>
            <Feather name="shield" size={14} color={Colors.alertWarning} />
            <Text style={styles.gaugeLabel}>UV Index</Text>
          </View>
          <Text style={[styles.gaugeValue, { color: Colors.alertWarning }]}>
            {weather.uvIndex.toFixed(1)} <Text style={styles.gaugeUnit}>({weather.uvLevel})</Text>
          </Text>
          <Text style={styles.gaugeSubtext}>Solar noon peak</Text>
        </View>

        {/* Humidity */}
        <View style={styles.gaugeBox}>
          <View style={styles.gaugeHeader}>
            <Feather name="droplet" size={14} color={Colors.accentSky} />
            <Text style={styles.gaugeLabel}>Relative Humidity</Text>
          </View>
          <Text style={styles.gaugeValue}>
            {weather.humidityPercent}%
          </Text>
          <Text style={styles.gaugeSubtext}>Dew Point: {weather.dewPointCelsius}°C</Text>
        </View>

        {/* Wind Speed & Direction */}
        <View style={styles.gaugeBox}>
          <View style={styles.gaugeHeader}>
            <Feather name="wind" size={14} color={Colors.accentSky} />
            <Text style={styles.gaugeLabel}>Wind & Gusts</Text>
          </View>
          <Text style={styles.gaugeValue}>
            {weather.windSpeedMs.toFixed(1)} <Text style={styles.gaugeUnit}>m/s {weather.windDirectionCardinal}</Text>
          </Text>
          <Text style={styles.gaugeSubtext}>Gusts to {weather.windGustMs.toFixed(1)} m/s (45° NE)</Text>
        </View>

        {/* Barometer */}
        <View style={styles.gaugeBox}>
          <View style={styles.gaugeHeader}>
            <Feather name="compass" size={14} color={Colors.textSecondary} />
            <Text style={styles.gaugeLabel}>Barometer</Text>
          </View>
          <Text style={styles.gaugeValue}>
            {weather.barometricPressureHpa.toFixed(1)} <Text style={styles.gaugeUnit}>hPa</Text>
          </Text>
          <Text style={styles.gaugeSubtext}>Stable high pressure</Text>
        </View>

        {/* Cloud Cover */}
        <View style={styles.gaugeBox}>
          <View style={styles.gaugeHeader}>
            <Feather name="cloud" size={14} color={Colors.textSecondary} />
            <Text style={styles.gaugeLabel}>Cloud Cover</Text>
          </View>
          <Text style={styles.gaugeValue}>
            {weather.cloudCoverPercent}%
          </Text>
          <Text style={styles.gaugeSubtext}>Low cumulus scattering</Text>
        </View>
      </View>

      {/* Daylight & Sun Times Ephemeris Strip */}
      <View style={styles.ephemerisStrip}>
        <View style={styles.ephemerisItem}>
          <Feather name="sunrise" size={16} color={Colors.sunPrimary} />
          <View style={styles.ephemerisTextCol}>
            <Text style={styles.ephemerisLabel}>Sunrise</Text>
            <Text style={styles.ephemerisTime}>{weather.sunriseTime}</Text>
          </View>
        </View>

        <View style={styles.ephemerisDivider} />

        <View style={styles.ephemerisItem}>
          <Feather name="sun" size={16} color={Colors.sunPrimary} />
          <View style={styles.ephemerisTextCol}>
            <Text style={styles.ephemerisLabel}>Solar Noon (Zenith)</Text>
            <Text style={styles.ephemerisTime}>{weather.solarZenithTime}</Text>
          </View>
        </View>

        <View style={styles.ephemerisDivider} />

        <View style={styles.ephemerisItem}>
          <Feather name="sunset" size={16} color={Colors.alertWarning} />
          <View style={styles.ephemerisTextCol}>
            <Text style={styles.ephemerisLabel}>Sunset</Text>
            <Text style={styles.ephemerisTime}>{weather.sunsetTime}</Text>
          </View>
        </View>

        <View style={styles.ephemerisDivider} />

        <View style={styles.ephemerisItem}>
          <Feather name="clock" size={16} color={Colors.accentSky} />
          <View style={styles.ephemerisTextCol}>
            <Text style={styles.ephemerisLabel}>Daylight Window</Text>
            <Text style={styles.ephemerisTime}>{weather.daylightDuration}</Text>
          </View>
        </View>
      </View>
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
  headerLeft: {
    gap: 4,
  },
  stationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentSkySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stationText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSky,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.batterySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.batteryHealthy,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.batteryHealthy,
    fontFamily: FONT_FAMILY,
  },
  heroWeatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexWrap: 'wrap',
    gap: 16,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
  },
  weatherIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.sunSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
  },
  tempCol: {
    gap: 2,
  },
  tempValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tempValue: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  tempUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  feelsLikeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  heroRight: {
    flex: 1,
    minWidth: 200,
    gap: 6,
    alignItems: 'flex-start',
  },
  conditionPill: {
    backgroundColor: Colors.sunSubtle,
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sunPrimary,
    fontFamily: FONT_FAMILY,
  },
  conditionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  gaugesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  gaugeBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.bgBase,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
    textTransform: 'uppercase',
  },
  gaugeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  gaugeUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  gaugeSubtext: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: FONT_FAMILY,
  },
  ephemerisStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexWrap: 'wrap',
    gap: 12,
  },
  ephemerisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 110,
  },
  ephemerisTextCol: {
    gap: 1,
  },
  ephemerisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontFamily: FONT_FAMILY,
  },
  ephemerisTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  ephemerisDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderSubtle,
  },
});

export default WeatherOverviewCard;

