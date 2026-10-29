import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/colors';
import useSimulation from '../services/SimulationContext';
import { t, AVAILABLE_LOCALES, LocaleCode } from '../services/i18n';

export const Header: React.FC = () => {
  const {
    currentHour,
    isLiveMode,
    isLiveBackend,
    setLiveMode,
    setSimulatedHour,
    formattedTime,
    overview,
    locale,
    setLocale,
  } = useSimulation();

  const [showControls, setShowControls] = useState<boolean>(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState<boolean>(false);

  // Time preset buttons
  const presets = [
    { label: t('common.demo.live'), hour: -1, isLive: true },
    { label: t('common.demo.morning'), hour: 8.5, isLive: false },
    { label: t('common.demo.midday'), hour: 12.5, isLive: false },
    { label: t('common.demo.evening'), hour: 16.5, isLive: false },
    { label: t('common.demo.night'), hour: 21.5, isLive: false },
  ];

  const handleAdjustHour = (delta: number) => {
    let next = currentHour + delta;
    if (next < 0) next += 24;
    if (next >= 24) next -= 24;
    setSimulatedHour(Math.round(next * 2) / 2); // 30 min snap
  };

  return (
    <View style={styles.headerContainer}>
      {/* Top Banner */}
      <View style={styles.topRow}>
        <View style={styles.branding}>
          <Text style={styles.appTitle}>{t('common.appName')}</Text>
          <View style={styles.sourceBadge}>
            <View
              style={[
                styles.sourceDot,
                { backgroundColor: isLiveBackend ? Colors.batteryHealthy : Colors.accentSky },
              ]}
            />
            <Text style={styles.sourceText}>
              {isLiveBackend ? 'Backend :5678' : 'Client Simulator'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {/* System Health Badge */}
          <View
            style={[
              styles.healthBadge,
              overview.systemStatus === 'OPTIMAL'
                ? styles.healthBadgeGreen
                : styles.healthBadgeOrange,
            ]}
          >
            <View
              style={[
                styles.healthDot,
                overview.systemStatus === 'OPTIMAL' ? styles.dotGreen : styles.dotOrange,
              ]}
            />
            <Text style={styles.healthText}>
              {overview.systemStatus === 'OPTIMAL'
                ? t('common.status.normal')
                : t('common.status.warning')}
            </Text>
          </View>

          {/* Time Button Toggle */}
          <TouchableOpacity
            style={[styles.timeButton, showControls && styles.timeButtonActive]}
            onPress={() => {
              setShowControls(!showControls);
              if (showLanguageMenu) setShowLanguageMenu(false);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.timeLabel}>
              {isLiveMode ? `Live (${formattedTime})` : `Sim: ${formattedTime}`}
            </Text>
            <Feather
              name={showControls ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Language Selector Dropdown (Option 1: Far-Right Utility Position) */}
          <View style={styles.langWrapper}>
            <TouchableOpacity
              style={[styles.langButton, showLanguageMenu && styles.langButtonActive]}
              onPress={() => {
                setShowLanguageMenu(!showLanguageMenu);
                if (showControls) setShowControls(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Select language"
            >
              <Feather name="globe" size={13} color={Colors.accentSky} />
              <Text style={styles.langLabel}>
                {locale === 'ny' ? 'Chichewa' : 'English'}
              </Text>
              <Feather
                name={showLanguageMenu ? 'chevron-up' : 'chevron-down'}
                size={11}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Floating Dropdown Menu */}
            {showLanguageMenu && (
              <View style={styles.langDropdown}>
                {AVAILABLE_LOCALES.map((loc) => {
                  const isSelected = loc.code === locale;
                  return (
                    <TouchableOpacity
                      key={loc.code}
                      style={[styles.langOption, isSelected && styles.langOptionSelected]}
                      onPress={() => {
                        setLocale(loc.code);
                        setShowLanguageMenu(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.langOptionLeft}>
                        <Text
                          style={[
                            styles.langOptionCode,
                            isSelected && styles.langOptionCodeSelected,
                          ]}
                        >
                          {loc.code.toUpperCase()}
                        </Text>
                        <Text
                          style={[
                            styles.langOptionLabel,
                            isSelected && styles.langOptionLabelSelected,
                          ]}
                        >
                          {loc.nativeLabel}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={14} color={Colors.accentSky} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Expandable Simulation Controls */}
      {showControls && (
        <View style={styles.controlsPanel}>
          <View style={styles.controlsHeader}>
            <Text style={styles.controlsTitle}>{t('common.demo.title')}</Text>
            <Text style={styles.currentSimText}>
              Current: {formattedTime} {isLiveMode ? '(Real Clock)' : '(Simulated)'}
            </Text>
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetsRow}>
            {presets.map((preset, idx) => {
              const isSelected =
                (preset.isLive && isLiveMode) ||
                (!isLiveMode && Math.abs(currentHour - preset.hour) < 0.3);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.presetButton, isSelected && styles.presetButtonSelected]}
                  onPress={() => {
                    if (preset.isLive) {
                      setLiveMode(true);
                    } else {
                      setSimulatedHour(preset.hour);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      isSelected && styles.presetButtonTextSelected,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stepper buttons */}
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Adjust Time:</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleAdjustHour(-1)}
            >
              <Text style={styles.stepBtnText}>-1 hr</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleAdjustHour(-0.5)}
            >
              <Text style={styles.stepBtnText}>-30 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleAdjustHour(0.5)}
            >
              <Text style={styles.stepBtnText}>+30 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleAdjustHour(1)}
            >
              <Text style={styles.stepBtnText}>+1 hr</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 5,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  healthBadgeGreen: {
    backgroundColor: Colors.batterySubtle,
    borderWidth: 1,
    borderColor: Colors.batteryHealthy,
  },
  healthBadgeOrange: {
    backgroundColor: Colors.alertWarningSubtle,
    borderWidth: 1,
    borderColor: Colors.alertWarning,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: Colors.batteryHealthy,
  },
  dotOrange: {
    backgroundColor: Colors.alertWarning,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 6,
  },
  timeButtonActive: {
    backgroundColor: Colors.cardActiveBg,
    borderColor: Colors.cardActiveBorder,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  langWrapper: {
    position: 'relative',
    zIndex: 50,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    gap: 6,
  },
  langButtonActive: {
    backgroundColor: Colors.cardActiveBg,
    borderColor: Colors.cardActiveBorder,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  langDropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: Colors.bgSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 6,
    minWidth: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  langOptionSelected: {
    backgroundColor: Colors.accentSkySubtle,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langOptionCode: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  langOptionCodeSelected: {
    color: Colors.accentSky,
    borderColor: Colors.accentSky,
  },
  langOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  langOptionLabelSelected: {
    color: Colors.accentSky,
    fontWeight: '700',
  },
  controlsPanel: {
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 12,
    width: '100%',
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  currentSimText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetButton: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  presetButtonSelected: {
    backgroundColor: Colors.sunSubtle,
    borderColor: Colors.sunPrimary,
  },
  presetButtonText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  presetButtonTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stepperLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepBtn: {
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  stepBtnText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});

export default Header;

