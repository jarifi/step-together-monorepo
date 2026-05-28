import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import {
  createBulkChallengeInvites,
  createChallenge,
} from "../services/challengeService";
import {
  getDisplayAvatarUri,
  getUsers,
  searchUsers,
} from "../services/userService";

function extractErrorMessage(err) {
  // Unpack a FastAPI / structured payload first
  const p = err?.payload;
  if (p) {
    if (typeof p.message === "string" && p.message) return p.message;
    if (typeof p.detail === "string" && p.detail) return p.detail;
    if (Array.isArray(p.detail))
      return p.detail.map((d) => d.msg || JSON.stringify(d)).join(" · ");
    if (typeof p === "string") return p;
  }
  // err.message can be "[object Object]" when the API bug fires
  const m = err?.message;
  if (typeof m === "string" && m && m !== "[object Object]") return m;
  // Status-based fallbacks in German
  const s = err?.status;
  if (s === 400) return "Ungültige Eingabe. Bitte alle Felder prüfen.";
  if (s === 401) return "Nicht autorisiert. Bitte erneut anmelden.";
  if (s === 403) return "Keine Berechtigung für diese Aktion.";
  if (s === 404) return "Ressource nicht gefunden.";
  if (s === 422) return "Eingabefehler. Bitte alle Felder korrekt ausfüllen.";
  if (s >= 500) return "Serverfehler. Bitte später erneut versuchen.";
  if (err?.name === "TypeError")
    return "Netzwerkfehler. Bitte Internetverbindung prüfen.";
  return "Unbekannter Fehler. Bitte erneut versuchen.";
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  white: "#FFFFFF",
  bg: "#F2F5F3",
  surfaceAlt: "#F7FAF8",
  primary: "#58896e81",
  primaryMid: "#2D7A50",
  primaryLight: "#5f8568ff",
  primarySoft: "#D6EAE0",
  primarySofter: "#EBF5EF",
  accentLight: "#A8D9BC",
  border: "#D0DDD6",
  borderStrong: "#B0C8BA",
  text: "#0F1F17",
  textSec: "#3D5448",
  textMuted: "#7A9589",
  textLight: "#A8BEB5",
  danger: "#B83232",
  dangerSoft: "#FAEAEA",
  success: "#1F7A4A",
  successSoft: "#E3F5EC",
  shadow: "rgba(15,31,23,0.09)",
  calHeader: "#1E5C3A",
  calToday: "#EBF5EF",
  calSelected: "#7ac89dff",
  calRange: "#D6EAE0",
};

