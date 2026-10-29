import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FONT_FAMILY } from '../constants/typography';
import { DailyWeatherForecast } from '../types/microgrid';

interface SevenDayOutlookProps {
  outlook: DailyWeatherForecast[];
}

export const SevenDayOutlook: React.FC<SevenDayOutlookProps> = ({ outlook }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.cardTitle}>7-Day Microgrid Weather & Solar Outlook</Text>
          <Text style={styles.cardSubtitle}>
            Synoptic forecast and estimated daily energy generation potential for forward planning
          </Text>
        </View>
        <View style={styles.badge}>
          <Feather name="calendar" size={12} color={Colors.accentSky} />
          <Text style={styles.badgeText}>Weekly Plan</Text>
        </View>
      </View>

      <View style={styles.daysList}>
        {outlook.map((day, idx) => {
          const isToday = idx === 0;

          return (
            <View
              key={day.date}
              style={[
                styles.dayRow,
                isToday && styles.dayRowToday,
              ]}
            >
              {/* Day Identifier */}
              <View style={styles.dayCol}>
                <View style={styles.dayTitleRow}>
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {day.dayName}
                  </Text>
                  {isToday && (
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>TODAY</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dayDateText}>{day.date}</Text>
              </View>

              {/* Weather Condition */}
              <View style={styles.conditionCol}>
                <View style={styles.conditionRow}>
                  <Feather
                    name={
                      day.conditionIcon === 'cloud-rain'
                        ? 'cloud-rain'
                        : day.conditionIcon === 'cloud'
                        ? 'cloud'
                        : day.conditionIcon === 'wind'
                        ? 'wind'
                        : 'sun'
                    }
                    size={18}
                    color={
                      day.conditionIcon === 'cloud-rain'
                        ? Colors.accentSky
                        : day.conditionIcon === 'cloud'
                        ? Colors.textSecondary
                        : Colors.sunPrimary
                    }
                  />
                  <Text style={styles.conditionText}>{day.conditionLabel}</Text>
                </View>
                <Text style={styles.suitabilityText}>{day.operationalSuitability}</Text>
              </View>

              {/* Temperature Range */}
              <View style={styles.tempCol}>
                <Text style={styles.highTempText}>{Math.round(day.highTempCelsius)}°</Text>
                <Text style={styles.tempDividerText}>/</Text>
                <Text style={styles.lowTempText}>{Math.round(day.lowTempCelsius)}°C</Text>
              </View>

              {/* Precipitation & Wind */}
              <View style={styles.envCol}>
                <View style={styles.envItem}>
                  <Feather
                    name="droplet"
                    size={11}
                    color={day.rainProbabilityPercent > 15 ? Colors.accentSky : Colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.envText,
                      day.rainProbabilityPercent > 15 && { color: Colors.accentSky, fontWeight: '700' },
                    ]}
                  >
                    {day.rainProbabilityPercent}%
                  </Text>
                </View>
                <View style={styles.envItem}>
                  <Feather name="wind" size={11} color={Colors.textSecondary} />
                  <Text style={styles.envText}>{day.windSpeedMaxMs} m/s</Text>
                </View>
              </View>

              {/* Solar Potential Rating & kWh Badge */}
              <View style={styles.yieldCol}>
                <View
                  style={[
                    styles.yieldBadge,
                    day.yieldRating === 'EXCELLENT'
                      ? styles.yieldExcellent
                      : day.yieldRating === 'GOOD'
                      ? styles.yieldGood
                      : styles.yieldModerate,
                  ]}
                >
                  <Text style={styles.yieldKwhText}>
                    {Math.round(day.expectedSolarYieldKwh)} kWh
                  </Text>
                  <Text
                    style={[
                      styles.yieldRatingText,
                      day.yieldRating === 'EXCELLENT'
                        ? styles.ratingTextExcellent
                        : day.yieldRating === 'GOOD'
                        ? styles.ratingTextGood
                        : styles.ratingTextModerate,
                    ]}
                  >
                    {day.yieldRating}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentSkySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentSky,
    fontFamily: FONT_FAMILY,
    textTransform: 'uppercase',
  },
  daysList: {
    gap: 10,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgBase,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexWrap: 'wrap',
    gap: 12,
  },
  dayRowToday: {
    backgroundColor: Colors.cardActiveBg,
    borderColor: Colors.cardActiveBorder,
    borderWidth: 1.5,
  },
  dayCol: {
    minWidth: 100,
    gap: 2,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  dayNameToday: {
    color: Colors.cardActiveBorder,
  },
  todayPill: {
    backgroundColor: Colors.cardActiveBorder,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todayPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.bgSurface,
    fontFamily: FONT_FAMILY,
  },
  dayDateText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  conditionCol: {
    flex: 2,
    minWidth: 180,
    gap: 2,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  suitabilityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  tempCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 70,
  },
  highTempText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  tempDividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: FONT_FAMILY,
  },
  lowTempText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  envCol: {
    gap: 4,
    minWidth: 60,
  },
  envItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  envText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
    fontWeight: '500',
  },
  yieldCol: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  yieldBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'flex-end',
    gap: 1,
  },
  yieldExcellent: {
    backgroundColor: Colors.batterySubtle,
    borderColor: Colors.batteryHealthy,
  },
  yieldGood: {
    backgroundColor: Colors.accentSkySubtle,
    borderColor: Colors.accentSky,
  },
  yieldModerate: {
    backgroundColor: Colors.sunSubtle,
    borderColor: Colors.sunPrimary,
  },
  yieldKwhText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  yieldRatingText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  ratingTextExcellent: {
    color: Colors.batteryHealthy,
  },
  ratingTextGood: {
    color: Colors.accentSky,
  },
  ratingTextModerate: {
    color: Colors.sunPrimary,
  },
});

export default SevenDayOutlook;

