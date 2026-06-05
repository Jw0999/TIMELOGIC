import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(dotOpacity,  { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <Animated.View style={[s.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={s.logoCircle}>
          <Image source={require('../../assets/logo.jpg')} style={s.logo} resizeMode="contain" />
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={s.appName}>TimeLogic</Text>
        <Text style={s.tagline}>Smart. Secure. Reliable.</Text>
      </Animated.View>
      <Animated.View style={[s.dotsRow, { opacity: dotOpacity }]}>
        {[0, 1, 2].map((i) => <View key={i} style={s.dot} />)}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  logoWrap:    { marginBottom: 24 },
  logoCircle:  { width: 104, height: 104, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logo:        { width: 80, height: 80 },
  appName:     { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 1 },
  tagline:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 6 },
  dotsRow:     { flexDirection: 'row', marginTop: 48, gap: 8 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
});
