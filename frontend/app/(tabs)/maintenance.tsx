import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import useSimulation from '../../services/SimulationContext';
import MaintenanceBarChart from '../../components/MaintenanceBarChart';
import MaintenanceForm from '../../components/MaintenanceForm';
import { t } from '../../services/i18n';

export default function MaintenanceScreen() {
  const { inverters, overview } = useSimulation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <View style={styles.outerWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header with Action Button */}
        <View style={styles.pageHeader}>
          <View style={styles.headerTitleCol}>
            <Text style={styles.pageTitle}>{t('maintenance.title')}</Text>
            <Text style={styles.pageSubtitle}>
              Real-time hardware performance metrics, inverter diagnostic bar charts, and incident ticketing
            </Text>
          </View>

          {/* Button to open Fault Form Modal Window */}
          <TouchableOpacity
            style={styles.openModalButton}
            onPress={() => setIsModalOpen(true)}
            accessibilityRole="button"
          >
            <Feather name="file-text" size={16} color={Colors.bgSurface} />
            <Text style={styles.openModalButtonText}>Report Fault / Incident</Text>
          </TouchableOpacity>
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
      </ScrollView>

      {/* Floating Action Button for easy access when scrolled */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setIsModalOpen(true)}
        accessibilityRole="button"
      >
        <Feather name="file-plus" size={18} color={Colors.bgSurface} />
        <Text style={styles.fabButtonText}>Log Report</Text>
      </TouchableOpacity>

      {/* Modal Dialog Window for Maintenance Form */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWindow}>
            {/* Modal Title Bar */}
            <View style={styles.modalTitleBar}>
              <View style={styles.modalTitleRow}>
                <Feather name="tool" size={18} color={Colors.accentSky} />
                <Text style={styles.modalTitleText}>Submit Maintenance Incident Report</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsModalOpen(false)}
                accessibilityRole="button"
              >
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <MaintenanceForm onClose={() => setIsModalOpen(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
    width: '100%',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleCol: {
    gap: 4,
    flex: 1,
    minWidth: 260,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  openModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSky,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  openModalButtonText: {
    color: Colors.bgSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSky,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  fabButtonText: {
    color: Colors.bgSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  equipmentBox: {
    flex: 1,
    minWidth: 160,
    backgroundColor: Colors.bgBase,
    padding: 14,
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
    fontSize: 13,
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
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  equipmentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.batteryHealthy,
    marginTop: 2,
  },
  // Modal Window Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalWindow: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    maxWidth: 720,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.bgBase,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 6,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
});
