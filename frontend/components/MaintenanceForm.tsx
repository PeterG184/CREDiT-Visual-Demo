import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Colors from '../constants/colors';
import { UrgencyLevel, MaintenanceReportPayload } from '../types/microgrid';
import ApiService from '../services/api';
import { t } from '../services/i18n';

// Fault options categorized by equipment ID
const EQUIPMENT_OPTIONS = [
  { id: 'solis_inverters', label: 'Solis Inverters (1 & 2)' },
  { id: 'pv_array', label: 'PV Panels Array (50.3 kWp)' },
  { id: 'dyness_ess', label: 'Dyness Battery Towers' },
  { id: 'sunsynk_inverter', label: 'Sunsynk Battery Inverter' },
  { id: 'weather_station', label: 'Weather Station' },
  { id: 'wiring_bos', label: 'Balance of System / Wiring' },
];

const FAULT_OPTIONS: Record<string, string[]> = {
  solis_inverters: [
    'PV String Underperformance / Variance',
    'DC Isolation Fault (PV-ISO-ERR)',
    'Grid Overvoltage (OV-G-V01)',
    'Inverter Over-temperature',
    'String Disconnect Trip',
  ],
  pv_array: [
    'Physical Glass Damage / Cracking',
    'Severe Soiling / Dust Accumulation',
    'Vegetation Shading',
    'MC4 Connector Corrosion',
  ],
  dyness_ess: [
    'Cell Voltage Imbalance',
    'High Internal Temperature (>45°C)',
    'BMS Communication Timeout',
    'Short Circuit Protection Trip',
  ],
  sunsynk_inverter: [
    'Inverter Lockout / Grid Trip',
    'AC/DC Coupling Fault',
    'Battery Communication Lost',
  ],
  weather_station: [
    'Anemometer Jammed / Stalled',
    'Pyranometer Lens Soiled',
    'Telemetry Disconnected',
  ],
  wiring_bos: [
    'Ground Fault Indicator Active',
    'AC Breaker Tripped',
    'Conduit Physical Damage',
  ],
};

