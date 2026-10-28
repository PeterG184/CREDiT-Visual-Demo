import React from 'react';
import { View, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/colors';
import Header from '../components/Header';
import { SimulationProvider } from '../services/SimulationContext';

export default function RootLayout() {
  return (
    <SimulationProvider>
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="dark" />
        <View style={styles.desktopShell}>
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
    backgroundColor: '#E2E8F0', // Neutral backdrop for desktop frame
  },
  desktopShell: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
    backgroundColor: Colors.bgBase,
    // Tablet/Desktop elevation shadow
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      default: {},
    }),
  },
  contentArea: {
    flex: 1,
  },
});
