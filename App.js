import React from 'react';
import { SafeAreaView } from 'react-native';
import MemeSwiper from './src/components/MemeSwiper';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MemeSwiper />
    </SafeAreaView>
  );
}
