import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import styles from './styles/dashboardStyles';

const { width: screenWidth } = Dimensions.get('window');

const PedometerScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [stepsToday, setStepsToday] = useState(0);
  const [liveSteps, setLiveSteps] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subscriptionRef = useRef<any>(null);

  const loadPedometerData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const available = await Pedometer.isAvailableAsync();
      setSensorAvailable(available);

      if (!available) {
        setErrorMsg('Der Schrittzähler ist auf diesem Gerät nicht verfügbar.');
        setStepsToday(0);
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      setPermissionStatus(permission.status);

      if (permission.status !== 'granted') {
        setErrorMsg('Der Zugriff auf Bewegungsdaten wurde nicht erlaubt.');
        setStepsToday(0);
        return;
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        setStepsToday(result?.steps ?? 0);
      } catch (err) {
        console.log('getStepCountAsync not available on this device:', err);
        setStepsToday(0);
        setErrorMsg('Heutige Schritte konnten auf diesem Gerät nicht geladen werden.');
      }
    } catch (err) {
      console.log('Pedometer load error:', err);
      setErrorMsg('Beim Laden des Schrittzählers ist ein Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPedometerData();

    const startLiveTracking = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) return;

        const permission = await Pedometer.requestPermissionsAsync();
        if (permission.status !== 'granted') return;

        subscriptionRef.current = Pedometer.watchStepCount((result) => {
          setLiveSteps(result?.steps ?? 0);
        });
      } catch (err) {
        console.log('Live pedometer error:', err);
      }
    };

    startLiveTracking();

    return () => {
      subscriptionRef.current?.remove?.();
    };
  }, [loadPedometerData]);

  const permissionLabel =
    permissionStatus === 'granted'
      ? 'Erlaubt'
      : permissionStatus === 'denied'
      ? 'Verweigert'
      : 'Unbekannt';

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F7F4',
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={[styles.font, { marginTop: 12, color: '#2F3E34' }]}>
          Schrittzähler wird geladen...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
    >
      <View style={styles.topSection}>
        <View style={styles.dateRow}>
          <View
            style={[
              styles.calIconBtn,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={[styles.date, styles.font, { marginRight: 6 }]}>
              Schrittzähler Test
            </Text>
            <Ionicons name="walk-outline" size={22} color="#2F3E34" />
          </View>
        </View>

        <Text
          style={[
            styles.font,
            {
              textAlign: 'center',
              color: '#6B7280',
              marginTop: 8,
            },
          ]}
        >
          Hier kannst du prüfen, ob dein Gerät Schritte korrekt erkennt.
        </Text>

        <View style={styles.hr} />

        {errorMsg ? (
          <View style={styles.expiredWarningContainer}>
            <Ionicons
              name="information-circle"
              size={22}
              color="#DC2626"
              style={styles.expiredWarningIcon}
            />
            <View style={styles.expiredWarningContent}>
              <Text style={[styles.font, styles.expiredWarningTitle]}>
                Hinweis
              </Text>
              <Text style={[styles.font, styles.expiredWarningText]}>{errorMsg}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.metricsRow}>
          <View style={styles.metricSide}>
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons
                name="sensors"
                size={screenWidth < 380 ? 22 : 24}
                color="#55805c"
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.metricSideValue, styles.font]}>
                {sensorAvailable ? 'Ja' : 'Nein'}
              </Text>
              <Text style={[styles.metricSideLabel, styles.font]}>Sensor</Text>
            </View>
          </View>

          <View style={styles.stepCircleWrapper}>
            <View style={styles.stepCircleOuter}>
              <View style={styles.stepCircleInnerRing} />
              <View style={styles.stepCircle}>
                <Text style={[styles.stepValue, styles.font]}>{stepsToday}</Text>
                <Text style={[styles.stepLabel, styles.font]}>HEUTE</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricSide}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name="shield-checkmark-outline"
                size={screenWidth < 380 ? 22 : 24}
                color="#55805c"
                style={{ marginBottom: 4 }}
              />
              <Text
                style={[
                  styles.metricSideValue,
                  styles.font,
                  {
                    fontSize: screenWidth < 380 ? 14 : 16,
                    textAlign: 'center',
                  },
                ]}
              >
                {permissionLabel}
              </Text>
              <Text style={[styles.metricSideLabel, styles.font]}>Zugriff</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={loadPedometerData}>
          <Text style={[styles.editBtnText, styles.font]}>Neu laden</Text>
        </TouchableOpacity>

        <Text style={[styles.weeklyTitle, styles.font]}>
          Live seit Öffnen: <Text style={{ color: '#5F764E' }}>{liveSteps} Schritte</Text>
        </Text>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            paddingVertical: 18,
            paddingHorizontal: 18,
            marginTop: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color="#2F3E34"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.font, { fontWeight: '700', color: '#2F3E34' }]}>
              Status
            </Text>
          </View>

          <Text style={[styles.font, { color: '#6B7280', lineHeight: 22 }]}>
            Sensor verfügbar: {String(sensorAvailable)}
          </Text>
          <Text style={[styles.font, { color: '#6B7280', lineHeight: 22 }]}>
            Berechtigung: {permissionStatus}
          </Text>
          <Text style={[styles.font, { color: '#6B7280', lineHeight: 22 }]}>
            Schritte heute: {stepsToday}
          </Text>
          <Text style={[styles.font, { color: '#6B7280', lineHeight: 22 }]}>
            Live-Schritte: {liveSteps}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PedometerScreen;