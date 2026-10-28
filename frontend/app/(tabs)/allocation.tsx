import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/colors';
import useSimulation from '../../services/SimulationContext';
import AllocationTimelineChart from '../../components/AllocationTimelineChart';

export default function AllocationScreen() {
  const { allocations, currentHour, activeScheduleView, setActiveScheduleView } = useSimulation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <AllocationTimelineChart
        items={allocations.items}
        currentHour={currentHour}
        activeView={activeScheduleView}
        onToggleView={setActiveScheduleView}
        algorithmNotes={allocations.algorithmNotes}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  contentContainer: {
    padding: 16,
  },
});
