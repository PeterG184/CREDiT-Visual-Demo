import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import Colors from '../constants/colors';
import { FONT_FAMILY } from '../constants/typography';
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
  // Dynamic measurement so the timeline spans the full width of the card
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 200 && Math.abs(width - containerWidth) > 5) {
      setContainerWidth(width);
    }
  };

  const isMobile = containerWidth < 700;
  const paddingLeft = isMobile ? 190 : 280; // Ample width to ensure all activity names are fully on-screen
  const paddingRight = 24;
  const paddingTop = 16;
  const rowHeight = 36;
  const timelineAxisHeight = 40;
  const chartWidth = Math.max(200, containerWidth - paddingLeft - paddingRight);

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

  // Timeline axis hour ticks (every 2 hours on wide screen, every 4 on small)
  const hourTicks = containerWidth > 700
    ? [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
    : [0, 4, 8, 12, 16, 20, 24];

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

      {/* Graphic Section: Full-width 24h timeline graphic */}
      <View style={styles.graphicSection} onLayout={handleLayout}>
        <Text style={styles.sectionHeader}>{t('allocation.timelineTitle')}</Text>
        <View style={styles.svgWrapper}>
          <Svg
            viewBox={`0 0 ${containerWidth} ${svgHeight}`}
            width="100%"
            height={svgHeight}
          >
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
              const blockWidth = Math.max(12, getX(endH) - blockX);
              const y = paddingTop + index * rowHeight;
              const blockY = y + 5;
              const blockHeight = rowHeight - 10;

              const isActive = item.isActiveNow;
              const isAdjusted = item.isAdjusted;

              return (
                <G key={item.id}>
                  {/* Row background highlight for active item */}
                  {isActive && (
                    <Rect
                      x={0}
                      y={y}
                      width={containerWidth}
                      height={rowHeight}
                      fill={Colors.cardActiveBg}
                      rx={4}
                    />
                  )}

                  {/* Activity Name Label (Left-aligned from x=16 so it is NEVER off-screen) */}
                  <SvgText
                    x={16}
                    y={y + 22}
                    fill={isActive ? Colors.cardActiveBorder : Colors.textPrimary}
                    fontSize={isMobile ? '11' : '13'}
                    fontWeight={isActive ? '700' : '600'}
                    fontFamily={FONT_FAMILY}
                    textAnchor="start"
                  >
                    {isMobile && item.activityName.length > 20
                      ? `${item.activityName.substring(0, 18)}...`
                      : item.activityName}
                  </SvgText>

                  {/* Scheduled Block Bar */}
                  <Rect
                    x={blockX}
                    y={blockY}
                    width={blockWidth}
                    height={blockHeight}
                    rx={6}
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

                  {/* Block Label */}
                  <SvgText
                    x={blockX + 10}
                    y={blockY + 17}
                    fill={isActive || isAdjusted ? Colors.bgSurface : Colors.textPrimary}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily={FONT_FAMILY}
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
              y2={paddingTop + totalRows * rowHeight + 12}
              stroke={Colors.alertDanger}
              strokeWidth="2"
            />
            <SvgText
              x={currentNowX}
              y={paddingTop + totalRows * rowHeight + 25}
              fill={Colors.alertDanger}
              fontSize="10"
              fontWeight="700"
              fontFamily={FONT_FAMILY}
              textAnchor="middle"
            >
              NOW
            </SvgText>

            {/* Column separator between activity names and timeline */}
            <Line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={paddingTop + totalRows * rowHeight}
              stroke={Colors.borderStrong}
              strokeWidth="1.5"
            />

            {/* Bottom 24-Hour Timeline Axis */}
            <Line
              x1={paddingLeft}
              y1={paddingTop + totalRows * rowHeight}
              x2={containerWidth - paddingRight}
              y2={paddingTop + totalRows * rowHeight}
              stroke={Colors.textPrimary}
              strokeWidth="2"
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
                    y2={paddingTop + totalRows * rowHeight + 6}
                    stroke={Colors.textPrimary}
                    strokeWidth="1.5"
                  />
                  <SvgText
                    x={x}
                    y={paddingTop + totalRows * rowHeight + 20}
                    fill={Colors.textSecondary}
                    fontSize="11"
                    fontFamily={FONT_FAMILY}
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

      {/* Schedule Activity Details: Stacked Cards for Mobile, 5-Column Table for Desktop */}
      <View style={styles.tableSection}>
        <Text style={styles.sectionHeader}>Schedule Activity Details</Text>

        {isMobile ? (
          /* Mobile Option 1: High-Contrast Stacked Activity Cards */
          <View style={styles.mobileCardsList}>
            {items.map((item) => {
              const startStr = item.actualStartTime || item.plannedStartTime;
              const endStr = item.actualEndTime || item.plannedEndTime;
              const isContinuous = item.priorityRank === 'CONTINUOUS';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.mobileCard,
                    item.isActiveNow && styles.mobileCardActive,
                    item.isAdjusted && styles.mobileCardAdjusted,
                  ]}
                >
                  {/* Top Row: Priority Pill + Activity Name + Status Badge */}
                  <View style={styles.mobileCardTopRow}>
                    <View style={styles.mobileCardHeaderLeft}>
                      <View
                        style={[
                          styles.priorityBadge,
                          isContinuous ? styles.priorityContinuous : styles.priorityRanked,
                        ]}
                      >
                        <Text style={styles.priorityText}>
                          {isContinuous ? 'CONT' : `P${item.priorityRank}`}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.mobileActivityName,
                          item.isActiveNow && styles.mobileActivityNameActive,
                        ]}
                      >
                        {item.activityName}
                      </Text>
                    </View>

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

                  {/* Middle Row: Operating Window & Power Load Demand */}
                  <View style={styles.mobileCardMiddleRow}>
                    <View style={styles.mobileWindowBox}>
                      <Text style={styles.mobileMetaLabel}>Operating Window</Text>
                      <Text style={styles.mobileWindowText}>
                        {startStr} – {endStr}
                      </Text>
                      {item.isAdjusted && (
                        <Text style={styles.mobileOrigWindowText}>
                          Baseline: {item.plannedStartTime}–{item.plannedEndTime}
                        </Text>
                      )}
                    </View>

                    <View style={styles.mobileLoadBox}>
                      <Text style={styles.mobileMetaLabel}>Power Demand</Text>
                      <Text style={styles.mobileLoadText}>{item.powerDemandKw} kW</Text>
                    </View>
                  </View>

                  {/* Bottom Row: Dynamic Adjustment Callout */}
                  {item.adjustmentNote && (
                    <View style={styles.mobileAdjustmentCallout}>
                      <View style={styles.adjustmentDot} />
                      <Text style={styles.mobileAdjustmentText}>{item.adjustmentNote}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* Desktop: Full-Width 5-Column Table */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tableScrollContent}
          >
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
                          (Baseline: {item.plannedStartTime}–{item.plannedEndTime})
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
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleArea: {
    gap: 4,
    flex: 1,
    minWidth: 260,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgBase,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  toggleBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.sunSubtle,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
    gap: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  noticeBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  graphicSection: {
    gap: 12,
    backgroundColor: Colors.bgBase,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    width: '100%',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  svgWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  tableSection: {
    gap: 12,
    width: '100%',
  },
  tableScrollContent: {
    width: '100%',
  },
  table: {
    width: '100%',
    minWidth: 700,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.borderStrong,
    alignItems: 'center',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tableRowActive: {
    backgroundColor: Colors.cardActiveBg,
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  tableRowAdjusted: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.sunPrimary,
    paddingLeft: 8,
  },
  colPriority: {
    flex: 0.8,
    minWidth: 70,
  },
  colActivity: {
    flex: 2.5,
    minWidth: 200,
    paddingRight: 12,
  },
  colWindow: {
    flex: 1.6,
    minWidth: 150,
  },
  colLoad: {
    flex: 1,
    minWidth: 90,
  },
  colStatus: {
    flex: 1.4,
    minWidth: 130,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontFamily: FONT_FAMILY,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  activityTextActive: {
    fontWeight: '700',
    color: Colors.cardActiveBorder,
  },
  adjustmentNoteText: {
    fontSize: 11,
    color: Colors.alertWarning,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  windowText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  originalWindowText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  loadText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  // Mobile Option 1: Activity Cards Stack Styles
  mobileCardsList: {
    gap: 12,
    width: '100%',
  },
  mobileCard: {
    backgroundColor: Colors.bgBase,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  mobileCardActive: {
    backgroundColor: Colors.cardActiveBg,
    borderColor: Colors.cardActiveBorder,
    borderWidth: 1.5,
  },
  mobileCardAdjusted: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.sunPrimary,
  },
  mobileCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 180,
  },
  mobileActivityName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
  mobileActivityNameActive: {
    color: Colors.cardActiveBorder,
  },
  mobileCardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 12,
  },
  mobileWindowBox: {
    gap: 2,
    flex: 1,
  },
  mobileMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  mobileWindowText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  mobileOrigWindowText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  mobileLoadBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mobileLoadText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accentSky,
    fontFamily: FONT_FAMILY,
  },
  mobileAdjustmentCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sunSubtle,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.sunPrimary,
    gap: 8,
  },
  adjustmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sunPrimary,
  },
  mobileAdjustmentText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontFamily: FONT_FAMILY,
    flex: 1,
  },
});

export default AllocationTimelineChart;
