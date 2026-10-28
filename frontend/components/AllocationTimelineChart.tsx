import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import Colors from '../constants/colors';
import { LoadAllocationItem } from '../types/microgrid';
import { t } from '../services/i18n';

interface AllocationTimelineChartProps {
  items: LoadAllocationItem[];
  currentHour: number;
  activeView: 'planned' | 'adjusted';
  onToggleView: (view: 'planned' | 'adjusted') => void;
  algorithmNotes?: string;
}

export const AllocationTimelineChart: React.FC<AllocationTimelineChartProps> = ({
  items,
  currentHour,
  activeView,
  onToggleView,
  algorithmNotes,
}) => {
  // SVG Graphic Dimensions
  const svgWidth = 640;
  const paddingLeft = 140; // Label space for activity names
  const paddingRight = 20;
  const paddingTop = 15;
  const rowHeight = 32;
  const timelineAxisHeight = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const totalRows = items.length;
  const svgHeight = paddingTop + totalRows * rowHeight + timelineAxisHeight;

  // Helper to convert HH:MM to decimal hour (0-24)
  const timeToHour = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
  };

  const getX = (hour: number) => {
    const clamped = Math.max(0, Math.min(24, hour));
    return paddingLeft + (clamped / 24) * chartWidth;
  };

  // Current time vertical indicator
  const clampedNow = Math.max(0, Math.min(24, currentHour));
  const currentNowX = getX(clampedNow);

  // Timeline axis hour ticks
  const hourTicks = [0, 4, 8, 12, 16, 20, 24];

  return (
    <View style={styles.card}>
      {/* Top Controls: Toggle Between Standard Plan and Today's Live Schedule */}
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{t('allocation.title')}</Text>
          <Text style={styles.subtitle}>
            {activeView === 'adjusted'
              ? 'Weather-optimized load schedule for peak solar utilization'
              : 'Static baseline reference schedule (235 kWh/day)'}
          </Text>
        </View>

        {/* Segmented Control Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeView === 'planned' && styles.toggleBtnActive]}
            onPress={() => onToggleView('planned')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeView === 'planned' && styles.toggleBtnTextActive,
              ]}
            >
              {t('allocation.standardPlan')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeView === 'adjusted' && styles.toggleBtnActive]}
            onPress={() => onToggleView('adjusted')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeView === 'adjusted' && styles.toggleBtnTextActive,
              ]}
            >
              {t('allocation.liveSchedule')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Adjustment Notice Banner (if Live Schedule) */}
      {activeView === 'adjusted' && algorithmNotes ? (
        <View style={styles.noticeBanner}>
          <View style={styles.noticeDot} />
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>{t('allocation.adjustedNotice')}</Text>
            <Text style={styles.noticeBody}>{algorithmNotes}</Text>
          </View>
        </View>
      ) : null}

      {/* Graphic Section: Activities positioned immediately above bottom 24h timeline */}
      <View style={styles.graphicSection}>
        <Text style={styles.sectionHeader}>{t('allocation.timelineTitle')}</Text>
        <View style={styles.svgWrapper}>
          <Svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight}>
            {/* Background Grid Lines for each hour tick */}
            {hourTicks.map((h) => {
              const x = getX(h);
              return (
                <Line
                  key={h}
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + totalRows * rowHeight}
                  stroke={Colors.borderSubtle}
                  strokeWidth="1"
                />
              );
            })}

            {/* Render Each Activity Row and its Scheduled Time Block */}
            {items.map((item, index) => {
              const startStr = item.actualStartTime || item.plannedStartTime;
              const endStr = item.actualEndTime || item.plannedEndTime;
              const startH = timeToHour(startStr);
              const endH = timeToHour(endStr);

              const blockX = getX(startH);
              const blockWidth = Math.max(8, getX(endH) - blockX);
              const y = paddingTop + index * rowHeight;
              const blockY = y + 4;
              const blockHeight = rowHeight - 8;

              const isActive = item.isActiveNow;
              const isAdjusted = item.isAdjusted;

              // Row background highlight for active item
              return (
                <G key={item.id}>
                  {isActive && (
                    <Rect
                      x={0}
                      y={y}
                      width={svgWidth}
                      height={rowHeight}
                      fill={Colors.cardActiveBg}
                      rx={4}
                    />
                  )}

                  {/* Activity Name Label (Left column) */}
                  <SvgText
                    x={paddingLeft - 10}
                    y={y + 19}
                    fill={isActive ? Colors.textPrimary : Colors.textSecondary}
                    fontSize="11"
                    fontWeight={isActive ? '700' : '500'}
                    textAnchor="end"
                  >
                    {item.activityName.length > 18
                      ? `${item.activityName.substring(0, 16)}...`
                      : item.activityName}
                  </SvgText>

                  {/* Scheduled Block Bar */}
                  <Rect
                    x={blockX}
                    y={blockY}
                    width={blockWidth}
                    height={blockHeight}
                    rx={4}
                    fill={
                      isActive
                        ? Colors.accentSky
                        : isAdjusted
                        ? Colors.sunPrimary
                        : Colors.borderStrong
                    }
                    stroke={isActive ? Colors.cardActiveBorder : 'none'}
                    strokeWidth={isActive ? 2 : 0}
                  />

                  {/* Block Label (Inside or beside bar) */}
                  <SvgText
                    x={blockX + 6}
                    y={blockY + 15}
                    fill={isActive || isAdjusted ? Colors.bgSurface : Colors.textPrimary}
                    fontSize="10"
                    fontWeight="600"
                  >
                    {`${item.powerDemandKw} kW`}
                  </SvgText>
                </G>
              );
            })}

            {/* Current Time Vertical Line passing through all blocks down to axis */}
            <Line
              x1={currentNowX}
              y1={paddingTop}
              x2={currentNowX}
              y2={paddingTop + totalRows * rowHeight + 10}
              stroke={Colors.alertDanger}
              strokeWidth="2"
            />
            <SvgText
              x={currentNowX}
              y={paddingTop + totalRows * rowHeight + 22}
              fill={Colors.alertDanger}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              NOW
            </SvgText>

            {/* Bottom 24-Hour Timeline Axis */}
            <Line
              x1={paddingLeft}
              y1={paddingTop + totalRows * rowHeight}
              x2={svgWidth - paddingRight}
              y2={paddingTop + totalRows * rowHeight}
              stroke={Colors.textPrimary}
              strokeWidth="1.5"
            />

            {/* Timeline Hour Marks & Labels along the bottom */}
            {hourTicks.map((h) => {
              const x = getX(h);
              const label = `${String(h).padStart(2, '0')}:00`;
              return (
                <G key={h}>
                  <Line
                    x1={x}
                    y1={paddingTop + totalRows * rowHeight}
                    x2={x}
                    y2={paddingTop + totalRows * rowHeight + 5}
                    stroke={Colors.textPrimary}
                    strokeWidth="1.5"
                  />
                  <SvgText
                    x={x}
                    y={paddingTop + totalRows * rowHeight + 18}
                    fill={Colors.textSecondary}
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* Table Style View Section */}
      <View style={styles.tableSection}>
        <Text style={styles.sectionHeader}>Schedule Activity Details</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colPriority]}>{t('allocation.table.priority')}</Text>
              <Text style={[styles.th, styles.colActivity]}>{t('allocation.table.activity')}</Text>
              <Text style={[styles.th, styles.colWindow]}>{t('allocation.table.window')}</Text>
              <Text style={[styles.th, styles.colLoad]}>{t('allocation.table.load')}</Text>
              <Text style={[styles.th, styles.colStatus]}>{t('allocation.table.status')}</Text>
            </View>

            {/* Table Body Rows */}
            {items.map((item) => {
              const startStr = item.actualStartTime || item.plannedStartTime;
              const endStr = item.actualEndTime || item.plannedEndTime;
              const isContinuous = item.priorityRank === 'CONTINUOUS';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    item.isActiveNow && styles.tableRowActive,
                    item.isAdjusted && styles.tableRowAdjusted,
                  ]}
                >
                  <View style={styles.colPriority}>
                    <View
                      style={[
                        styles.priorityBadge,
                        isContinuous
                          ? styles.priorityContinuous
                          : styles.priorityRanked,
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {isContinuous ? 'CONT' : `P${item.priorityRank}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.colActivity}>
                    <Text
                      style={[
                        styles.activityText,
                        item.isActiveNow && styles.activityTextActive,
                      ]}
                    >
                      {item.activityName}
                    </Text>
                    {item.adjustmentNote && (
                      <Text style={styles.adjustmentNoteText}>{item.adjustmentNote}</Text>
                    )}
                  </View>

                  <View style={styles.colWindow}>
                    <Text style={styles.windowText}>
                      {startStr} – {endStr}
                    </Text>
                    {item.isAdjusted && (
                      <Text style={styles.originalWindowText}>
                        (Orig: {item.plannedStartTime}–{item.plannedEndTime})
                      </Text>
                    )}
                  </View>

                  <View style={styles.colLoad}>
                    <Text style={styles.loadText}>{item.powerDemandKw} kW</Text>
                  </View>

                  <View style={styles.colStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        item.isActiveNow
                          ? styles.statusBadgeActive
                          : isContinuous
                          ? styles.statusBadgeContinuous
                          : styles.statusBadgeScheduled,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: item.isActiveNow
                              ? Colors.accentSky
                              : isContinuous
                              ? Colors.batteryHealthy
                              : Colors.textMuted,
                          },
                        ]}
                      />
                      <Text style={styles.statusBadgeText}>
                        {item.isActiveNow
                          ? 'Active Now'
                          : isContinuous
                          ? 'Continuous'
                          : 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleArea: {
    gap: 2,
    flex: 1,
    minWidth: 240,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgBase,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.bgSurface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.sunSubtle,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sunPrimary,
    marginTop: 4,
  },
  noticeTextContainer: {
    flex: 1,
    gap: 2,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noticeBody: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  graphicSection: {
    gap: 10,
    backgroundColor: Colors.bgBase,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  svgWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  tableSection: {
    gap: 10,
  },
  table: {
    minWidth: 560,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.borderStrong,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tableRowActive: {
    backgroundColor: Colors.cardActiveBg,
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  tableRowAdjusted: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.sunPrimary,
    paddingLeft: 6,
  },
  colPriority: {
    width: 60,
  },
  colActivity: {
    flex: 2,
    paddingRight: 8,
  },
  colWindow: {
    width: 140,
  },
  colLoad: {
    width: 80,
  },
  colStatus: {
    width: 110,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityRanked: {
    backgroundColor: Colors.bgBase,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  priorityContinuous: {
    backgroundColor: Colors.accentSkySubtle,
    borderWidth: 1,
    borderColor: Colors.accentSky,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  activityTextActive: {
    fontWeight: '700',
    color: Colors.cardActiveBorder,
  },
  adjustmentNoteText: {
    fontSize: 11,
    color: Colors.alertWarning,
    marginTop: 2,
  },
  windowText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  originalWindowText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  loadText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  statusBadgeActive: {
    backgroundColor: Colors.accentSkySubtle,
    borderColor: Colors.accentSky,
  },
  statusBadgeContinuous: {
    backgroundColor: Colors.batterySubtle,
    borderColor: Colors.batteryHealthy,
  },
  statusBadgeScheduled: {
    backgroundColor: Colors.bgBase,
    borderColor: Colors.borderSubtle,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default AllocationTimelineChart;

