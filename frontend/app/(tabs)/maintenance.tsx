import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/colors';
import useSimulation from '../../services/SimulationContext';
import MaintenanceBarChart from '../../components/MaintenanceBarChart';
import MaintenanceForm from '../../components/MaintenanceForm';
import { t } from '../../services/i18n';

export default function MaintenanceScreen() {
  const { inverters, overview } = useSimulation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('maintenance.title')}</Text>
        <Text style={styles.pageSubtitle}>
          Real-time hardware performance metrics, inverter diagnostic bar charts, and incident ticketing
        </Text>
      </View>

      {/* Equipment Site Map & Status Grid */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Physical Microgrid Topology & Equipment Status</Text>
        <View style={styles.equipmentGrid}>
          {/* PV Array */}
          <View style={styles.equipmentBox}>
            <View style={styles.equipmentBoxHeader}>
              <Text style={styles.equipmentName}>PV Array</Text>
              <View style={[styles.statusDot, styles.dotGreen]} />
            </View>
            <Text style={styles.equipmentSpec}>86 Panels / 50.3 kWp</Text>
            <Text style={styles.equipmentStatusText}>Status: Optimal (96% Yield)</Text>
          </View>

          {/* Weather Station */}
          <View style={styles.equipmentBox}>
            <View style={styles.equipmentBoxHeader}>
              <Text style={styles.equipmentName}>Weather Station</Text>
              <View style={[styles.statusDot, styles.dotGreen]} />
            </View>
            <Text style={styles.equipmentSpec}>
              {overview.weatherSummary.irradiance} W/m² | {overview.weatherSummary.ambientTemp}°C
            </Text>
            <Text style={styles.equipmentStatusText}>Telemetry: Active</Text>
          </View>

          {/* Solis Inverter 1 */}
          <View style={styles.equipmentBox}>
            <View style={styles.equipmentBoxHeader}>
              <Text style={styles.equipmentName}>Inverter 1 (Solis 17kW)</Text>
              <View style={[styles.statusDot, styles.dotGreen]} />
            </View>
            <Text style={styles.equipmentSpec}>Active: {inverters[0]?.acPowerKw.toFixed(1)} kW</Text>
            <Text style={styles.equipmentStatusText}>Status: Optimal Leeway</Text>
          </View>

          {/* Solis Inverter 2 */}
          <View style={styles.equipmentBox}>
            <View style={styles.equipmentBoxHeader}>
              <Text style={styles.equipmentName}>Inverter 2 (Solis 17kW)</Text>
              <View style={[styles.statusDot, styles.dotYellow]} />
            </View>
            <Text style={styles.equipmentSpec}>Active: {inverters[1]?.acPowerKw.toFixed(1)} kW</Text>
            <Text style={[styles.equipmentStatusText, { color: Colors.alertWarning }]}>
              Status: Minor Variance (-{inverters[1]?.variancePercent}%)
            </Text>
          </View>

          {/* Sunsynk Inverter */}
          <View style={styles.equipmentBox}>
            <View style={styles.equipmentBoxHeader}>
              <Text style={styles.equipmentName}>Battery Inverter</Text>
              <View style={[styles.statusDot, styles.dotGreen]} />
            </View>
            <Text style={styles.equipmentSpec}>Sunsynk 20kW</Text>
            <Text style={styles.equipmentStatusText}>AC/DC Coupling: OK</Text>
          </View>

          {/* Dyness ESS */}
          <View style={styles.equipmentBox}>
            <View style={styles.equipmentBoxHeader}>
              <Text style={styles.equipmentName}>Dyness ESS Towers</Text>
              <View style={[styles.statusDot, styles.dotGreen]} />
            </View>
            <Text style={styles.equipmentSpec}>102.4 kWh / 20 Modules</Text>
            <Text style={styles.equipmentStatusText}>Status: Balanced</Text>
          </View>
        </View>
      </View>

      {/* Inverter Diagnostic Bar Charts */}
      <MaintenanceBarChart inverters={inverters} />

      {/* Dynamic Fault Reporting Form */}
      <MaintenanceForm />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
  },
  pageHeader: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  equipmentBox: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.bgBase,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  equipmentBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipmentName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: Colors.batteryHealthy,
  },
  dotYellow: {
    backgroundColor: Colors.alertWarning,
  },
  equipmentSpec: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  equipmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.batteryHealthy,
    marginTop: 2,
  },
});