interface MaintenanceFormProps {
  onClose?: () => void;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ onClose }) => {
  const [techName, setTechName] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().replace('T', ' ').substring(0, 16)
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['solis_inverters']);
  const [equipmentOther, setEquipmentOther] = useState<string>('');
  const [selectedFaults, setSelectedFaults] = useState<string[]>([
    'PV String Underperformance / Variance',
  ]);
  const [faultOther, setFaultOther] = useState<string>('');
  const [mockFileName, setMockFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successReport, setSuccessReport] = useState<{
    reportId: string;
    computedUrgency: string;
    message: string;
  } | null>(null);

  // Compute urgency dynamically
  const computeUrgency = (): UrgencyLevel => {
    // HIGH urgency criteria
    if (
      selectedEquipment.includes('dyness_ess') ||
      selectedEquipment.includes('sunsynk_inverter') ||
      selectedFaults.some(
        (f) =>
          f.includes('BMS') ||
          f.includes('Lockout') ||
          f.includes('Short Circuit') ||
          f.includes('Isolation Fault')
      )
    ) {
      return 'HIGH';
    }

    // MEDIUM urgency criteria
    if (
      selectedEquipment.includes('solis_inverters') ||
      selectedFaults.some(
        (f) => f.includes('Variance') || f.includes('Over-temperature') || f.includes('String')
      )
    ) {
      return 'MEDIUM';
    }

    // LOW urgency
    return 'LOW';
  };

  const urgency = computeUrgency();

  const handleToggleEquipment = (eqId: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const handleToggleFault = (fault: string) => {
    setSelectedFaults((prev) =>
      prev.includes(fault) ? prev.filter((f) => f !== fault) : [...prev, fault]
    );
  };

  const handleMockFileSelect = () => {
    // Mock file upload picker
    setMockFileName('solis_inverter_heatsink_photo.jpg (2.4 MB)');
  };

  const handleSubmit = async () => {
    if (!techName.trim()) {
      alert('Please enter technician name.');
      return;
    }

    setSubmitting(true);
    const payload: MaintenanceReportPayload = {
      technicianName: techName,
      incidentTimestamp: incidentDate,
      equipmentIds: selectedEquipment,
      equipmentOtherDetails: equipmentOther,
      faultTypes: selectedFaults,
      faultOtherDetails: faultOther,
      photoUrl: mockFileName || undefined,
      computedUrgency: urgency,
    };

    const res = await ApiService.submitMaintenanceReport(payload);
    setSuccessReport({
      reportId: res.reportId,
      computedUrgency: res.computedUrgency,
      message: res.message,
    });
    setSubmitting(false);
  };

  // Aggregate available fault options from selected equipment
  const availableFaults: string[] = [];
  selectedEquipment.forEach((eqId) => {
    const faults = FAULT_OPTIONS[eqId] || [];
    faults.forEach((f) => {
      if (!availableFaults.includes(f)) availableFaults.push(f);
    });
  });

  return (
    <View style={styles.card}>
      <Text style={styles.formTitle}>{t('maintenance.form.title')}</Text>

      {/* Success Banner */}
      {successReport && (
        <View style={styles.successBanner}>
          <View style={styles.successDot} />
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>
              Report #{successReport.reportId} Logged Successfully
            </Text>
            <Text style={styles.successBody}>{successReport.message}</Text>
            <Text style={styles.successUrgency}>
              Urgency: {successReport.computedUrgency}
            </Text>
            {onClose && (
              <TouchableOpacity style={styles.closeWindowSuccessBtn} onPress={onClose}>
                <Text style={styles.closeWindowSuccessText}>Done / Close Window</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Field: Technician Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('maintenance.form.techName')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('maintenance.form.techPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          value={techName}
          onChangeText={setTechName}
        />
      </View>

      {/* Field: Incident Timestamp */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('maintenance.form.incidentDate')}</Text>
        <TextInput
          style={styles.input}
          value={incidentDate}
          onChangeText={setIncidentDate}
        />
      </View>

      {/* Field: Equipment Checkbox Group */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('maintenance.form.equipmentSelect')} *</Text>
        <View style={styles.checkboxGrid}>
          {EQUIPMENT_OPTIONS.map((item) => {
            const isChecked = selectedEquipment.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.checkboxItem, isChecked && styles.checkboxItemChecked]}
                onPress={() => handleToggleEquipment(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
              >
                <View style={[styles.box, isChecked && styles.boxChecked]}>
                  {isChecked && <View style={styles.boxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Other Equipment Notes */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('maintenance.form.otherEquipment')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Inverter 2 heat sink dirty, cable conduit loose"
          placeholderTextColor={Colors.textMuted}
          value={equipmentOther}
          onChangeText={setEquipmentOther}
        />
      </View>

      {/* Field: Dynamic Specific Faults */}
      {availableFaults.length > 0 && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {t('maintenance.form.faultSelect')} (Filtered by Selected Equipment)
          </Text>
          <View style={styles.checkboxGrid}>
            {availableFaults.map((fault) => {
              const isChecked = selectedFaults.includes(fault);
              return (
                <TouchableOpacity
                  key={fault}
                  style={[styles.checkboxItem, isChecked && styles.checkboxItemChecked]}
                  onPress={() => handleToggleFault(fault)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                >
                  <View style={[styles.box, isChecked && styles.boxChecked]}>
                    {isChecked && <View style={styles.boxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{fault}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Other Fault Notes */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('maintenance.form.otherFault')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Inverter cooling fan humming, temperature sensor reading erratic"
          placeholderTextColor={Colors.textMuted}
          value={faultOther}
          onChangeText={setFaultOther}
        />
      </View>

      {/* Field: Photo Upload (Mocked) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('maintenance.form.photoUpload')}</Text>
        <View style={styles.uploadRow}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleMockFileSelect}
            accessibilityRole="button"
          >
            <Text style={styles.uploadButtonText}>{t('maintenance.form.photoButton')}</Text>
          </TouchableOpacity>
          {mockFileName ? (
            <Text style={styles.fileNameText}>Selected: {mockFileName}</Text>
          ) : (
            <Text style={styles.noFileText}>No file chosen (Mock feature)</Text>
          )}
        </View>
      </View>

      {/* System Urgency Level Preview */}
      <View style={styles.urgencyContainer}>
        <Text style={styles.urgencyLabel}>{t('maintenance.form.urgency')}:</Text>
        <View
          style={[
            styles.urgencyBadge,
            urgency === 'HIGH'
              ? styles.urgencyHigh
              : urgency === 'MEDIUM'
              ? styles.urgencyMedium
              : styles.urgencyLow,
          ]}
        >
          <View
            style={[
              styles.urgencyDot,
              {
                backgroundColor:
                  urgency === 'HIGH'
                    ? Colors.alertDanger
                    : urgency === 'MEDIUM'
                    ? Colors.alertWarning
                    : Colors.batteryHealthy,
              },
            ]}
          />
          <Text style={styles.urgencyValue}>{urgency}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        {onClose && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.submitButton,
            onClose && { flex: 1 },
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : t('maintenance.form.submitButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.batterySubtle,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.batteryHealthy,
    gap: 10,
    alignItems: 'flex-start',
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.batteryHealthy,
    marginTop: 4,
  },
  successContent: {
    flex: 1,
    gap: 2,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  successBody: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  successUrgency: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.bgBase,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  checkboxGrid: {
    gap: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  checkboxItemChecked: {
    borderColor: Colors.accentSky,
    backgroundColor: Colors.accentSkySubtle,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxChecked: {
    borderColor: Colors.accentSky,
    backgroundColor: Colors.accentSky,
  },
  boxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.bgSurface,
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  uploadButton: {
    backgroundColor: Colors.bgBase,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fileNameText: {
    fontSize: 12,
    color: Colors.accentSky,
    fontWeight: '600',
  },
  noFileText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgBase,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  urgencyHigh: {
    backgroundColor: Colors.alertDangerSubtle,
    borderColor: Colors.alertDanger,
  },
  urgencyMedium: {
    backgroundColor: Colors.alertWarningSubtle,
    borderColor: Colors.alertWarning,
  },
  urgencyLow: {
    backgroundColor: Colors.batterySubtle,
    borderColor: Colors.batteryHealthy,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.accentSky,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.bgSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  closeWindowSuccessBtn: {
    backgroundColor: Colors.batteryHealthy,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  closeWindowSuccessText: {
    color: Colors.bgSurface,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MaintenanceForm;

