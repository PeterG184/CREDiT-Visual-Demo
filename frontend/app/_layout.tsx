import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/colors';
import Header from '../components/Header';
import { SimulationProvider } from '../services/SimulationContext';

export default function RootLayout() {
  return (
    <SimulationProvider>
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="dark" />
        <View style={styles.appShell}>
          <Header />
          <View style={styles.contentArea}>
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </SimulationProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  appShell: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.bgBase,
  },
  contentArea: {
    flex: 1,
  },
});