const { width: W } = Dimensions.get("window");
const IS_MOBILE = W < 680;
const IS_WEB = Platform.OS === "web";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const DAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtTime(d) {
  if (!d) return "";
  return d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateShort(d) {
  if (!d) return "—";
  return `${fmtDate(d)}  ${fmtTime(d)}`;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const n = Math.round((b - a) / 86400000);
  return n > 0 ? n : null;
}

function calDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function calFirstWeekday(year, month) {
  // Monday-based: Mon=0 … Sun=6
  const wd = new Date(year, month, 1).getDay();
  return (wd + 6) % 7;
}

function roundToFive(min) {
  const rounded = Math.round((Number(min) || 0) / 5) * 5;
  return Math.min(55, Math.max(0, rounded));
}

function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TimeStepper({ value, min, max, step, onChange }) {
  function applyDelta(delta) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  }

  return (
    <View style={tw.stepperWrap}>
      <TouchableOpacity style={tw.stepBtn} onPress={() => applyDelta(step)}>
        <Text style={tw.stepBtnText}>+</Text>
      </TouchableOpacity>
      <View style={tw.stepValueWrap}>
        <Text style={tw.stepValueText}>{String(value).padStart(2, "0")}</Text>
      </View>
      <TouchableOpacity style={tw.stepBtn} onPress={() => applyDelta(-step)}>
        <Text style={tw.stepBtnText}>-</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── TimeWheel ────────────────────────────────────────────────────────────────
// Minimal scroll-drum for hour / minute
function TimeWheel({ value, options, onChange }) {
  return (
    <ScrollView
      style={tw.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={24}
      decelerationRate="fast"
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[tw.wheelItem, opt === value && tw.wheelItemActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[tw.wheelText, opt === value && tw.wheelTextActive]}>
            {String(opt).padStart(2, "0")}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const tw = StyleSheet.create({
  wheel: { height: 72, width: 44, flexGrow: 0 },
  wheelItem: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  wheelItemActive: { backgroundColor: T.primarySoft },
  wheelText: { fontSize: 14, color: T.textMuted, fontWeight: "500" },
  wheelTextActive: { fontSize: 16, color: T.primary, fontWeight: "700" },
  stepperWrap: {
    width: 66,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.surfaceAlt,
    alignItems: "center",
    paddingVertical: 6,
    gap: 6,
  },
  stepBtn: {
    width: 34,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: T.textSec,
    lineHeight: 20,
  },
  stepValueWrap: {
    width: 46,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primarySofter,
    borderWidth: 1,
    borderColor: T.accentLight,
  },
  stepValueText: { fontSize: 16, fontWeight: "700", color: T.primary },
});

// ─── Modern Calendar Picker ───────────────────────────────────────────────────
function CalendarPicker({
  visible,
  value,
  minDate,
  onConfirm,
  onClose,
  title,
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(
    value ? value.getFullYear() : now.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value ? value.getMonth() : now.getMonth(),
  );
  const [picked, setPicked] = useState(value || null);
  const [hour, setHour] = useState(value ? value.getHours() : 8);
  const [minute, setMinute] = useState(
    value ? roundToFive(value.getMinutes()) : 0,
  );

  // reset when opening
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
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function selectDay(day) {
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
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  if (!visible) return null;

  const calContent = (
    <View style={cal.sheet}>
      {/* Title bar */}
      <View style={cal.titleBar}>
        <Text style={cal.titleText}>{title || "Datum wählen"}</Text>
        <TouchableOpacity
          onPress={onClose}
          style={cal.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={cal.closeTxt}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={cal.scrollContent}
      >
        {/* Month nav */}
        <View style={cal.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
            <Text style={cal.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={cal.monthLabel}>
            {MONTHS_DE[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
            <Text style={cal.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={cal.weekRow}>
          {DAYS_DE.map((d) => (
            <View key={d} style={cal.weekCell}>
              <Text style={cal.weekLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        <View style={cal.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e${i}`} style={cal.cell} />;
            const cellDate = new Date(viewYear, viewMonth, day);
            const isTodayD = sameDay(cellDate, today());
            const isSelected = picked && sameDay(cellDate, picked);
            const isDisabled = minDate && cellDate < minDate;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  cal.cell,
                  isTodayD && cal.cellToday,
                  isSelected && cal.cellSelected,
                  isDisabled && cal.cellDisabled,
                ]}
                onPress={() => !isDisabled && selectDay(day)}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <Text
                  style={[
                    cal.cellText,
                    isTodayD && cal.cellTextToday,
                    isSelected && cal.cellTextSelected,
                    isDisabled && cal.cellTextDisabled,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divider */}
        <View style={cal.divider} />

        {/* Time picker */}
        <Text style={cal.timeLabel}>Uhrzeit</Text>
        <View style={cal.timeRow}>
          <View style={cal.timeBlock}>
            <Text style={cal.timeUnit}>Stunde</Text>
            {IS_WEB ? (
              <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                style={{
                  fontSize: 16,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${T.border}`,
                  color: T.text,
                  background: T.surfaceAlt,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
            ) : Platform.OS === "android" ? (
              <TimeStepper
                value={hour}
                min={0}
                max={23}
                step={1}
                onChange={setHour}
              />
            ) : (
              <TimeWheel value={hour} options={HOURS} onChange={setHour} />
            )}
          </View>
          <Text style={cal.timeSep}>:</Text>
          <View style={cal.timeBlock}>
            <Text style={cal.timeUnit}>Minute</Text>
            {IS_WEB ? (
              <select
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                style={{
                  fontSize: 16,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${T.border}`,
                  color: T.text,
                  background: T.surfaceAlt,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            ) : Platform.OS === "android" ? (
              <TimeStepper
                value={minute}
                min={0}
                max={55}
                step={5}
                onChange={setMinute}
              />
            ) : (
              <TimeWheel
                value={minute}
                options={MINUTES}
                onChange={setMinute}
              />
            )}
          </View>
          {picked && (
            <View style={cal.timePreview}>
              <Text style={cal.timePreviewLabel}>Gewählt</Text>
              <Text style={cal.timePreviewVal}>
                {fmtDate(picked)}
                {"\n"}
                {String(hour).padStart(2, "0")}:
                {String(minute).padStart(2, "0")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={cal.actions}>
        <TouchableOpacity style={cal.cancelBtn} onPress={onClose}>
          <Text style={cal.cancelTxt}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cal.confirmBtn, !picked && cal.confirmBtnDisabled]}
          onPress={confirm}
          disabled={!picked}
        >
          <Text style={cal.confirmTxt}>Übernehmen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={cal.backdrop}>{calContent}</View>
    </Modal>
  );
}

const CAL_CELL = Math.min(26, (Math.min(W, 360) - 28 - 12) / 7);

const cal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10,25,18,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 14,
    width: Math.min(360, W - 32),
    maxHeight: IS_MOBILE ? "78%" : "82%",
    flexShrink: 1,
    ...(IS_WEB
      ? { boxShadow: "0 8px 40px rgba(10,25,18,0.22)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }),
  },
  scrollContent: { paddingBottom: 4 },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleText: { fontSize: 15, fontWeight: "700", color: T.text },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: T.surfaceAlt,
  },
  closeTxt: { fontSize: 20, color: T.textMuted, lineHeight: 22 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navArrow: {
    fontSize: 18,
    color: T.primary,
    fontWeight: "700",
    lineHeight: 22,
  },
  monthLabel: { fontSize: 15, fontWeight: "700", color: T.text },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  weekCell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  weekLabel: { fontSize: 11, fontWeight: "600", color: T.textMuted },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    marginBottom: 1,
  },
  cellToday: { backgroundColor: T.calToday },
  cellSelected: { backgroundColor: T.calSelected },
  cellDisabled: { opacity: 0.3 },
  cellText: { fontSize: 14, color: T.text, fontWeight: "500" },
  cellTextToday: { color: T.primary, fontWeight: "700" },
  cellTextSelected: { color: T.white, fontWeight: "700" },
  cellTextDisabled: { color: T.textLight },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.border,
    marginVertical: 10,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: T.textSec,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  timeBlock: { alignItems: "center", gap: 6 },
  timeUnit: {
    fontSize: 11,
    color: T.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  timeSep: {
    fontSize: 28,
    fontWeight: "700",
    color: T.textMuted,
    marginTop: 16,
  },
  timePreview: {
    flex: 1,
    backgroundColor: T.primarySofter,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: T.accentLight,
  },
  timePreviewLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: T.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timePreviewVal: {
    fontSize: 13,
    fontWeight: "700",
    color: T.primary,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: T.white,
  },
  cancelTxt: { fontSize: 15, fontWeight: "600", color: T.textSec },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: T.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: T.textLight },
  confirmTxt: { fontSize: 15, fontWeight: "700", color: T.white },
});

// ─── DateField ────────────────────────────────────────────────────────────────
function DateField({ label, required, value, onChange, minDate, error }) {
  const [open, setOpen] = useState(false);
  const hasVal = !!value;
  return (
    <View style={s.fieldWrap}>
      {label && (
        <Text style={s.label}>
          {label}
          {required && <Text style={{ color: T.primary }}> *</Text>}
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
            {hasVal ? fmtDateShort(value) : "Datum und Uhrzeit wählen"}
          </Text>
        </View>
        {hasVal && (
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation?.();
              onChange(null);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.dateBtnClear}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {error && <Text style={s.errorMsg}>{error}</Text>}
      <CalendarPicker
        visible={open}
        value={value}
        minDate={minDate}
        title={label}
        onConfirm={(d) => {
          onChange(d);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secTitle}>{title}</Text>
      {subtitle && <Text style={s.secSub}>{subtitle}</Text>}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function HRule() {
  return <View style={s.hrule} />;
}

// ─── User row ─────────────────────────────────────────────────────────────────
function UserRow({ user, selected, onToggle }) {
  const avatarUri = getDisplayAvatarUri(user);
  const [imgErr, setImgErr] = useState(false);
  const displayName =
    user.name ??
    user.fullname ??
    user.full_name ??
    user.username ??
    "Unbekannt";
  const ini = initials(displayName);
  return (
    <TouchableOpacity
      style={[s.userRow, selected && s.userRowSel]}
      onPress={() => onToggle(user.id)}
      activeOpacity={0.65}
    >
      {avatarUri && !imgErr ? (
        <Image
          source={{ uri: avatarUri }}
          style={s.userAvatarImg}
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[s.avatar, s.userAvatarFallback]}>
          <Text style={s.avatarText}>{ini}</Text>
        </View>
      )}
      <View style={s.teamBody}>
        <Text style={[s.teamName, selected && s.teamNameSel]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={s.teamMeta}>ID: {user.id}</Text>
      </View>
      <View style={[s.checkbox, selected && s.checkboxOn]}>
        {selected && <Text style={s.checkTick}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateHybridChallenge({ navigation }) {
  // Form state
  const [name, setName] = useState("");
  const [startLoc, setStartLoc] = useState("");
  const [targetLoc, setTargetLoc] = useState("");
  const [distance, setDistance] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [visibleUsers, setVisibleUsers] = useState(4);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Form
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(-140)).current;
  const toastTimer = useRef(null);

  useEffect(() => {
    loadUsers("");
  }, []);

  const loadUsers = async (q = query) => {
    setLoadingUsers(true);
    const data = q.trim() ? await searchUsers(q, 0, 15) : await getUsers(0, 15);
    setUsers(data || []);
    setVisibleUsers(4);
    setLoadingUsers(false);
  };

  const toggleUser = useCallback((id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const duration = daysBetween(startDate, endDate);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name ist erforderlich";
    if (!startLoc.trim()) e.startLoc = "Startort eingeben";
    if (!targetLoc.trim()) e.targetLoc = "Zielort eingeben";
    if (!distance || isNaN(+distance) || +distance <= 0)
      e.distance = "Gültige Distanz eingeben";
    if (!startDate) e.startDate = "Startdatum wählen";
    if (startDate && startDate < today())
      e.startDate = "Startdatum darf nicht in der Vergangenheit liegen";
    if (!endDate) e.endDate = "Enddatum wählen";
    if (startDate && endDate && endDate <= startDate)
      e.endDate = "Enddatum muss nach Startdatum liegen";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      const payload = {
        name: name.trim(),
        start_location: startLoc.trim(),
        target_location: targetLoc.trim(),
        distance: parseFloat(distance),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        mode: "individual",
        team_ids: [],
        creator_id: parseInt(storedUserId || "0", 10),
      };
      const timeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Zeitüberschreitung. Bitte Verbindung prüfen und erneut versuchen.",
              ),
            ),
          10000,
        ),
      );
      const created = await Promise.race([createChallenge(payload), timeout]);
      if (selectedUserIds.length > 0 && created?.id) {
        try {
          await createBulkChallengeInvites(created.id, selectedUserIds);
        } catch (inviteErr) {
          console.warn("Invites could not be sent:", inviteErr);
        }
      }
      showToast(
        "success",
        "Challenge erstellt! Hier klicken um sie zu sehen.",
        () => router.push("/challenges/hybridIndex"),
      );
    } catch (err) {
      showToast("error", extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: null }));

  function dismissToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.timing(toastAnim, {
      toValue: -140,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }

  function showToast(type, message, onPress) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message, onPress });
    // Animation starts in useEffect below, AFTER the Modal is mounted
  }

  // Start slide-in only after the toast Modal is actually in the native tree
  useEffect(() => {
    if (!toast) return;
    toastAnim.setValue(-140);
    Animated.spring(toastAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 55,
      friction: 11,
    }).start();
    toastTimer.current = setTimeout(dismissToast, 5000);
  }, [toast]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Erstelle deine Challenge</Text>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 1. Grunddaten ─────────────────────────────────────────────── */}
          <SectionHead
            title="Grunddaten"
            subtitle="Name, Strecke und Distanz festlegen"
          />
          <Card>
            {/* Name */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>
                Challenge-Name <Text style={{ color: T.primary }}>*</Text>
              </Text>
              <TextInput
                style={[s.input, errors.name && s.inputError]}
                placeholder="z.B. Graz nach Wien 2026"
                placeholderTextColor={T.textLight}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  clearError("name");
                }}
                maxLength={80}
              />
              {errors.name && <Text style={s.errorMsg}>{errors.name}</Text>}
            </View>

            <HRule />

            {/* Start / Ziel */}
            <View style={IS_MOBILE ? s.col : s.row2}>
              <View style={[s.fieldWrap, !IS_MOBILE && { flex: 1 }]}>
                <Text style={s.label}>
                  Startort <Text style={{ color: T.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[s.input, errors.startLoc && s.inputError]}
                  placeholder="z.B. Graz"
                  placeholderTextColor={T.textLight}
                  value={startLoc}
                  onChangeText={(v) => {
                    setStartLoc(v);
                    clearError("startLoc");
                  }}
                />
                {errors.startLoc && (
                  <Text style={s.errorMsg}>{errors.startLoc}</Text>
                )}
              </View>
              <View style={[s.fieldWrap, !IS_MOBILE && { flex: 1 }]}>
                <Text style={s.label}>
                  Zielort <Text style={{ color: T.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[s.input, errors.targetLoc && s.inputError]}
                  placeholder="z.B. Wien"
                  placeholderTextColor={T.textLight}
                  value={targetLoc}
                  onChangeText={(v) => {
                    setTargetLoc(v);
                    clearError("targetLoc");
                  }}
                />
                {errors.targetLoc && (
                  <Text style={s.errorMsg}>{errors.targetLoc}</Text>
                )}
              </View>
            </View>

            <HRule />

            {/* Distanz */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>
                Distanz <Text style={{ color: T.primary }}>*</Text>
              </Text>
              <View style={s.distRow}>
                <TextInput
                  style={[
                    s.input,
                    s.distInput,
                    errors.distance && s.inputError,
                  ]}
                  placeholder="z.B. 200"
                  placeholderTextColor={T.textLight}
                  value={distance}
                  onChangeText={(v) => {
                    setDistance(v.replace(/[^0-9.]/g, ""));
                    clearError("distance");
                  }}
                  keyboardType="numeric"
                />
                <View style={s.unitChip}>
                  <Text style={s.unitText}>km</Text>
                </View>
              </View>
              {errors.distance && (
                <Text style={s.errorMsg}>{errors.distance}</Text>
              )}
            </View>
          </Card>

          {/* ── 2. Zeitraum ────────────────────────────────────────────────── */}
          <SectionHead
            title="Zeitraum"
            subtitle="Start- und Enddatum der Challenge"
          />
          <Card>
            <View style={IS_MOBILE ? s.col : s.row2}>
              <View style={!IS_MOBILE && { flex: 1 }}>
                <DateField
                  label="Startdatum"
                  required
                  minDate={today()}
                  value={startDate}
                  onChange={(v) => {
                    setStartDate(v);
                    clearError("startDate");
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
                  minDate={
                    startDate
                      ? new Date(startDate.getTime() + 60000)
                      : undefined
                  }
                  onChange={(v) => {
                    setEndDate(v);
                    clearError("endDate");
                  }}
                  error={errors.endDate}
                />
              </View>
            </View>

            {duration && (
              <>
                <HRule />
                <View style={s.durationRow}>
                  <Text style={s.durationLabel}>Gesamtdauer</Text>
                  <View style={s.durationBadge}>
                    <Text style={s.durationVal}>{duration} Tage</Text>
                  </View>
                </View>
              </>
            )}
          </Card>

          {/* ── 3. Einladungen ─────────────────────────────────────────────── */}
          <SectionHead
            title="Einladungen"
            subtitle="Lade Nutzer zur Challenge ein"
          />
          <Card style={s.modeWidget}>
            <View style={s.widgetSearchWrap}>
              <View style={s.searchBox}>
                <Text style={s.searchIcon}>⌕</Text>
                <TextInput
                  style={s.searchInput}
                  placeholder="User suchen…"
                  placeholderTextColor={T.textMuted}
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    loadUsers(text);
                  }}
                />
              </View>
            </View>

            {loadingUsers ? (
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
                  <View key={user.id}>
                    <UserRow
                      user={user}
                      selected={selectedUserIds.includes(user.id)}
                      onToggle={toggleUser}
                    />
                    {i < arr.length - 1 && <View style={s.teamDivider} />}
                  </View>
                ))}
                {visibleUsers < Math.min(users.length, 15) && (
                  <TouchableOpacity
                    style={s.showMoreBtn}
                    onPress={() => setVisibleUsers((v) => Math.min(v + 5, 15))}
                  >
                    <Text style={s.showMoreText}>
                      Mehr anzeigen ({Math.min(users.length, 15) - visibleUsers}{" "}
                      weitere)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card>

          {/* ── Submit ─────────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.submitBtn, submitting && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <Text style={s.submitText}>Challenge erstellen</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Toast ── absolute sibling of KAV, always renders on top ───────── */}
      {toast && (
        <Animated.View
          style={[ts.wrap, { transform: [{ translateY: toastAnim }] }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[ts.inner, toast.type === "success" ? ts.success : ts.error]}
            onPress={() => {
              toast.onPress?.();
              dismissToast();
            }}
            activeOpacity={1}
            pointerEvents="auto"
          >
            <View style={ts.iconWrap}>
              <Text style={ts.iconText}>
                {toast.type === "success" ? "✓" : "!"}
              </Text>
            </View>
            <Text style={ts.message} numberOfLines={3}>
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={dismissToast}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={ts.close}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const INPUT_RADIUS = 12;
const CARD_RADIUS = 16;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Header
  header: {
    paddingTop: 74,
    paddingBottom: 22,
    paddingHorizontal: 20,
    backgroundColor: T.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: IS_MOBILE ? 24 : 30,
    fontWeight: "600",
    color: T.primary,
    letterSpacing: 1.5,
    lineHeight: IS_MOBILE ? 34 : 40,
    textAlign: "center",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: IS_MOBILE ? 16 : 24,
    paddingBottom: 40,
    maxWidth: 740,
    width: "100%",
    alignSelf: "center",
  },

  // Section heading
  secHead: {
    marginBottom: 10,
    marginTop: 20,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: T.primaryLight,
  },
  secTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: T.text,
    letterSpacing: -0.2,
  },
  secSub: { fontSize: 13, color: T.textMuted, marginTop: 2 },

  // Card
  card: {
    backgroundColor: T.white,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: T.border,
    padding: IS_MOBILE ? 16 : 20,
    marginBottom: 4,
    ...(IS_WEB
      ? { boxShadow: "0 1px 6px rgba(15,31,23,0.08)" }
      : {
          shadowColor: "#0F1F17",
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }),
  },

  // Fields
  fieldWrap: { marginBottom: 0 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: T.textSec,
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: T.surfaceAlt,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 13 : 11,
    fontSize: 15,
    color: T.text,
    ...(IS_WEB
      ? { outlineStyle: "none", transition: "border-color 0.15s" }
      : {}),
  },
  inputError: { borderColor: T.danger, backgroundColor: T.dangerSoft },
  errorMsg: { fontSize: 12, color: T.danger, marginTop: 5, fontWeight: "500" },
  teamsErrorWrap: {
    marginTop: 14,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: T.dangerSoft,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: T.danger,
  },
  teamsErrorMsg: { fontSize: 15, color: T.danger, fontWeight: "700" },
  hrule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.border,
    marginVertical: 16,
  },

  // Layout
  row2: { flexDirection: "row", gap: 14 },
  col: { flexDirection: "column", gap: 14 },

  // Distance
  distRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  distInput: { flex: 1, maxWidth: IS_MOBILE ? undefined : 200 },
  unitChip: {
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 13 : 11,
    borderRadius: INPUT_RADIUS,
    backgroundColor: T.primarySoft,
    borderWidth: 1.5,
    borderColor: T.accentLight,
  },
  unitText: { fontSize: 15, fontWeight: "700", color: T.primary },

  // Date button
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.surfaceAlt,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...(IS_WEB ? { cursor: "pointer", transition: "border-color 0.15s" } : {}),
  },
  dateBtnFilled: {
    borderColor: T.accentLight,
    backgroundColor: T.primarySofter,
  },
  dateBtnError: { borderColor: T.danger, backgroundColor: T.dangerSoft },
  dateBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dateBtnIcon: { fontSize: 16, color: T.textLight },
  dateBtnText: { fontSize: 15, color: T.text, fontWeight: "500" },
  dateBtnPlaceholder: { color: T.textLight, fontWeight: "400" },
  dateBtnClear: {
    fontSize: 22,
    color: T.textMuted,
    paddingLeft: 8,
    lineHeight: 24,
  },

  // Duration
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  durationLabel: { fontSize: 15, fontWeight: "600", color: T.textSec },
  durationBadge: {
    backgroundColor: T.successSoft,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.accentLight,
  },
  durationVal: { fontSize: 14, fontWeight: "700", color: T.success },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: INPUT_RADIUS,
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
    ...(IS_WEB ? { boxShadow: "0 1px 4px rgba(15,31,23,0.07)" } : {}),
  },
  searchIcon: { fontSize: 18, color: T.textMuted },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: T.text,
    paddingVertical: 12,
    ...(IS_WEB
      ? { outlineStyle: "none", border: "none", background: "transparent" }
      : {}),
  },
  searchClear: {
    fontSize: 22,
    color: T.textMuted,
    paddingHorizontal: 4,
    lineHeight: 24,
  },

  // Pills
  pillsScroll: { flexGrow: 0, marginBottom: 10 },
  pillsContent: { flexDirection: "row", gap: 8, paddingRight: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.primarySoft,
    borderWidth: 1,
    borderColor: T.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 13, fontWeight: "600", color: T.primary },
  pillX: { fontSize: 18, color: T.primaryMid, lineHeight: 20 },

  // Team list
  teamCard: { padding: 0, overflow: "hidden", marginBottom: 4 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: T.white,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  teamRowSel: { borderLeftColor: T.primary },
  teamDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.border,
    marginLeft: 70,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: T.surfaceAlt,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarSel: { backgroundColor: T.primaryLight, borderColor: T.primaryLight },
  avatarText: { fontSize: 13, fontWeight: "700", color: T.textSec },
  avatarTextSel: { color: T.white },
  teamBody: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: "600", color: T.text },
  teamNameSel: { color: T.primary },
  teamMeta: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: T.border,
    backgroundColor: T.white,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxOn: { backgroundColor: T.primary, borderColor: T.primary },
  checkTick: {
    color: T.white,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 14,
  },

  // States
  teamsCenter: { padding: 36, alignItems: "center", gap: 12 },
  teamsCenterText: { fontSize: 14, color: T.textMuted },
  teamsErrorText: { fontSize: 14, color: T.danger, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: T.primary,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: T.primary },
  emptyText: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: "center",
    paddingVertical: 32,
  },

  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border,
    backgroundColor: T.white,
    borderRadius: 15,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: T.primary,
  },

  // Team Modus
  teamModusDesc: {
    fontSize: 14,
    color: T.textSec,
    lineHeight: 21,
    marginBottom: 18,
  },
  teamModusRow: {
    flexDirection: "row",
    gap: 12,
  },
  teamModusBtn: {
    flex: 1,
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.border,
    backgroundColor: T.surfaceAlt,
    alignItems: "center",
    gap: 6,
    ...(IS_WEB
      ? {
          cursor: "pointer",
          transition: "border-color 0.15s, background-color 0.15s",
        }
      : {}),
  },
  teamModusBtnActive: {
    borderColor: T.primary,
    backgroundColor: T.primarySoft,
    ...(IS_WEB ? { boxShadow: "0 2px 14px rgba(30,92,58,0.18)" } : {}),
  },
  teamModusBtnLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: T.textSec,
    letterSpacing: 0.2,
  },
  teamModusBtnLabelActive: {
    color: T.text,
  },
  teamModusBtnSub: {
    fontSize: 12,
    fontWeight: "500",
    color: T.textMuted,
  },
  teamModusBtnSubActive: {
    color: T.textSec,
  },

  // Mode Widget
  modeWidget: {
    padding: 0,
    marginBottom: 4,
  },
  widgetSearchWrap: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  widgetCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  widgetEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 28,
  },
  widgetEmptyIcon: {
    fontSize: 38,
    color: T.textLight,
    marginBottom: 14,
  },
  widgetEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.textSec,
    textAlign: "center",
    marginBottom: 6,
  },
  widgetEmptySub: {
    fontSize: 13,
    color: T.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },

  // User row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "transparent",
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  userRowSel: {
    borderLeftColor: T.primary,
  },
  userAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    flexShrink: 0,
  },
  userAvatarFallback: {
    backgroundColor: T.primarySofter,
    borderColor: T.accentLight,
  },
  userAvatarFallbackSel: {
    backgroundColor: T.primaryLight,
    borderColor: T.primaryLight,
  },

  // Submit
  submitBtn: {
    backgroundColor: T.primaryLight,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    ...(IS_WEB
      ? { cursor: "pointer", boxShadow: "0 4px 18px rgba(74,158,110,0.35)" }
      : {
          shadowColor: T.primaryLight,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 5,
        }),
  },
  submitBtnDisabled: { backgroundColor: T.textLight },
  submitText: {
    fontSize: 17,
    fontWeight: "700",
    color: T.white,
    letterSpacing: 0.1,
  },
});

// ─── Toast styles ─────────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
    paddingTop: Platform.OS === "ios" ? 58 : 28,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    opacity: 1,
    ...(IS_WEB
      ? { boxShadow: "0 6px 24px rgba(10,25,18,0.35)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        }),
  },
  success: { backgroundColor: "#1E5C3A" },
  error: { backgroundColor: "#B83232" },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  close: {
    fontSize: 24,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 26,
    paddingLeft: 4,
  },
});
