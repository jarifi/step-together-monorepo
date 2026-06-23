import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createBulkChallengeInvites,
  getChallengeInvites,
  getChallengeTeams,
  updateChallenge,
} from '../../services/challengeService';
import { getAllTeams } from '../../services/teamService';
import { getDisplayAvatarUri, getUsers, searchUsers } from '../../services/userService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toStr = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? v[0] : v ?? '';

const toNum = (v: string | string[] | undefined): number => Number(toStr(v));

function extractErrorMessage(err: unknown): string {
  const e = err as any;
  const p = e?.payload;
  if (p) {
    if (typeof p.message === 'string' && p.message) return p.message;
    if (typeof p.detail === 'string' && p.detail) return p.detail;
    if (Array.isArray(p.detail))
      return p.detail.map((d: any) => d.msg || JSON.stringify(d)).join(' · ');
    if (typeof p === 'string') return p;
  }
  const m = e?.message;
  if (typeof m === 'string' && m && m !== '[object Object]') return m;
  const s = e?.status;
  if (s === 400) return 'Ungültige Eingabe. Bitte alle Felder prüfen.';
  if (s === 401) return 'Nicht autorisiert. Bitte erneut anmelden.';
  if (s === 403) return 'Keine Berechtigung für diese Aktion.';
  if (s === 404) return 'Ressource nicht gefunden.';
  if (s === 422) return 'Eingabefehler. Bitte alle Felder korrekt ausfüllen.';
  if (s >= 500) return 'Serverfehler. Bitte später erneut versuchen.';
  if (e?.name === 'TypeError') return 'Netzwerkfehler. Bitte Internetverbindung prüfen.';
  return 'Unbekannter Fehler. Bitte erneut versuchen.';
}

function roundToFive(min: number): number {
  const rounded = Math.round((Number(min) || 0) / 5) * 5;
  return Math.min(55, Math.max(0, rounded));
}

