import Feather from '@expo/vector-icons/Feather';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Dashboard = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // demo data
  const stepsToday = 227;
  const kcal = 29;
  const distance = 0.15;
  const weeklySteps = [12, 145, 162, 180, 227, 110, 80];
  const weeklyMax = Math.max(...weeklySteps);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* DATE + CHALLENGE (blended with background) */}
        <View style={styles.topSection}>
          <Text style={[styles.date, styles.font]}>{currentDate}</Text>
          <View style={styles.hr} />

          <Text style={[styles.challengeRow, styles.font]}>
            <Text style={styles.challengeLabel}>Challenge: </Text>
            Graz → Wien <Text style={styles.challengeMeta}>(180 Km)</Text>
          </Text>

          {/* METRICS */}
          <View style={styles.metricsRow}>
            {/* kcal */}
            <View style={styles.metricSide}>
              <Feather name="flame" size={18} color="#E25822" style={{ marginBottom: 4 }} />
              <Text style={[styles.metricSideValue, styles.font]}>{kcal}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>Kcal</Text>
            </View>

            {/* step ring (lighter original look) */}
            <View style={styles.stepCircleWrapper}>
              <View style={styles.stepCircleOuter}>
                <View style={styles.stepCircleInnerRing} />
                <View style={styles.stepCircle}>
                  <Text style={[styles.stepValue, styles.font]}>{stepsToday}</Text>
                  <Text style={[styles.stepLabel, styles.font]}>SCHRITTE</Text>
                </View>
              </View>
            </View>

            {/* distance */}
            <View style={[styles.metricSide, { alignItems: 'flex-start' }]}>
              <Feather name="map-pin" size={18} color="#7FA58C" style={{ marginBottom: 4, alignSelf: 'center' }} />
              <Text style={[styles.metricSideValue, styles.font]}>{distance}</Text>
              <Text style={[styles.metricSideLabel, styles.font]}>km</Text>
            </View>
          </View>

          {/* EDIT BTN */}
          <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
            <Text style={[styles.editBtnText, styles.font]}>Schritte bearbeiten</Text>
          </TouchableOpacity>

          {/* WEEKLY SUMMARY */}
          <Text style={[styles.weeklyTitle, styles.font]}>
            Diese Woche: <Text style={{ color: '#5F764E' }}>{stepsToday} Schritte</Text>
          </Text>

          {/* WEEKLY BAR CHART (all bars same color) */}
          <View style={styles.weekChart}>
            {weeklySteps.map((value, i) => {
              const height = (value / weeklyMax) * 120;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height }]} />
                  </View>
                  <Text style={[styles.dayLabel, styles.font]}>
                    {['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'][i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* CHALLENGE PROGRESS (scrolled view) */}
        <View style={styles.progressCard}>
          <Text style={[styles.progressTitle, styles.font]}>
            <Text style={{ color: '#5F764E', fontWeight: '700' }}>Challenge </Text>Fortschritte
          </Text>

          {/* top scale */}
          <View style={styles.topScaleRow}>
            <Text style={[styles.scaleTick, styles.font]}>0</Text>
            <Text style={[styles.scaleTick, styles.font]}>120.000</Text>
            <Text style={[styles.scaleTick, styles.font]}>240.000</Text>
          </View>

          {/* progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>

          {/* note (bigger + more spacing) */}
          <Text style={[styles.progressNote, styles.font]}>
            <Text style={{ color: '#5F764E', fontWeight: '800' }}>60%</Text> wurden erreicht! Das sind{' '}
            <Text style={{ fontWeight: '900' }}>144.000</Text> Schritte!
          </Text>

          {/* TEAM INFOS */}
          <View style={styles.teamSectionHeader}>
            <Text style={[styles.teamTitle, styles.font]}>Team Infos</Text>
          </View>

          <Text style={[styles.teamSubtitle, styles.font]}>
            <Text style={{ color: '#7FA58C', fontWeight: '700' }}>Ranking </Text>
            der Challenge
          </Text>

          {[
            { name: 'Jessica Marie Müll', steps: '51.200', rankColor: '#C8A100' }, // 1
            { name: 'Leonardo da Vinci', steps: '30.000', rankColor: '#999999' }, // 2
            { name: 'Gustav Fröhlich', steps: '28.800', rankColor: '#C9716D' }, // 3
            { name: 'Bernadette Unförmlich', steps: '27.600' },
            { name: 'Alice ooper (Du)', steps: '6.400', isUser: true },
          ].map((u, idx) => (
            <View
              key={idx}
              style={[
                styles.rankRow,
                u.isUser && styles.rankRowMe,
              ]}
            >
              <Text style={[styles.rankBadge, styles.font, u.rankColor ? { color: u.rankColor } : null]}>
                {idx + 1}#
              </Text>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.userName, styles.font]}>{u.name}</Text>
                  {u.isUser ? <Text style={[styles.youNote, styles.font]}>(Du)</Text> : null}
                </View>
                <Text style={[styles.userSteps, styles.font]}>{u.steps}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* MODAL */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={[styles.modalTitle, styles.font]}>Schritte Verwalten</Text>

              <TextInput
                style={[styles.input, styles.font]}
                placeholder="Anzahl Schritte"
                placeholderTextColor="#7FA58C"
                keyboardType="numeric"
                value={stepInput}
                onChangeText={setStepInput}
              />

              <TextInput
                style={[styles.input, styles.font]}
                placeholder="Datum auswählen (z.B. 05.08.2025)"
                placeholderTextColor="#white"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7FA58C' }]}>
                  <Text style={[styles.font, { color: '#FFFFFF', fontWeight: '700' }]}>Hinzufügen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#7FA58C' }]}>
                  <Text style={[styles.font, { color: '#FFFFFF', fontWeight: '700' }]}>Entfernen</Text>
                </TouchableOpacity>
              </View>

              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={[styles.font, { color: '#fff', fontWeight: '700' }]}>Schließen</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F7F4',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 35,
  },

  /* top section blends in (no card visuals) */
  topSection: {
    backgroundColor: 'transparent',
    padding: 0,
  },

  date: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F3E34',
  },
  hr: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginTop: 25,
    marginBottom: 25,
  },
  challengeRow: {
    textAlign: 'center',
    fontSize: 18,
    color: '#2F3E34',
    marginBottom: 20,
  },
  challengeLabel: { color: '#7FA58C', fontWeight: '700' },
  challengeMeta: { color: '#6B7280' },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  metricSide: {
    width: 70,
    alignItems: 'center',
  },
  metricSideValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F3E34',
    lineHeight: 18,
  },
  metricSideLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  stepCircleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleOuter: {
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: '#C5DECD', // original soft green
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 12,
    borderColor: '#DFEBE2', // original outer ring
  },
  stepCircleInnerRing: {
    position: 'absolute',
    width: 134,
    height: 134,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: '#E8EFEA',
  },
  stepCircle: {
    width: 135,
    height: 135,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2F3E34',
  },
  stepLabel: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#6B7280',
  },

  editBtn: {
    alignSelf: 'center',
    backgroundColor: '#7FA58C',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginTop: 1,
  },
  editBtnText: { color: '#FFFFFF', fontSize: 16 },

  weeklyTitle: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
    fontSize: 18,
    color: '#2F3E34',
  },

  /* bars — uniform color */
  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 190,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
    marginBottom: 80,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barTrack: {
    width: 20,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#E4EFE8',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#7EA88F', // same for every day
  },
  dayLabel: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },

  /* progress card (scrolled area) */
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    
  },
  progressTitle: {
    textAlign: 'center',
    fontSize: 20,                 // bigger
    color: '#2F3E34',
    fontWeight: '800',
    marginTop: 6,                 // extra spacing
    marginBottom: 30,             // extra spacing
  },
  topScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 6,
  },
  scaleTick: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E5E5E5',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7FA58C',
    borderRadius: 999,
  },
  progressNote: {
    textAlign: 'center',
    fontSize: 18,                 // larger than before
    color: '#2F3E34',
    marginTop: 20,                 // more breathing room
    marginBottom: 20,             // more breathing room
  },

  teamSectionHeader: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#E6EAE5',
    marginTop: 10,
  },
  teamTitle: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 22,                 // per your request
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 10,             // spacing below title
  },
  teamSubtitle: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 20,                 // per your request
    marginBottom: 16,             // spacing below subtitle
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#F0F2EF',
    borderRadius: 12,
  },
  rankRowMe: {
    backgroundColor: '#D7E3DA',
  },
  rankBadge: {
    width: 34,
    fontSize: 19,
    fontWeight: '800',
    color: '#6B7280',
  },
  avatar: {
    width: 54,                     // per your request
    height: 54,                    // per your request
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginRight: 25,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  youNote: { color: '#6B7280', fontSize: 18 },
  userName: {
    fontSize: 17,                  
    color: '#111827',
    fontWeight: '600',
  },
  userSteps: {
    fontSize: 15,
    color: '#7FA58C',
    fontWeight: '800',
    marginTop: 2,
  },

  /* font hook */
  font: {
    // fontFamily: 'VarelaRound_400Regular',
    fontFamily: 'Century Gothic',
  },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalView: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontWeight: '800',
    color: '#5F764E',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C7D6CD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9FBF9',
    color: '#2F3E34',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: '#7FA58C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default Dashboard;