function initials(name: string | undefined): string {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function fmtDate(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(d: Date | null): string {
  if (!d) return '—';
  return `${fmtDate(d)}  ${fmtTime(d)}`;
}

function calDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function calFirstWeekday(year: number, month: number): number {
  const wd = new Date(year, month, 1).getDay();
  return (wd + 6) % 7;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    a != null &&
    b != null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseIsoToDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(String(iso));
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const T = {
  white: '#FFFFFF',
  bg: '#F2F5F3',
  surfaceAlt: '#F7FAF8',
  primary: '#58896e81',
  primaryMid: '#2D7A50',
  primaryLight: '#5f8568ff',
  primarySoft: '#D6EAE0',
  primarySofter: '#EBF5EF',
  accentLight: '#A8D9BC',
  border: '#D0DDD6',
  borderStrong: '#B0C8BA',
  text: '#0F1F17',
  textSec: '#3D5448',
  textMuted: '#7A9589',
  textLight: '#A8BEB5',
  danger: '#B83232',
  dangerSoft: '#FAEAEA',
  success: '#1F7A4A',
  successSoft: '#E3F5EC',
  shadow: 'rgba(15,31,23,0.09)',
  calHeader: '#1E5C3A',
  calToday: '#EBF5EF',
  calSelected: '#7ac89dff',
  calRange: '#D6EAE0',
};

const { width: W } = Dimensions.get('window');
const IS_MOBILE = W < 680;
const IS_WEB = Platform.OS === 'web';

const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const DAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ---------------------------------------------------------------------------
// TimeStepper
// ---------------------------------------------------------------------------

interface TimeStepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function TimeStepper({ value, min, max, step, onChange }: TimeStepperProps) {
  function applyDelta(delta: number) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  }
  return (
    <View style={tw.stepperWrap}>
      <TouchableOpacity style={tw.stepBtn} onPress={() => applyDelta(step)}>
        <Text style={tw.stepBtnText}>+</Text>
      </TouchableOpacity>
      <View style={tw.stepValueWrap}>
        <Text style={tw.stepValueText}>{String(value).padStart(2, '0')}</Text>
      </View>
      <TouchableOpacity style={tw.stepBtn} onPress={() => applyDelta(-step)}>
        <Text style={tw.stepBtnText}>-</Text>
      </TouchableOpacity>
    </View>
  );
}

interface TimeWheelProps {
  value: number;
  options: number[];
  onChange: (v: number) => void;
}

function TimeWheel({ value, options, onChange }: TimeWheelProps) {
  return (
    <ScrollView style={tw.wheel} showsVerticalScrollIndicator={false} snapToInterval={24} decelerationRate="fast">
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[tw.wheelItem, opt === value && tw.wheelItemActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[tw.wheelText, opt === value && tw.wheelTextActive]}>
            {String(opt).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const tw = StyleSheet.create({
  wheel: { height: 72, width: 44, flexGrow: 0 },
  wheelItem: { height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  wheelItemActive: { backgroundColor: T.primarySoft },
  wheelText: { fontSize: 14, color: T.textMuted, fontWeight: '500' },
  wheelTextActive: { fontSize: 16, color: T.primary, fontWeight: '700' },
  stepperWrap: {
    width: 66, borderRadius: 10, borderWidth: 1.5, borderColor: T.border,
    backgroundColor: T.surfaceAlt, alignItems: 'center', paddingVertical: 6, gap: 6,
  },
  stepBtn: {
    width: 34, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.white, borderWidth: 1, borderColor: T.border,
  },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: T.textSec, lineHeight: 20 },
  stepValueWrap: {
    width: 46, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.primarySofter, borderWidth: 1, borderColor: T.accentLight,
  },
  stepValueText: { fontSize: 16, fontWeight: '700', color: T.primary },
});

// ---------------------------------------------------------------------------
// CalendarPicker
// ---------------------------------------------------------------------------

interface CalendarPickerProps {
  visible: boolean;
  value: Date | null;
  minDate?: Date;
  onConfirm: (d: Date) => void;
  onClose: () => void;
  title?: string;
}

function CalendarPicker({ visible, value, minDate, onConfirm, onClose, title }: CalendarPickerProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(value ? value.getFullYear() : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(value ? value.getMonth() : now.getMonth());
  const [picked, setPicked] = useState<Date | null>(value || null);
  const [hour, setHour] = useState(value ? value.getHours() : 8);
  const [minute, setMinute] = useState(value ? roundToFive(value.getMinutes()) : 0);

  useEffect(() => {
    if (visible) {
      const base = value || new Date();
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
      setPicked(value || null);
      setHour(value ? value.getHours() : 8);
      setMinute(value ? roundToFive(value.getMinutes()) : 0);
    }
  }, [visible]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }
  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < minDate) return;
    setPicked(d);
  }
  function confirm() {
    if (!picked) return;
    const result = new Date(picked);
    result.setHours(hour, minute, 0, 0);
    onConfirm(result);
  }

  const daysInMonth = calDaysInMonth(viewYear, viewMonth);
  const firstWeekday = calFirstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  if (!visible) return null;

  return (
    <View style={cal.backdrop}>
      <View style={cal.sheet}>
        <View style={cal.titleBar}>
          <Text style={cal.titleText}>{title || 'Datum wählen'}</Text>
          <TouchableOpacity onPress={onClose} style={cal.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={cal.closeTxt}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cal.scrollContent}>
          <View style={cal.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
              <Text style={cal.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={cal.monthLabel}>{MONTHS_DE[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
              <Text style={cal.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={cal.weekRow}>
            {DAYS_DE.map((d) => (
              <View key={d} style={cal.weekCell}>
                <Text style={cal.weekLabel}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={cal.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e${i}`} style={cal.cell} />;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isTodayD = sameDay(cellDate, today());
              const isSelected = picked && sameDay(cellDate, picked);
              const isDisabled = minDate != null && cellDate < minDate;
              return (
                <TouchableOpacity
                  key={day}
                  style={[cal.cell, isTodayD && cal.cellToday, isSelected && cal.cellSelected, isDisabled && cal.cellDisabled]}
                  onPress={() => !isDisabled && selectDay(day)}
                  activeOpacity={isDisabled ? 1 : 0.7}
                >
                  <Text style={[cal.cellText, isTodayD && cal.cellTextToday, isSelected && cal.cellTextSelected, isDisabled && cal.cellTextDisabled]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={cal.divider} />

          <Text style={cal.timeLabel}>Uhrzeit</Text>
          <View style={cal.timeRow}>
            <View style={cal.timeBlock}>
              <Text style={cal.timeUnit}>Stunde</Text>
              {IS_WEB ? (
                <select value={hour} onChange={(e) => setHour(Number(e.target.value))} style={{ fontSize: 16, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${T.border}`, color: T.text, background: T.surfaceAlt, fontFamily: 'inherit', outline: 'none' }}>
                  {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                </select>
              ) : Platform.OS === 'android' ? (
                <TimeStepper value={hour} min={0} max={23} step={1} onChange={setHour} />
              ) : (
                <TimeWheel value={hour} options={HOURS} onChange={setHour} />
              )}
            </View>
            <Text style={cal.timeSep}>:</Text>
            <View style={cal.timeBlock}>
              <Text style={cal.timeUnit}>Minute</Text>
              {IS_WEB ? (
                <select value={minute} onChange={(e) => setMinute(Number(e.target.value))} style={{ fontSize: 16, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${T.border}`, color: T.text, background: T.surfaceAlt, fontFamily: 'inherit', outline: 'none' }}>
                  {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              ) : Platform.OS === 'android' ? (
                <TimeStepper value={minute} min={0} max={55} step={5} onChange={setMinute} />
              ) : (
                <TimeWheel value={minute} options={MINUTES} onChange={setMinute} />
              )}
            </View>
            {picked && (
              <View style={cal.timePreview}>
                <Text style={cal.timePreviewLabel}>Gewählt</Text>
                <Text style={cal.timePreviewVal}>
                  {fmtDate(picked)}{'\n'}{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={cal.actions}>
          <TouchableOpacity style={cal.cancelBtn} onPress={onClose}>
            <Text style={cal.cancelTxt}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[cal.confirmBtn, !picked && cal.confirmBtnDisabled]} onPress={confirm} disabled={!picked}>
            <Text style={cal.confirmTxt}>Übernehmen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,25,18,0.45)', alignItems: 'center', justifyContent: 'center' },
  sheet: {
    backgroundColor: T.white, borderRadius: 20, padding: 14,
    width: Math.min(360, W - 32), maxHeight: (IS_MOBILE ? '78%' : '82%') as any, flexShrink: 1,
    ...(IS_WEB ? ({ boxShadow: '0 8px 40px rgba(10,25,18,0.22)' } as any) : { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 }),
  },
  scrollContent: { paddingBottom: 4 },
  titleBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titleText: { fontSize: 15, fontWeight: '700', color: T.text },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: T.surfaceAlt },
  closeTxt: { fontSize: 20, color: T.textMuted, lineHeight: 22 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: T.surfaceAlt, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 18, color: T.primary, fontWeight: '700', lineHeight: 22 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: T.text },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  weekLabel: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginBottom: 1 },
  cellToday: { backgroundColor: T.calToday },
  cellSelected: { backgroundColor: T.calSelected },
  cellDisabled: { opacity: 0.3 },
  cellText: { fontSize: 14, color: T.text, fontWeight: '500' },
  cellTextToday: { color: T.primary, fontWeight: '700' },
  cellTextSelected: { color: T.white, fontWeight: '700' },
  cellTextDisabled: { color: T.textLight },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: T.border, marginVertical: 10 },
  timeLabel: { fontSize: 12, fontWeight: '700', color: T.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  timeBlock: { alignItems: 'center', gap: 6 },
  timeUnit: { fontSize: 11, color: T.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  timeSep: { fontSize: 28, fontWeight: '700', color: T.textMuted, marginTop: 16 },
  timePreview: { flex: 1, backgroundColor: T.primarySofter, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: T.accentLight },
  timePreviewLabel: { fontSize: 10, fontWeight: '700', color: T.primaryLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  timePreviewVal: { fontSize: 13, fontWeight: '700', color: T.primary, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.border },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: T.border, paddingVertical: 12, alignItems: 'center', backgroundColor: T.white },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: T.textSec },
  confirmBtn: { flex: 1, borderRadius: 12, backgroundColor: T.primary, paddingVertical: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: T.textLight },
  confirmTxt: { fontSize: 15, fontWeight: '700', color: T.white },
});

// ---------------------------------------------------------------------------
// DateField
// ---------------------------------------------------------------------------

interface DateFieldProps {
  label?: string;
  required?: boolean;
  value: Date | null;
  onChange: (v: Date | null) => void;
  minDate?: Date;
  error?: string | null;
}

function DateField({ label, required, value, onChange, minDate, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const hasVal = !!value;
  return (
    <View style={s.fieldWrap}>
      {label && (
        <Text style={s.label}>
          {label}{required && <Text style={{ color: T.primary }}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[s.dateBtn, error && s.dateBtnError, hasVal && s.dateBtnFilled]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <View style={s.dateBtnInner}>
          <Text style={[s.dateBtnIcon, hasVal && { color: T.primary }]}>▦</Text>
          <Text style={[s.dateBtnText, !hasVal && s.dateBtnPlaceholder]}>
            {hasVal ? fmtDateShort(value) : 'Datum und Uhrzeit wählen'}
          </Text>
        </View>
        {hasVal && (
          <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); onChange(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.dateBtnClear}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {error && <Text style={s.errorMsg}>{error}</Text>}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <CalendarPicker
          visible={open}
          value={value}
          minDate={minDate}
          title={label}
          onConfirm={(d) => { onChange(d); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SectionHead / Card / HRule
// ---------------------------------------------------------------------------

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secTitle}>{title}</Text>
      {subtitle && <Text style={s.secSub}>{subtitle}</Text>}
    </View>
  );
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function HRule() {
  return <View style={s.hrule} />;
}

// ---------------------------------------------------------------------------
// TeamRow
// ---------------------------------------------------------------------------

interface Team {
  id: number | string;
  name?: string;
  memberCount?: number;
}

function TeamRow({ team, selected, onToggle }: { team: Team; selected: boolean; onToggle: (id: number | string) => void }) {
  const ini = initials(team.name);
  return (
    <TouchableOpacity style={[s.teamRow, selected && s.teamRowSel]} onPress={() => onToggle(team.id)} activeOpacity={0.65}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{ini}</Text>
      </View>
      <View style={s.teamBody}>
        <Text style={[s.teamName, selected && s.teamNameSel]} numberOfLines={1}>{team.name}</Text>
        {team.memberCount != null && <Text style={s.teamMeta}>{team.memberCount} Mitglieder</Text>}
      </View>
      <View style={[s.checkbox, selected && s.checkboxOn]}>
        {selected && <Text style={s.checkTick}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// UserRow
// ---------------------------------------------------------------------------

interface User {
  id: number | string;
  name?: string;
  fullname?: string;
  full_name?: string;
  username?: string;
  [key: string]: unknown;
}

function UserRow({ user, selected, onToggle }: { user: User; selected: boolean; onToggle: (id: number | string) => void }) {
  const avatarUri = getDisplayAvatarUri(user);
  const [imgErr, setImgErr] = useState(false);
  const displayName = user.name ?? user.fullname ?? user.full_name ?? user.username ?? 'Unbekannt';
  const ini = initials(displayName);
  return (
    <TouchableOpacity style={[s.userRow, selected && s.userRowSel]} onPress={() => onToggle(user.id)} activeOpacity={0.65}>
      {avatarUri && !imgErr ? (
        <Image source={{ uri: avatarUri }} style={s.userAvatarImg} onError={() => setImgErr(true)} />
      ) : (
        <View style={[s.avatar, s.userAvatarFallback]}>
          <Text style={s.avatarText}>{ini}</Text>
        </View>
      )}
      <View style={s.teamBody}>
        <Text style={[s.teamName, selected && s.teamNameSel]} numberOfLines={1}>{displayName}</Text>
        <Text style={s.teamMeta}>ID: {user.id}</Text>
      </View>
      <View style={[s.checkbox, selected && s.checkboxOn]}>
        {selected && <Text style={s.checkTick}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

interface ToastState {
  type: 'success' | 'error';
  message: string;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Form errors
// ---------------------------------------------------------------------------

interface FormErrors {
  name?: string | null;
  startLoc?: string | null;
  targetLoc?: string | null;
  distance?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  participants?: string | null;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function UpdateChallengeScreen() {
  const params = useLocalSearchParams();

  const challengeId = useMemo(() => toNum(params.id), [params.id]);
  const mode = useMemo(() => toStr(params.mode) || 'team', [params.mode]);
  const isIndividual = mode === 'individual';

  const [name, setName] = useState(toStr(params.name) || '');
  const [startLoc, setStartLoc] = useState(toStr(params.startLocation) || '');
  const [targetLoc, setTargetLoc] = useState(toStr(params.targetLocation) || '');
  const [distance, setDistance] = useState(toStr(params.distance) || '');

  const [startDate, setStartDate] = useState<Date | null>(() => parseIsoToDate(toStr(params.startDate)));
  const [endDate, setEndDate] = useState<Date | null>(() => parseIsoToDate(toStr(params.endDate)));

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Teams state (mode === 'team')
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<(number | string)[]>([]);
  const [visibleTeams, setVisibleTeams] = useState(4);
  const [teamsPreLoaded, setTeamsPreLoaded] = useState(false);

  // Users state (mode === 'individual')
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<(number | string)[]>([]);
  const [visibleUsers, setVisibleUsers] = useState(4);
  const [usersPreLoaded, setUsersPreLoaded] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastAnim = useRef(new Animated.Value(-140)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load teams list
  useEffect(() => {
    if (isIndividual) return;
    let mounted = true;
    (async () => {
      setTeamsLoading(true);
      try {
        const data = await getAllTeams();
        if (mounted) setTeams(Array.isArray(data) ? data : []);
      } catch {
        // silently ignore
      } finally {
        if (mounted) setTeamsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isIndividual]);

  // Pre-select existing teams for this challenge
  useEffect(() => {
    if (isIndividual || !challengeId || teamsPreLoaded) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getChallengeTeams(challengeId);
        const ids: (number | string)[] = Array.isArray(data)
          ? data.map((t: any) => Number(t.id)).filter(Boolean)
          : [];
        if (mounted) { setSelectedTeamIds(ids); setTeamsPreLoaded(true); }
      } catch {
        if (mounted) setTeamsPreLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, [challengeId, isIndividual, teamsPreLoaded]);

  // Load users list
  const loadUsers = useCallback(async (q = '') => {
    setUsersLoading(true);
    try {
      const data = q.trim() ? await searchUsers(q, 0, 15) : await getUsers(0, 15);
      setUsers(data || []);
      setVisibleUsers(4);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isIndividual) return;
    loadUsers('');
  }, [isIndividual, loadUsers]);

  // Pre-select existing invitees for this challenge
  useEffect(() => {
    if (!isIndividual || !challengeId || usersPreLoaded) return;
    let mounted = true;
    (async () => {
      try {
        const invites = await getChallengeInvites(challengeId);
        const ids: (number | string)[] = (invites as any[])
          .filter((inv: any) => {
            const status = String(inv.status ?? '').toLowerCase();
            return status !== 'declined' && status !== 'cancelled';
          })
          .map((inv: any) =>
            inv.inviteeUserId ?? inv.invitee_user_id ?? inv.inviteeId ?? inv.invitee_id ?? inv.user_id ?? inv.user?.id
          )
          .filter(Boolean)
          .map(Number);
        if (mounted) { setSelectedUserIds(ids); setUsersPreLoaded(true); }
      } catch {
        if (mounted) setUsersPreLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, [challengeId, isIndividual, usersPreLoaded]);

  const toggleTeam = useCallback((id: number | string) => {
    setSelectedTeamIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const toggleUser = useCallback((id: number | string) => {
    setSelectedUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const filteredTeams = useMemo(() =>
    teams.filter((t) => (t.name || '').toLowerCase().includes(teamSearch.toLowerCase())),
    [teams, teamSearch]
  );

  const clearError = (key: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [key]: null }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Name ist erforderlich';
    if (!startLoc.trim()) e.startLoc = 'Startort eingeben';
    if (!targetLoc.trim()) e.targetLoc = 'Zielort eingeben';
    if (!distance || isNaN(+distance) || +distance <= 0) e.distance = 'Gültige Distanz eingeben';
    if (!startDate) e.startDate = 'Startdatum wählen';
    if (!endDate) e.endDate = 'Enddatum wählen';
    if (startDate && endDate && endDate <= startDate) e.endDate = 'Enddatum muss nach Startdatum liegen';
    if (!isIndividual && selectedTeamIds.length === 0) e.participants = 'Mindestens ein Team auswählen';
    if (isIndividual && selectedUserIds.length === 0) e.participants = 'Mindestens einen Benutzer auswählen';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!challengeId || isNaN(challengeId)) {
      showToast('error', 'Ungültige Challenge-ID.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        start_location: startLoc.trim(),
        target_location: targetLoc.trim(),
        distance: parseFloat(distance),
        start_date: (startDate as Date).toISOString(),
        end_date: (endDate as Date).toISOString(),
        team_ids: isIndividual ? [] : selectedTeamIds,
      };
      await updateChallenge(challengeId, payload);

      if (isIndividual && selectedUserIds.length > 0) {
        try {
          await createBulkChallengeInvites(challengeId, selectedUserIds);
        } catch (inviteErr) {
          console.warn('Invites could not be updated:', inviteErr);
        }
      }

      showToast('success', 'Challenge erfolgreich aktualisiert!', () => router.replace('/challenges'));
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Toast helpers
  function dismissToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.timing(toastAnim, { toValue: -140, duration: 280, useNativeDriver: true }).start(() => setToast(null));
  }

  function showToast(type: 'success' | 'error', message: string, onPress?: () => void) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message, onPress });
  }

  useEffect(() => {
    if (!toast) return;
    toastAnim.setValue(-140);
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 11 }).start();
    toastTimer.current = setTimeout(dismissToast, 5000);
  }, [toast]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Challenge bearbeiten</Text>
          <Text style={s.headerSub}>{isIndividual ? 'Individuell' : 'Team'}</Text>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 1. Grunddaten ── */}
          <SectionHead title="Grunddaten" subtitle="Name, Strecke und Distanz" />
          <Card>
            <View style={s.fieldWrap}>
              <Text style={s.label}>Challenge-Name <Text style={{ color: T.primary }}>*</Text></Text>
              <TextInput
                style={[s.input, errors.name && s.inputError]}
                placeholder="z.B. Graz nach Wien 2026"
                placeholderTextColor={T.textLight}
                value={name}
                onChangeText={(v) => { setName(v); clearError('name'); }}
                maxLength={80}
              />
              {errors.name && <Text style={s.errorMsg}>{errors.name}</Text>}
            </View>

            <HRule />

            <View style={IS_MOBILE ? s.col : s.row2}>
              <View style={[s.fieldWrap, !IS_MOBILE && { flex: 1 }]}>
                <Text style={s.label}>Startort <Text style={{ color: T.primary }}>*</Text></Text>
                <TextInput
                  style={[s.input, errors.startLoc && s.inputError]}
                  placeholder="z.B. Graz"
                  placeholderTextColor={T.textLight}
                  value={startLoc}
                  onChangeText={(v) => { setStartLoc(v); clearError('startLoc'); }}
                />
                {errors.startLoc && <Text style={s.errorMsg}>{errors.startLoc}</Text>}
              </View>
              <View style={[s.fieldWrap, !IS_MOBILE && { flex: 1 }]}>
                <Text style={s.label}>Zielort <Text style={{ color: T.primary }}>*</Text></Text>
                <TextInput
                  style={[s.input, errors.targetLoc && s.inputError]}
                  placeholder="z.B. Wien"
                  placeholderTextColor={T.textLight}
                  value={targetLoc}
                  onChangeText={(v) => { setTargetLoc(v); clearError('targetLoc'); }}
                />
                {errors.targetLoc && <Text style={s.errorMsg}>{errors.targetLoc}</Text>}
              </View>
            </View>

            <HRule />

            <View style={s.fieldWrap}>
              <Text style={s.label}>Distanz <Text style={{ color: T.primary }}>*</Text></Text>
              <View style={s.distRow}>
                <TextInput
                  style={[s.input, s.distInput, errors.distance && s.inputError]}
                  placeholder="z.B. 200"
                  placeholderTextColor={T.textLight}
                  value={distance}
                  onChangeText={(v) => { setDistance(v.replace(/[^0-9.]/g, '')); clearError('distance'); }}
                  keyboardType="numeric"
                />
                <View style={s.unitChip}>
                  <Text style={s.unitText}>km</Text>
                </View>
              </View>
              {errors.distance && <Text style={s.errorMsg}>{errors.distance}</Text>}
            </View>
          </Card>

          {/* ── 2. Zeitraum ── */}
          <SectionHead title="Zeitraum" subtitle="Start- und Enddatum der Challenge" />
          <Card>
            <View style={IS_MOBILE ? s.col : s.row2}>
              <View style={!IS_MOBILE && { flex: 1 }}>
                <DateField
                  label="Startdatum"
                  required
                  value={startDate}
                  onChange={(v) => {
                    setStartDate(v);
                    clearError('startDate');
                    if (endDate && v && endDate <= v) setEndDate(null);
                  }}
                  error={errors.startDate}
                />
              </View>
              <View style={!IS_MOBILE && { flex: 1 }}>
                <DateField
                  label="Enddatum"
                  required
                  value={endDate}
                  minDate={startDate ? new Date(startDate.getTime() + 60000) : undefined}
                  onChange={(v) => { setEndDate(v); clearError('endDate'); }}
                  error={errors.endDate}
                />
              </View>
            </View>
          </Card>

          {/* ── 3. Teilnehmende ── */}
          <SectionHead
            title={isIndividual ? 'Teilnehmende Personen' : 'Teilnehmende Teams'}
            subtitle={isIndividual ? 'Benutzer suchen und auswählen' : 'Teams suchen und auswählen'}
          />
          <Card style={s.modeWidget}>
            {/* Search box */}
            <View style={s.widgetSearchWrap}>
              <View style={s.searchBox}>
                <Text style={s.searchIcon}>⌕</Text>
                <TextInput
                  style={s.searchInput}
                  placeholder={isIndividual ? 'User suchen…' : 'Teams durchsuchen…'}
                  placeholderTextColor={T.textMuted}
                  value={isIndividual ? userSearch : teamSearch}
                  onChangeText={(text) => {
                    if (isIndividual) { setUserSearch(text); loadUsers(text); }
                    else { setTeamSearch(text); setVisibleTeams(4); }
                  }}
                />
              </View>
            </View>

            {isIndividual ? (
              // Users list
              usersLoading ? (
                <View style={s.widgetCenter}>
                  <ActivityIndicator color={T.primary} />
                </View>
              ) : users.length === 0 ? (
                <View style={s.widgetCenter}>
                  <Text style={s.emptyText}>Keine User gefunden</Text>
                </View>
              ) : (
                <>
                  {users.slice(0, visibleUsers).map((user, i, arr) => (
                    <View key={String(user.id)}>
                      <UserRow user={user} selected={selectedUserIds.map(Number).includes(Number(user.id))} onToggle={toggleUser} />
                      {i < arr.length - 1 && <View style={s.teamDivider} />}
                    </View>
                  ))}
                  {visibleUsers < Math.min(users.length, 15) && (
                    <TouchableOpacity style={s.showMoreBtn} onPress={() => setVisibleUsers((v) => Math.min(v + 5, 15))}>
                      <Text style={s.showMoreText}>
                        Mehr anzeigen ({Math.min(users.length, 15) - visibleUsers} weitere)
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )
            ) : (
              // Teams list
              teamsLoading ? (
                <View style={s.widgetCenter}>
                  <ActivityIndicator color={T.primary} />
                </View>
              ) : filteredTeams.length === 0 ? (
                <View style={s.widgetCenter}>
                  <Text style={s.emptyText}>Keine Teams gefunden</Text>
                </View>
              ) : (
                <>
                  {filteredTeams.slice(0, visibleTeams).map((team, i, arr) => (
                    <View key={String(team.id)}>
                      <TeamRow team={team} selected={selectedTeamIds.map(Number).includes(Number(team.id))} onToggle={toggleTeam} />
                      {i < arr.length - 1 && <View style={s.teamDivider} />}
                    </View>
                  ))}
                  {visibleTeams < Math.min(filteredTeams.length, 15) && (
                    <TouchableOpacity style={s.showMoreBtn} onPress={() => setVisibleTeams((v) => Math.min(v + 5, 15))}>
                      <Text style={s.showMoreText}>
                        Mehr anzeigen ({Math.min(filteredTeams.length, 15) - visibleTeams} weitere)
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )
            )}
          </Card>

          {errors.participants && (
            <View style={s.teamsErrorWrap}>
              <Text style={s.teamsErrorMsg}>{errors.participants}</Text>
            </View>
          )}

          {/* ── Buttons ── */}
          <View style={s.btnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} disabled={submitting} activeOpacity={0.75}>
              <Text style={s.cancelBtnText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? <ActivityIndicator color={T.white} /> : <Text style={s.submitText}>Speichern</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {toast && (
        <Animated.View style={[ts.wrap, { transform: [{ translateY: toastAnim }] }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[ts.inner, toast.type === 'success' ? ts.success : ts.error]}
            onPress={() => { toast.onPress?.(); dismissToast(); }}
            activeOpacity={1}
            pointerEvents="auto"
          >
            <View style={ts.iconWrap}>
              <Text style={ts.iconText}>{toast.type === 'success' ? '✓' : '!'}</Text>
            </View>
            <Text style={ts.message} numberOfLines={3}>{toast.message}</Text>
            <TouchableOpacity onPress={dismissToast} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={ts.close}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const INPUT_RADIUS = 12;
const CARD_RADIUS = 16;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  header: {
    paddingTop: 25, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: T.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.border,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: IS_MOBILE ? 22 : 28, fontWeight: '600', color: T.primary,
    letterSpacing: 1.2, lineHeight: IS_MOBILE ? 30 : 38, textAlign: 'center',
  },
  headerSub: {
    fontSize: 13, color: T.textMuted, fontWeight: '500', marginTop: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: IS_MOBILE ? 16 : 24, paddingBottom: 40, maxWidth: 740, width: '100%', alignSelf: 'center' },

  secHead: { marginBottom: 10, marginTop: 20, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: T.primaryLight },
  secTitle: { fontSize: 17, fontWeight: '700', color: T.text, letterSpacing: -0.2 },
  secSub: { fontSize: 13, color: T.textMuted, marginTop: 2 },

  card: {
    backgroundColor: T.white, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: T.border,
    padding: IS_MOBILE ? 16 : 20, marginBottom: 4,
    ...(IS_WEB
      ? ({ boxShadow: '0 1px 6px rgba(15,31,23,0.08)' } as any)
      : { shadowColor: '#0F1F17', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 1 }, elevation: 1 }),
  },

  fieldWrap: { marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: T.textSec, marginBottom: 7, letterSpacing: 0.1 },
  input: {
    backgroundColor: T.surfaceAlt, borderWidth: 1.5, borderColor: T.border,
    borderRadius: INPUT_RADIUS, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11, fontSize: 15, color: T.text,
    ...(IS_WEB ? ({ outlineStyle: 'none', transition: 'border-color 0.15s' } as any) : {}),
  },
  inputError: { borderColor: T.danger, backgroundColor: T.dangerSoft },
  errorMsg: { fontSize: 12, color: T.danger, marginTop: 5, fontWeight: '500' },

  hrule: { height: StyleSheet.hairlineWidth, backgroundColor: T.border, marginVertical: 16 },

  row2: { flexDirection: 'row', gap: 14 },
  col: { flexDirection: 'column', gap: 14 },

  distRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  distInput: { flex: 1, maxWidth: IS_MOBILE ? undefined : 200 },
  unitChip: {
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    borderRadius: INPUT_RADIUS, backgroundColor: T.primarySoft,
    borderWidth: 1.5, borderColor: T.accentLight,
  },
  unitText: { fontSize: 15, fontWeight: '700', color: T.primary },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: T.surfaceAlt, borderWidth: 1.5, borderColor: T.border,
    borderRadius: INPUT_RADIUS, paddingHorizontal: 16, paddingVertical: 12,
    ...(IS_WEB ? ({ cursor: 'pointer', transition: 'border-color 0.15s' } as any) : {}),
  },
  dateBtnFilled: { borderColor: T.accentLight, backgroundColor: T.primarySofter },
  dateBtnError: { borderColor: T.danger, backgroundColor: T.dangerSoft },
  dateBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dateBtnIcon: { fontSize: 16, color: T.textLight },
  dateBtnText: { fontSize: 15, color: T.text, fontWeight: '500' },
  dateBtnPlaceholder: { color: T.textLight, fontWeight: '400' },
  dateBtnClear: { fontSize: 22, color: T.textMuted, paddingLeft: 8, lineHeight: 24 },

  modeWidget: { padding: 0, marginBottom: 4 },
  widgetSearchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  widgetCenter: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 24 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: T.white,
    borderWidth: 1.5, borderColor: T.border, borderRadius: INPUT_RADIUS,
    paddingHorizontal: 14, gap: 8, marginTop: 10, marginBottom: 10,
    ...(IS_WEB ? ({ boxShadow: '0 1px 4px rgba(15,31,23,0.07)' } as any) : {}),
  },
  searchIcon: { fontSize: 18, color: T.textMuted },
  searchInput: {
    flex: 1, fontSize: 15, color: T.text, paddingVertical: 12,
    ...(IS_WEB ? ({ outlineStyle: 'none', border: 'none', background: 'transparent' } as any) : {}),
  },

  teamRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
    gap: 12, backgroundColor: T.white, borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  teamRowSel: { borderLeftColor: T.primary },
  teamDivider: { height: StyleSheet.hairlineWidth, backgroundColor: T.border, marginLeft: 70 },
  avatar: {
    width: 42, height: 42, borderRadius: 11, backgroundColor: T.surfaceAlt,
    borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: T.textSec },
  teamBody: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: '600', color: T.text },
  teamNameSel: { color: T.primary },
  teamMeta: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: T.border,
    backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxOn: { backgroundColor: T.primary, borderColor: T.primary },
  checkTick: { color: T.white, fontSize: 13, fontWeight: '800', lineHeight: 14 },

  emptyText: { fontSize: 14, color: T.textMuted, textAlign: 'center', paddingVertical: 32 },

  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border, backgroundColor: T.white, borderRadius: 15,
  },
  showMoreText: { fontSize: 14, fontWeight: '600', color: T.primary },

  teamsErrorWrap: {
    marginTop: 14, marginBottom: 8, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: T.dangerSoft, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: T.danger,
  },
  teamsErrorMsg: { fontSize: 15, color: T.danger, fontWeight: '700' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: T.border,
    paddingVertical: 16, alignItems: 'center', backgroundColor: T.white,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: T.textSec },
  submitBtn: {
    flex: 2, backgroundColor: T.primaryLight, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    ...(IS_WEB
      ? ({ cursor: 'pointer', boxShadow: '0 4px 18px rgba(74,158,110,0.35)' } as any)
      : { shadowColor: T.primaryLight, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 5 }),
  },
  submitBtnDisabled: { backgroundColor: T.textLight },
  submitText: { fontSize: 17, fontWeight: '700', color: T.white, letterSpacing: 0.1 },

  userRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    gap: 12, backgroundColor: 'transparent', borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  userRowSel: { borderLeftColor: T.primary },
  userAvatarImg: { width: 42, height: 42, borderRadius: 21, flexShrink: 0 },
  userAvatarFallback: { backgroundColor: T.primarySofter, borderColor: T.accentLight },
});

const ts = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, elevation: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 28, paddingHorizontal: 14, paddingBottom: 10,
  },
  inner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16, gap: 12, opacity: 1,
    ...(IS_WEB
      ? ({ boxShadow: '0 6px 24px rgba(10,25,18,0.35)' } as any)
      : { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12 }),
  },
  success: { backgroundColor: '#1E5C3A' },
  error: { backgroundColor: '#B83232' },
  iconWrap: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  message: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  close: { fontSize: 24, color: 'rgba(255,255,255,0.75)', lineHeight: 26, paddingLeft: 4 },
});
