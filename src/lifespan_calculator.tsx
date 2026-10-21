import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Moon, Briefcase, GraduationCap, Coffee, Car,
  Thermometer, Hourglass, PhoneCall, AlertTriangle,
  RouteOff, BookOpen, Smile, Clock, HeartPulse,
  Users, Smartphone, Activity, Calendar, RotateCcw,
  Bookmark, Check, Sparkles, Layers, Grid,
  PieChart as PieChartIcon, Copy, Sun, Compass
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ============================================================================
// CONSTANTS, ACTUARIAL TABLES & ATUS BENCHMARKS
// ============================================================================

const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365.2425; // Exact Gregorian average accounting for leap years
const HOURS_PER_YEAR = DAYS_PER_YEAR * HOURS_PER_DAY; // ~8,765.82 hrs/yr
const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7; // ~52.1775 wks/yr

type BiologicalSex = 'average' | 'male' | 'female';

interface LifespanState {
  // Core Demographics & Actuarial
  currentAge: number;
  sex: BiologicalSex;
  useActuarialLifespan: boolean;
  customLifespan: number;
  healthLifestyleScore: number; // -10 to +10 years modifier based on habits/genetics

  // I. The Inevitable (9 Foundations & Phases)
  sleepHrsPerDay: number;
  routineHrsPerDay: number;
  workHrsPerWeek: number;
  workWeeksPerYear: number;
  encoreWorkHrsPerWeek: number;
  caregivingHrsPerWeek: number;
  caregivingYearsRemaining: number;
  schoolHrsPerDay: number;
  schoolYearsRemaining: number;

  // II. The Friction (9 Unseen Taxes & Schedule Constraints)
  commuteHrsPerWorkday: number;
  workDaysPerWeek: number;
  remoteWorkPercent: number;
  passiveScreenHrsPerDay: number;
  sickDaysPerYear: number;
  adminHrsPerWeek: number;
  waitHrsPerWeek: number;
  disasterHrsPerYear: number;
  detourYearsRemaining: number;

  // III. The Choice (3 Pillars of Deliberate Living)
  exerciseHrsPerWeek: number;
  growthHrsPerWeek: number;
  funHrsPerWeek: number;

  // Horizon Anchor
  retirementAge: number;
}

const ATUS_BENCHMARKS: Record<string, { label: string; value: string; note: string }> = {
  sleep: { label: 'ATUS // 8.6H', value: '8.6', note: 'US BLS average including sleep, naps & bedtime rest' },
  routine: { label: 'ATUS // 2.3H', value: '2.3', note: 'Grooming (0.8h), eating (1.1h), food preparation (0.4h)' },
  work: { label: 'ATUS // 38.5H', value: '38.5', note: 'Full-time civilian employed weekly average' },
  workWeeks: { label: 'US AVG // 49W', value: '49', note: 'Standard 52 weeks minus ~15 days PTO & federal holidays' },
  workDays: { label: 'STD // 5.0D', value: '5', note: 'Standard 5-day full-time workweek' },
  commute: { label: 'CENSUS // 0.9H', value: '0.9', note: 'US Census 27.6 min each way (~55 min round-trip)' },
  caregiving: { label: 'PARENTS // 12H', value: '12', note: 'Primary + secondary childcare/eldercare in active households' },
  sick: { label: 'CDC // 5.0D', value: '5', note: 'Acute illness + mental health days (excluding late-life morbidity)' },
  wait: { label: 'AVG // 1.5H', value: '1.5', note: 'Transit delays, queues, waiting rooms, hold times' },
  admin: { label: 'ATUS // 3.5H', value: '3.5', note: 'Household management, bills, consumer purchases, errands' },
  screen: { label: 'AVG // 2.8H', value: '2.8', note: 'Algorithmic social feeds & passive background television' },
  disaster: { label: 'AVG // 20H', value: '20', note: 'Unplanned vehicle, home, medical, or digital emergencies' },
  exercise: { label: 'WHO // 3.5H', value: '3.5', note: '150–300 min/wk moderate-to-vigorous physical training' },
  growth: { label: 'ATUS // 2.0H', value: '2', note: 'Personal reading, skill acquisition, deliberate craft' },
  fun: { label: 'ATUS // 14.0H', value: '14', note: 'Active socializing, hobbies, arts, intentional recreation' },
};

const DEFAULT_STATE: LifespanState = {
  currentAge: 30,
  sex: 'average',
  useActuarialLifespan: true,
  customLifespan: 81,
  healthLifestyleScore: 0,

  sleepHrsPerDay: 8.0,
  routineHrsPerDay: 2.0,
  workHrsPerWeek: 40,
  workWeeksPerYear: 49,
  workDaysPerWeek: 5,
  retirementAge: 65,
  encoreWorkHrsPerWeek: 0,
  schoolHrsPerDay: 6,
  schoolYearsRemaining: 0,

  caregivingHrsPerWeek: 0,
  caregivingYearsRemaining: 0,

  commuteHrsPerWorkday: 1.0,
  remoteWorkPercent: 20,
  sickDaysPerYear: 5,
  waitHrsPerWeek: 1.5,
  adminHrsPerWeek: 2.5,
  passiveScreenHrsPerDay: 1.5,
  disasterHrsPerYear: 20,
  detourYearsRemaining: 0,

  exerciseHrsPerWeek: 3.0,
  growthHrsPerWeek: 3.5,
  funHrsPerWeek: 10.0,
};

const PRESETS: Record<string, { name: string; code: string; subtitle: string; state: Partial<LifespanState> }> = {
  atus: {
    name: 'US Statistical Mean',
    code: 'I',
    subtitle: 'BLS American Time Use Survey & SSA baseline',
    state: {
      sleepHrsPerDay: 8.5,
      routineHrsPerDay: 2.3,
      workHrsPerWeek: 38.5,
      workWeeksPerYear: 49,
      workDaysPerWeek: 5,
      retirementAge: 66,
      encoreWorkHrsPerWeek: 0,
      commuteHrsPerWorkday: 0.9,
      remoteWorkPercent: 20,
      sickDaysPerYear: 5,
      waitHrsPerWeek: 1.5,
      adminHrsPerWeek: 3.5,
      passiveScreenHrsPerDay: 2.8,
      exerciseHrsPerWeek: 1.5,
      growthHrsPerWeek: 2.0,
      funHrsPerWeek: 12.0,
    },
  },
  hustle: {
    name: 'High-Burn Attrition',
    code: 'II',
    subtitle: '60h/wk onsite, heavy commute, compressed sleep',
    state: {
      sleepHrsPerDay: 6.5,
      routineHrsPerDay: 1.5,
      workHrsPerWeek: 60,
      workWeeksPerYear: 50,
      workDaysPerWeek: 5.5,
      retirementAge: 62,
      commuteHrsPerWorkday: 1.5,
      remoteWorkPercent: 0,
      sickDaysPerYear: 8,
      waitHrsPerWeek: 2.5,
      adminHrsPerWeek: 3.0,
      passiveScreenHrsPerDay: 1.5,
      exerciseHrsPerWeek: 1.5,
      growthHrsPerWeek: 2.0,
      funHrsPerWeek: 6.0,
    },
  },
  fire: {
    name: 'Sovereign / Early Exit',
    code: 'III',
    subtitle: 'Remote autonomy, low friction, retire at 50',
    state: {
      sleepHrsPerDay: 8.0,
      routineHrsPerDay: 2.0,
      workHrsPerWeek: 40,
      workWeeksPerYear: 48,
      workDaysPerWeek: 5,
      retirementAge: 50,
      encoreWorkHrsPerWeek: 8,
      commuteHrsPerWorkday: 0.5,
      remoteWorkPercent: 80,
      sickDaysPerYear: 3,
      waitHrsPerWeek: 1.0,
      adminHrsPerWeek: 2.0,
      passiveScreenHrsPerDay: 0.5,
      exerciseHrsPerWeek: 5.0,
      growthHrsPerWeek: 6.0,
      funHrsPerWeek: 14.0,
    },
  },
  parent: {
    name: 'Family & Lineage',
    code: 'IV',
    subtitle: 'Full-time career + 18 yrs dedicated parenting',
    state: {
      sleepHrsPerDay: 7.5,
      routineHrsPerDay: 2.5,
      workHrsPerWeek: 40,
      workWeeksPerYear: 49,
      workDaysPerWeek: 5,
      retirementAge: 65,
      caregivingHrsPerWeek: 18,
      caregivingYearsRemaining: 18,
      commuteHrsPerWorkday: 0.75,
      remoteWorkPercent: 40,
      passiveScreenHrsPerDay: 1.0,
      exerciseHrsPerWeek: 2.5,
      growthHrsPerWeek: 2.5,
      funHrsPerWeek: 8.0,
    },
  },
};

function calculateActuarialProjection(state: LifespanState) {
  const baseAtBirth = state.sex === 'female' ? 81.2 : state.sex === 'male' ? 76.1 : 78.6;
  const age = state.currentAge;

  let survivalBonus = 0;
  if (age <= 20) {
    survivalBonus = age * 0.04;
  } else if (age <= 50) {
    survivalBonus = 0.8 + (age - 20) * 0.065;
  } else if (age <= 75) {
    survivalBonus = 2.75 + (age - 50) * 0.18;
  } else {
    survivalBonus = 7.25 + (age - 75) * 0.38;
  }

  const exerciseBonus =
    state.exerciseHrsPerWeek >= 5
      ? 3.2
      : state.exerciseHrsPerWeek >= 2.5
      ? 1.8
      : state.exerciseHrsPerWeek < 1
      ? -1.5
      : 0;

  const sleepBonus =
    state.sleepHrsPerDay >= 7 && state.sleepHrsPerDay <= 8.5
      ? 1.0
      : state.sleepHrsPerDay < 6
      ? -2.2
      : state.sleepHrsPerDay < 6.5
      ? -1.0
      : -0.5;

  const workStressPenalty =
    state.workHrsPerWeek >= 60 ? -2.0 : state.workHrsPerWeek >= 55 ? -1.0 : 0;

  const calculatedLifespan = Math.round(
    Math.max(
      state.currentAge + 1,
      Math.min(
        115,
        baseAtBirth +
          survivalBonus +
          exerciseBonus +
          sleepBonus +
          workStressPenalty +
          state.healthLifestyleScore
      )
    )
  );

  const effectiveLifespan = state.useActuarialLifespan
    ? calculatedLifespan
    : Math.max(state.currentAge + 1, state.customLifespan);

  const lateLifeMorbidityRatio =
    0.115 -
    (state.exerciseHrsPerWeek >= 3.5 ? 0.02 : 0) +
    (state.sleepHrsPerDay < 6 ? 0.015 : 0);
  const morbidityYears = Math.max(
    1,
    Math.round(effectiveLifespan * Math.max(0.06, Math.min(0.18, lateLifeMorbidityRatio)))
  );
  const healthspanAge = Math.max(state.currentAge, effectiveLifespan - morbidityYears);

  return {
    effectiveLifespan,
    calculatedLifespan,
    healthspanAge,
    morbidityYears,
    lifestyleDelta: +(exerciseBonus + sleepBonus + workStressPenalty + state.healthLifestyleScore).toFixed(1),
  };
}

// ============================================================================
// ARCHITECTURAL HELPERS & ANGULAR INSTRUMENT COMPONENTS
// ============================================================================

const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));

/** Corner Reticles for Angular Monolith Framing */
const CornerReticles: React.FC<{ color?: string }> = ({ color = 'border-zinc-600/70' }) => (
  <>
    <span className={`pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 ${color}`} />
    <span className={`pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 ${color}`} />
    <span className={`pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 ${color}`} />
    <span className={`pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 ${color}`} />
  </>
);

/** Centered Symmetrical Section Header */
const AxialSectionHeader: React.FC<{
  roman: string;
  title: string;
  subtitle: string;
  accentColor: string;
  totalHours: number;
  wakingPct: string;
}> = ({ roman, title, subtitle, accentColor, totalHours, wakingPct }) => (
  <div className="relative mb-8">
    {/* Symmetrical Horizontal Axis */}
    <div className="flex items-center justify-center gap-4 mb-3">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-zinc-700" />
      <div className="flex items-center gap-2.5 px-4 py-1 bg-[#0b0c10] border border-zinc-800 text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400">
        <span className="w-2 h-2 rotate-45 inline-block" style={{ backgroundColor: accentColor }} />
        <span>SECTION {roman}</span>
        <span className="text-zinc-600">//</span>
        <span className="text-zinc-200 font-bold">{formatNum(totalHours)} HRS</span>
        <span className="text-zinc-500">({wakingPct}% WAKING)</span>
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-zinc-700" />
    </div>

    <div className="text-center max-w-2xl mx-auto">
      <h2
        className="text-2xl md:text-3xl font-bold uppercase tracking-[0.12em] text-white"
        style={{ fontFamily: "'Cinzel', 'Space Grotesk', serif" }}
      >
        {title}
      </h2>
      <p className="text-xs md:text-sm text-zinc-400 mt-1.5 tracking-wide">{subtitle}</p>
    </div>
  </div>
);

interface SliderControlProps {
  indexCode: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  hours: number;
  colorClass: string;
  accentHex: string;
  benchmark?: { label: string; value: string; note: string };
  subtitle?: string;
  secondaryNote?: string;
}

const SliderControl: React.FC<SliderControlProps> = React.memo(({
  indexCode,
  label,
  icon: Icon,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  hours,
  colorClass,
  accentHex,
  benchmark,
  subtitle,
  secondaryNote,
}) => {
  const fillPct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className="relative bg-[#0a0b0f] border border-zinc-800/90 p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-zinc-600 hover:bg-[#0d0e14] group">
      <CornerReticles color="border-zinc-700/60 group-hover:border-zinc-400 transition-colors" />

      {/* Top Accent Hairline */}
      <div
        className="absolute top-0 left-6 right-6 h-[1px] opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentHex }}
      />

      {/* Row 1: Symmetrical Header (Icon + Title Left | Tabular Value Right) */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-8 h-8 flex-shrink-0 bg-zinc-900/90 border border-zinc-800 flex items-center justify-center mt-0.5"
            style={{ borderColor: `${accentHex}44` }}
          >
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-600 tracking-widest">{indexCode}</span>
              <span className="font-semibold text-sm text-zinc-100 tracking-wide truncate">{label}</span>
            </div>
            {subtitle && (
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0 bg-zinc-950/90 border border-zinc-800/90 px-2.5 py-1">
          <span className="text-lg font-extrabold text-white font-mono tracking-tight">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 ml-1 font-mono">{unit}</span>
        </div>
      </div>

      {/* Row 2: Precision Angular Track with Live Progress Fill */}
      <div className="relative py-1 flex items-center">
        <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden pointer-events-none">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${fillPct}%`,
              background: `linear-gradient(90deg, ${accentHex}55 0%, ${accentHex} 100%)`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="angular-slider absolute inset-0 w-full h-full opacity-100 cursor-pointer"
          style={{ color: accentHex }}
        />
      </div>

      {/* Row 3: Symmetrical Footer (Benchmark Left | Lifetime Cost Right) */}
      <div className="flex justify-between items-center text-[11px] font-mono pt-1 border-t border-zinc-900">
        {benchmark ? (
          <button
            type="button"
            onClick={() => onChange(parseFloat(benchmark.value))}
            title={`${benchmark.note} (Click to calibrate)`}
            className="text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 px-2 py-0.5 transition-all uppercase tracking-wider text-[10px]"
          >
            [{benchmark.label}]
          </button>
        ) : (
          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">
            RANGE // {min}–{max} {unit}
          </span>
        )}

        <div className="text-right">
          {secondaryNote ? (
            <span className="text-zinc-400">{secondaryNote}</span>
          ) : (
            <span>
              <strong className="text-zinc-200">{formatNum(hours)}</strong>{' '}
              <span className="text-zinc-500">HRS</span>{' '}
              <span className="text-zinc-600">//</span>{' '}
              <span className="text-zinc-400">{(hours / HOURS_PER_YEAR).toFixed(1)}Y</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

const STORAGE_KEY = 'finite_canvas_v2_state';
const BASELINE_STORAGE_KEY = 'finite_canvas_v2_baseline';

export default function LifespanApp() {
  const [state, setState] = useState<LifespanState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_STATE;
  });

  const [baseline, setBaseline] = useState<LifespanState | null>(() => {
    try {
      const saved = localStorage.getItem(BASELINE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'breakdown' | 'timeline' | 'weeks' | 'daily'>('breakdown');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [hoveredAge, setHoveredAge] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [state]);

  const updateField = useCallback(<K extends keyof LifespanState>(field: K, value: LifespanState[K]) => {
    setActivePreset(null);
    setState((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'currentAge') {
        const ageVal = value as number;
        if (next.customLifespan <= ageVal) next.customLifespan = ageVal + 5;
      }
      return next;
    });
  }, []);

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setActivePreset(key);
    setState((prev) => ({
      ...prev,
      ...preset.state,
    }));
  };

  // ============================================================================
  // RIGOROUS YEAR-BY-YEAR SIMULATION ENGINE
  // ============================================================================

  const simulateLifecycle = useCallback((s: LifespanState) => {
    const actuarial = calculateActuarialProjection(s);
    const lifespan = actuarial.effectiveLifespan;
    const yearsRemaining = Math.max(0, lifespan - s.currentAge);
    const hoursLived = s.currentAge * HOURS_PER_YEAR;
    const totalRemainingHours = yearsRemaining * HOURS_PER_YEAR;
    const totalLifespanHours = lifespan * HOURS_PER_YEAR;
    const livedPercentage = totalLifespanHours > 0 ? (hoursLived / totalLifespanHours) * 100 : 100;

    const totals = {
      sleep: 0,
      routine: 0,
      work: 0,
      school: 0,
      caregiving: 0,
      commute: 0,
      sick: 0,
      wait: 0,
      admin: 0,
      screen: 0,
      disaster: 0,
      detour: 0,
      exercise: 0,
      growth: 0,
      fun: 0,
      free: 0,
      healthyFree: 0,
    };

    const yearlyTimeline: Array<{
      age: number;
      phase: 'Career' | 'Education' | 'Golden Retirement' | 'Late-Life Fragility';
      isHealthy: boolean;
      Sleep: number;
      Routine: number;
      WorkAndSchool: number;
      Caregiving: number;
      Friction: number;
      Intentional: number;
      FreeTime: number;
      dailyOverbookedHrs: number;
    }> = [];

    let remainingDetourYears = Math.min(yearsRemaining, s.detourYearsRemaining);

    for (let y = 0; y < yearsRemaining; y++) {
      const age = s.currentAge + y;
      const isWorkingYear = age < s.retirementAge;
      const isSchoolYear = y < s.schoolYearsRemaining;
      const isCaregivingYear = y < s.caregivingYearsRemaining;
      const isHealthyYear = age < actuarial.healthspanAge;

      const yrSleep = s.sleepHrsPerDay * DAYS_PER_YEAR;
      const yrRoutine = s.routineHrsPerDay * DAYS_PER_YEAR;
      const wakingNonRoutineHrsPerDay = Math.max(0, HOURS_PER_DAY - s.sleepHrsPerDay - s.routineHrsPerDay);

      let detourFractionThisYear = 0;
      if (remainingDetourYears > 0) {
        detourFractionThisYear = Math.min(1, remainingDetourYears);
        remainingDetourYears -= detourFractionThisYear;
      }
      const yrDetour = detourFractionThisYear * wakingNonRoutineHrsPerDay * DAYS_PER_YEAR;
      const activeYearScale = 1 - detourFractionThisYear;

      const lateLifeExtraSickDays = isHealthyYear ? 0 : 35;
      const effectiveSickDays = Math.min(DAYS_PER_YEAR, s.sickDaysPerYear + lateLifeExtraSickDays);
      const yrSick = effectiveSickDays * wakingNonRoutineHrsPerDay * activeYearScale;

      const yrWork = isWorkingYear
        ? s.workHrsPerWeek * s.workWeeksPerYear * activeYearScale
        : s.encoreWorkHrsPerWeek * WEEKS_PER_YEAR * (isHealthyYear ? 1 : 0.3) * activeYearScale;

      const onsiteWorkdaysPerYear = isWorkingYear
        ? s.workDaysPerWeek * s.workWeeksPerYear * (1 - s.remoteWorkPercent / 100)
        : 0;
      const yrCommute = s.commuteHrsPerWorkday * onsiteWorkdaysPerYear * activeYearScale;

      const yrSchool = isSchoolYear ? s.schoolHrsPerDay * 190 * activeYearScale : 0;
      const yrCaregiving = isCaregivingYear ? s.caregivingHrsPerWeek * WEEKS_PER_YEAR * activeYearScale : 0;

      const yrWait = s.waitHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;
      const yrAdmin = s.adminHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;
      const yrScreen = s.passiveScreenHrsPerDay * DAYS_PER_YEAR * activeYearScale;
      const yrDisaster = s.disasterHrsPerYear * activeYearScale;

      const yrExercise = s.exerciseHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;
      const yrGrowth = s.growthHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;
      const yrFun = s.funHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;

      const yrCommitted =
        yrSleep +
        yrRoutine +
        yrDetour +
        yrSick +
        yrWork +
        yrCommute +
        yrSchool +
        yrCaregiving +
        yrWait +
        yrAdmin +
        yrScreen +
        yrDisaster +
        yrExercise +
        yrGrowth +
        yrFun;

      const yrFree = HOURS_PER_YEAR - yrCommitted;

      totals.sleep += yrSleep;
      totals.routine += yrRoutine;
      totals.work += yrWork;
      totals.school += yrSchool;
      totals.caregiving += yrCaregiving;
      totals.commute += yrCommute;
      totals.sick += yrSick;
      totals.wait += yrWait;
      totals.admin += yrAdmin;
      totals.screen += yrScreen;
      totals.disaster += yrDisaster;
      totals.detour += yrDetour;
      totals.exercise += yrExercise;
      totals.growth += yrGrowth;
      totals.fun += yrFun;
      totals.free += yrFree;
      if (isHealthyYear && yrFree > 0) {
        totals.healthyFree += yrFree;
      }

      const phase = isSchoolYear
        ? 'Education'
        : isWorkingYear
        ? 'Career'
        : isHealthyYear
        ? 'Golden Retirement'
        : 'Late-Life Fragility';

      yearlyTimeline.push({
        age,
        phase,
        isHealthy: isHealthyYear,
        Sleep: +(yrSleep / DAYS_PER_YEAR).toFixed(2),
        Routine: +(yrRoutine / DAYS_PER_YEAR).toFixed(2),
        WorkAndSchool: +((yrWork + yrSchool + yrCommute) / DAYS_PER_YEAR).toFixed(2),
        Caregiving: +(yrCaregiving / DAYS_PER_YEAR).toFixed(2),
        Friction: +((yrSick + yrWait + yrAdmin + yrScreen + yrDisaster + yrDetour) / DAYS_PER_YEAR).toFixed(2),
        Intentional: +((yrExercise + yrGrowth + yrFun) / DAYS_PER_YEAR).toFixed(2),
        FreeTime: +(Math.max(0, yrFree) / DAYS_PER_YEAR).toFixed(2),
        dailyOverbookedHrs: yrFree < 0 ? +(Math.abs(yrFree) / DAYS_PER_YEAR).toFixed(2) : 0,
      });
    }

    const dailyWorkHrsOnWorkday = s.workDaysPerWeek > 0 ? s.workHrsPerWeek / s.workDaysPerWeek : 0;
    const dailyCommuteOnWorkday = s.commuteHrsPerWorkday * (1 - s.remoteWorkPercent / 100);
    const dailySchoolNow = s.schoolYearsRemaining > 0 ? s.schoolHrsPerDay : 0;
    const dailyCaregivingNow = s.caregivingYearsRemaining > 0 ? s.caregivingHrsPerWeek / 7 : 0;
    const dailyFrictionNow =
      (s.waitHrsPerWeek + s.adminHrsPerWeek) / 7 +
      s.passiveScreenHrsPerDay +
      s.disasterHrsPerYear / DAYS_PER_YEAR;
    const dailyIntentionalNow = (s.exerciseHrsPerWeek + s.growthHrsPerWeek + s.funHrsPerWeek) / 7;

    const currentWorkdayUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      (s.currentAge < s.retirementAge ? dailyWorkHrsOnWorkday + dailyCommuteOnWorkday : s.encoreWorkHrsPerWeek / 5) +
      dailySchoolNow +
      dailyCaregivingNow +
      dailyFrictionNow +
      dailyIntentionalNow;

    const currentWeekendUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      dailyCaregivingNow +
      dailyFrictionNow +
      dailyIntentionalNow;

    const retirementDayUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      s.encoreWorkHrsPerWeek / 7 +
      dailyFrictionNow +
      dailyIntentionalNow;

    return {
      actuarial,
      lifespan,
      yearsRemaining,
      hoursLived,
      totalRemainingHours,
      totalLifespanHours,
      livedPercentage,
      totals,
      yearlyTimeline,
      dailyAudit: {
        workdayUsed: currentWorkdayUsed,
        workdayFree: HOURS_PER_DAY - currentWorkdayUsed,
        weekendUsed: currentWeekendUsed,
        weekendFree: HOURS_PER_DAY - currentWeekendUsed,
        retirementUsed: retirementDayUsed,
        retirementFree: HOURS_PER_DAY - retirementDayUsed,
      },
    };
  }, []);

  const sim = useMemo(() => simulateLifecycle(state), [state, simulateLifecycle]);
  const baselineSim = useMemo(
    () => (baseline ? simulateLifecycle(baseline) : null),
    [baseline, simulateLifecycle]
  );

  const calculations = useMemo(() => {
    const t = sim.totals;
    return [
      { id: 'sleep', name: 'Sleep & Nocturnal Rest', hours: t.sleep, color: '#2563eb', category: 'inevitable', icon: Moon },
      { id: 'routine', name: 'Daily Maintenance & Rituals', hours: t.routine, color: '#0d9488', category: 'inevitable', icon: Coffee },
      { id: 'work', name: 'Career & Encore Labor', hours: t.work, color: '#ea580c', category: 'inevitable', icon: Briefcase },
      { id: 'school', name: 'Academic Study & Training', hours: t.school, color: '#9333ea', category: 'inevitable', icon: GraduationCap },
      { id: 'caregiving', name: 'Family & Lineage Caregiving', hours: t.caregiving, color: '#db2777', category: 'inevitable', icon: Users },

      { id: 'commute', name: 'Onsite Transit & Commuting', hours: t.commute, color: '#64748b', category: 'friction', icon: Car },
      { id: 'screen', name: 'Algorithmic / Screen Drift', hours: t.screen, color: '#6366f1', category: 'friction', icon: Smartphone },
      { id: 'sick', name: 'Illness & Late-Life Morbidity', hours: t.sick, color: '#dc2626', category: 'friction', icon: Thermometer },
      { id: 'admin', name: 'Life Admin & Bureaucracy', hours: t.admin, color: '#ca8a04', category: 'friction', icon: PhoneCall },
      { id: 'wait', name: 'Queues, Delays & Traffic', hours: t.wait, color: '#78716c', category: 'friction', icon: Hourglass },
      { id: 'disaster', name: 'Unexpected Disasters', hours: t.disaster, color: '#f97316', category: 'friction', icon: AlertTriangle },
      { id: 'detour', name: 'Major Life Detours', hours: t.detour, color: '#991b1b', category: 'friction', icon: RouteOff },

      { id: 'exercise', name: 'Physical Vitality & Sport', hours: t.exercise, color: '#10b981', category: 'choice', icon: Activity },
      { id: 'growth', name: 'Mastery & Deep Craft', hours: t.growth, color: '#059669', category: 'choice', icon: BookOpen },
      { id: 'fun', name: 'True Leisure & Communion', hours: t.fun, color: '#06b6d4', category: 'choice', icon: Smile },
    ];
  }, [sim.totals]);

  const trulyFreeRemainingHours = sim.totals.free;
  const healthyFreeRemainingHours = sim.totals.healthyFree;
  const wakingHoursRemaining = Math.max(1, sim.totalRemainingHours - sim.totals.sleep);

  const inevitableHours =
    sim.totals.sleep + sim.totals.routine + sim.totals.work + sim.totals.school + sim.totals.caregiving;
  const frictionHours =
    sim.totals.commute +
    sim.totals.screen +
    sim.totals.sick +
    sim.totals.admin +
    sim.totals.wait +
    sim.totals.disaster +
    sim.totals.detour;
  const choiceHours = sim.totals.exercise + sim.totals.growth + sim.totals.fun;

  const totalSovereignHours = Math.max(0, trulyFreeRemainingHours) + choiceHours;

  const chartData = useMemo(() => {
    return [
      ...calculations.filter((c) => c.hours > 0),
      ...(trulyFreeRemainingHours > 0
        ? [
            {
              id: 'free',
              name: 'Unallocated Sovereign Time',
              hours: trulyFreeRemainingHours,
              color: '#22c55e',
              category: 'free',
              icon: Sparkles,
            },
          ]
        : []),
    ];
  }, [calculations, trulyFreeRemainingHours]);

  const toggleBaseline = () => {
    if (baseline) {
      setBaseline(null);
      localStorage.removeItem(BASELINE_STORAGE_KEY);
    } else {
      setBaseline(state);
      localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(state));
    }
  };

  const copyScenarioJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const freeDeltaHrs = baselineSim ? trulyFreeRemainingHours - baselineSim.totals.free : null;
  const lifespanDeltaYrs = baselineSim ? sim.lifespan - baselineSim.lifespan : null;

  const inspectedAge = hoveredAge !== null ? hoveredAge : state.currentAge;
  const inspectedRow = sim.yearlyTimeline.find((r) => r.age === inspectedAge);

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 relative overflow-x-hidden selection:bg-red-600/30">
      {/* Subtle Sacred Geometry & Architectural Background Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Top Axial Zenith Glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px] opacity-20 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, #dc2626 0%, #991b1b 45%, transparent 75%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        
        {/* ============================================================================
            1. CEREMONIAL AXIAL HEADER & SYMMETRICAL COMMAND BAR
           ============================================================================ */}
        <header className="space-y-6">
          {/* Top Crest & Flanking Geometric Lines */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-red-900/60" />
            <div className="flex items-center gap-3 px-4 py-1 border border-zinc-800 bg-[#090a0f]">
              <span className="w-1.5 h-1.5 rotate-45 bg-red-600" />
              <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-400">
                MEMENTO MORI // ACTUARIAL HOROLOGY
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-red-600" />
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-red-900/60" />
          </div>

          {/* Centered Monumental Title */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.14em] text-white"
              style={{ fontFamily: "'Cinzel', 'Space Grotesk', serif" }}
            >
              The Finite Canvas
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-zinc-400 font-normal tracking-wide leading-relaxed">
              Every solar year grants exactly <span className="text-zinc-200 font-mono font-semibold">8,765.82</span> hours.
              An architectural ledger of mortality, phase transitions, and sovereign freedom.
            </p>
          </div>

          {/* Symmetrical Command Bar (4 Archetypes Left | 3 Telemetry Controls Right) */}
          <div className="relative bg-[#090a0e] border border-zinc-800/90 p-3 flex flex-col lg:flex-row items-center justify-between gap-3">
            <CornerReticles />

            <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 px-2 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-red-500" />
                ARCHETYPES:
              </span>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  title={preset.subtitle}
                  className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 border transition-all ${
                    activePreset === key
                      ? 'bg-red-950/60 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)]'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                  }`}
                >
                  <span className="text-red-500 mr-1.5">{preset.code}.</span>
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="hidden lg:block w-[1px] h-6 bg-zinc-800" />

            <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
              <button
                type="button"
                onClick={toggleBaseline}
                className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 border flex items-center gap-1.5 transition-all ${
                  baseline
                    ? 'bg-amber-950/50 border-amber-500/80 text-amber-300'
                    : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {baseline ? 'CLEAR BASELINE' : 'PIN BASELINE'}
              </button>

              <button
                type="button"
                onClick={copyScenarioJson}
                className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 flex items-center gap-1.5 transition-all"
              >
                {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedNotice ? 'COPIED' : 'EXPORT JSON'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset(null);
                  setState(DEFAULT_STATE);
                }}
                className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-red-800 hover:text-red-300 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET
              </button>
            </div>
          </div>
        </header>

        {/* ============================================================================
            2. SYMMETRICAL TWIN-MONOLITH HERO (6 COLS LEFT | 6 COLS RIGHT)
           ============================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT MONOLITH (6 COLS): TEMPORAL HORIZON & ACTUARIAL CALIBRATION */}
          <div className="lg:col-span-6 relative bg-[#090a0f] border border-zinc-800 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <CornerReticles color="border-zinc-500/80" />
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-red-600/70 to-transparent" />

            {/* Top Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/90">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rotate-45 bg-red-600" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-300 font-bold">
                  01 // TEMPORAL HORIZON CALIBRATION
                </span>
              </div>

              <div className="flex items-center border border-zinc-800 bg-zinc-950 p-0.5">
                <button
                  type="button"
                  onClick={() => updateField('useActuarialLifespan', true)}
                  className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 transition-all ${
                    state.useActuarialLifespan
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  ACTUARIAL ({sim.actuarial.calculatedLifespan}Y)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('useActuarialLifespan', false)}
                  className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 transition-all ${
                    !state.useActuarialLifespan
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  MANUAL
                </button>
              </div>
            </div>

            {/* Cohort Selector Bar */}
            <div className="grid grid-cols-3 gap-2">
              {(['average', 'female', 'male'] as BiologicalSex[]).map((sexOpt) => (
                <button
                  key={sexOpt}
                  type="button"
                  disabled={!state.useActuarialLifespan}
                  onClick={() => updateField('sex', sexOpt)}
                  className={`py-2 px-3 border text-center font-mono text-xs uppercase tracking-widest transition-all ${
                    !state.useActuarialLifespan
                      ? 'opacity-40 cursor-not-allowed border-zinc-900 bg-zinc-950 text-zinc-600'
                      : state.sex === sexOpt
                      ? 'bg-zinc-800/90 border-zinc-500 text-white font-bold shadow-inner'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  COHORT // {sexOpt}
                </button>
              ))}
            </div>

            {/* 3 Symmetrical Primary Horizon Dials */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dial 1: Current Age */}
              <div className="bg-zinc-950/80 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">CURRENT AGE</span>
                  <span className="text-xl font-black font-mono text-white">{state.currentAge}Y</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={Math.max(16, sim.lifespan - 1)}
                  value={state.currentAge}
                  onChange={(e) => updateField('currentAge', parseInt(e.target.value, 10))}
                  className="angular-slider w-full"
                  style={{ color: '#dc2626' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>EXPENDED</span>
                  <span className="text-zinc-300">{sim.livedPercentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Dial 2: Retirement Age */}
              <div className="bg-zinc-950/80 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">EXIT CAREER</span>
                  <span className="text-xl font-black font-mono text-orange-400">
                    {state.retirementAge <= state.currentAge ? 'NOW' : `${state.retirementAge}Y`}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.min(state.currentAge, 45)}
                  max={Math.min(90, sim.lifespan)}
                  value={state.retirementAge}
                  onChange={(e) => updateField('retirementAge', parseInt(e.target.value, 10))}
                  className="angular-slider w-full"
                  style={{ color: '#ea580c' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>LABOR LEFT</span>
                  <span className="text-orange-300">
                    {Math.max(0, Math.min(sim.lifespan, state.retirementAge) - state.currentAge)}Y
                  </span>
                </div>
              </div>

              {/* Dial 3: Longevity Offset or Manual Lifespan */}
              {state.useActuarialLifespan ? (
                <div className="bg-zinc-950/80 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">GENETIC DELTA</span>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {state.healthLifestyleScore > 0 ? `+${state.healthLifestyleScore}` : state.healthLifestyleScore}Y
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={state.healthLifestyleScore}
                    onChange={(e) => updateField('healthLifestyleScore', parseInt(e.target.value, 10))}
                    className="angular-slider w-full"
                    style={{ color: '#10b981' }}
                  />
                  <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>NET MODIFIER</span>
                    <span className="text-emerald-300">
                      {sim.actuarial.lifestyleDelta >= 0 ? `+${sim.actuarial.lifestyleDelta}Y` : `${sim.actuarial.lifestyleDelta}Y`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950/80 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">HORIZON AGE</span>
                    <span className="text-xl font-black font-mono text-white">{sim.lifespan}Y</span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(40, state.currentAge + 1)}
                    max={115}
                    value={state.customLifespan}
                    onChange={(e) => updateField('customLifespan', parseInt(e.target.value, 10))}
                    className="angular-slider w-full"
                    style={{ color: '#a1a1aa' }}
                  />
                  <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>HEALTHSPAN</span>
                    <span className="text-emerald-300">~{sim.actuarial.healthspanAge}Y</span>
                  </div>
                </div>
              )}
            </div>

            {/* Precision 3-Phase Horizon Bar & Symmetrical Legend */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/80">
              <div className="w-full bg-zinc-950 h-4 flex overflow-hidden border border-zinc-800 p-0.5 gap-0.5">
                <div
                  className="bg-zinc-600 h-full transition-all duration-500"
                  style={{ width: `${sim.livedPercentage}%` }}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, ((sim.actuarial.healthspanAge - state.currentAge) / sim.lifespan) * 100)}%`,
                  }}
                />
                <div
                  className="bg-red-800 h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, ((sim.lifespan - sim.actuarial.healthspanAge) / sim.lifespan) * 100)}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2 h-2 bg-zinc-600 inline-block" />
                  <span>PAST: {state.currentAge}Y</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 bg-emerald-500 inline-block" />
                  <span>VITAL: {Math.max(0, sim.actuarial.healthspanAge - state.currentAge)}Y</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-red-400">
                  <span className="w-2 h-2 bg-red-800 inline-block" />
                  <span>TWILIGHT: {sim.actuarial.morbidityYears}Y</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MONOLITH (6 COLS): SOVEREIGN TIME & DISCRETIONARY CAPITAL */}
          <div
            className={`lg:col-span-6 relative bg-[#090a0f] border p-6 md:p-8 flex flex-col justify-between space-y-6 ${
              trulyFreeRemainingHours < 0 ? 'border-red-800/90' : 'border-zinc-800'
            }`}
          >
            <CornerReticles color={trulyFreeRemainingHours < 0 ? 'border-red-500' : 'border-emerald-500/80'} />
            <div
              className="absolute top-0 left-10 right-10 h-[1px]"
              style={{
                background:
                  trulyFreeRemainingHours < 0
                    ? 'linear-gradient(90deg, transparent, #dc2626, transparent)'
                    : 'linear-gradient(90deg, transparent, #10b981, transparent)',
              }}
            />

            {/* Top Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/90">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rotate-45 ${
                    trulyFreeRemainingHours < 0 ? 'bg-red-500' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-300 font-bold">
                  02 // {trulyFreeRemainingHours < 0 ? 'TEMPORAL INSOLVENCY' : 'UNALLOCATED SOVEREIGN TIME'}
                </span>
              </div>

              <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300">
                HORIZON // {sim.lifespan} YEARS ({sim.yearsRemaining}Y LEFT)
              </span>
            </div>

            {/* Central Monumental Number Readout */}
            <div className="text-center py-2 space-y-2">
              <div className="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tighter text-white">
                {formatNum(trulyFreeRemainingHours)}
                <span className="text-lg sm:text-xl font-normal text-zinc-500 ml-3 tracking-widest uppercase">
                  HRS
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <span
                  className={`text-xs font-mono uppercase tracking-widest px-3 py-1 border ${
                    trulyFreeRemainingHours >= 0
                      ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                      : 'bg-red-950/50 border-red-800 text-red-300'
                  }`}
                >
                  {trulyFreeRemainingHours >= 0
                    ? `≈ ${(trulyFreeRemainingHours / HOURS_PER_YEAR).toFixed(2)} YEARS OF UNSCRIPTED AUTONOMY`
                    : `OVERBOOKED BY ${(Math.abs(trulyFreeRemainingHours) / sim.yearsRemaining / DAYS_PER_YEAR).toFixed(1)} HRS/DAY`}
                </span>

                {baselineSim && (
                  <span className="text-xs font-mono uppercase tracking-wider px-3 py-1 bg-amber-950/40 border border-amber-700/70 text-amber-300">
                    DELTA:{' '}
                    <strong className={freeDeltaHrs && freeDeltaHrs >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {freeDeltaHrs && freeDeltaHrs >= 0 ? `+${formatNum(freeDeltaHrs)}` : formatNum(freeDeltaHrs || 0)} HRS
                    </strong>
                    {lifespanDeltaYrs !== 0 && ` (${lifespanDeltaYrs && lifespanDeltaYrs > 0 ? `+${lifespanDeltaYrs}` : lifespanDeltaYrs}Y)`}
                  </span>
                )}
              </div>
            </div>

            {/* Symmetrical 2x2 Sub-Telemetry Matrix */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
              <div className="bg-zinc-950/90 border border-zinc-800/90 p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  PEAK HEALTHSPAN FREE
                </span>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 mt-1">
                  {formatNum(healthyFreeRemainingHours)}{' '}
                  <span className="text-xs font-normal text-zinc-500">
                    ({(healthyFreeRemainingHours / HOURS_PER_YEAR).toFixed(1)}Y)
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950/90 border border-zinc-800/90 p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  SOVEREIGN (CHOICE + FREE)
                </span>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-cyan-400 mt-1">
                  {formatNum(totalSovereignHours)}{' '}
                  <span className="text-xs font-normal text-zinc-500">
                    ({((totalSovereignHours / wakingHoursRemaining) * 100).toFixed(0)}% WAKING)
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950/90 border border-zinc-800/90 p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  WORKDAY MARGIN NOW
                </span>
                <div
                  className={`text-lg sm:text-xl font-extrabold font-mono mt-1 ${
                    sim.dailyAudit.workdayFree >= 0 ? 'text-zinc-100' : 'text-red-400'
                  }`}
                >
                  {sim.dailyAudit.workdayFree >= 0
                    ? `+${sim.dailyAudit.workdayFree.toFixed(1)}H / DAY`
                    : `${sim.dailyAudit.workdayFree.toFixed(1)}H DEFICIT`}
                </div>
              </div>

              <div className="bg-zinc-950/90 border border-zinc-800/90 p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  OFF-DAY MARGIN NOW
                </span>
                <div
                  className={`text-lg sm:text-xl font-extrabold font-mono mt-1 ${
                    sim.dailyAudit.weekendFree >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {sim.dailyAudit.weekendFree >= 0
                    ? `+${sim.dailyAudit.weekendFree.toFixed(1)}H / DAY`
                    : `${sim.dailyAudit.weekendFree.toFixed(1)}H DEFICIT`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================
            3. SYMMETRICAL 4-PILLAR TELEMETRY RIBBON
           ============================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              code: 'I // PAST',
              label: 'HOURS EXPENDED',
              val: `${formatNum(sim.hoursLived)} HRS`,
              sub: `${state.currentAge} SOLAR YEARS LIVED`,
              accent: 'border-zinc-700',
            },
            {
              code: 'II // FUTURE',
              label: 'REMAINING WAKING HOURS',
              val: `${formatNum(wakingHoursRemaining)} HRS`,
              sub: `EXCLUDES ${formatNum(sim.totals.sleep)}H SLEEP`,
              accent: 'border-blue-800/80',
            },
            {
              code: 'III // VITALITY',
              label: 'GOLDEN RETIREMENT WINDOW',
              val: `${Math.max(0, sim.actuarial.healthspanAge - Math.max(state.currentAge, state.retirementAge))} YEARS`,
              sub: `AGE ${Math.max(state.currentAge, state.retirementAge)} → ${sim.actuarial.healthspanAge} IN PEAK HEALTH`,
              accent: 'border-emerald-800/80',
            },
            {
              code: 'IV // ENTROPY',
              label: 'FRICTION TAX ON WAKING LIFE',
              val: `${((frictionHours / wakingHoursRemaining) * 100).toFixed(1)}%`,
              sub: `${formatNum(frictionHours)} HRS (${(frictionHours / HOURS_PER_YEAR).toFixed(1)} YEARS)`,
              accent: 'border-red-900/80',
            },
          ].map((pillar, i) => (
            <div
              key={i}
              className={`relative bg-[#090a0f] border ${pillar.accent} p-4 flex flex-col justify-between`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                <span>{pillar.code}</span>
                <span className="w-1.5 h-1.5 rotate-45 bg-zinc-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white my-1 tracking-tight">
                {pillar.val}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {pillar.label} <span className="text-zinc-600">//</span> {pillar.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================================
            4. SYMMETRICAL OBSERVATORY (4-TAB VISUALIZATION SUITE)
           ============================================================================ */}
        <div className="relative bg-[#090a0f] border border-zinc-800 p-6 md:p-8 space-y-8">
          <CornerReticles color="border-zinc-600" />

          {/* Symmetrical 4-Column Tab Switcher */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-zinc-800 pb-6">
            {[
              { id: 'breakdown', code: 'I', label: 'LIFETIME LEDGER', icon: PieChartIcon },
              { id: 'timeline', code: 'II', label: 'PHASE TRAJECTORY', icon: Layers },
              { id: 'weeks', code: 'III', label: 'MEMENTO MORI MATRIX', icon: Grid },
              { id: 'daily', code: 'IV', label: 'DIURNAL 24H AUDIT', icon: Sun },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3 px-4 border font-mono text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all ${
                    isActive
                      ? 'bg-white text-black border-white font-extrabold shadow-[0_0_25px_rgba(255,255,255,0.15)]'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    <span className={isActive ? 'text-red-600 mr-1' : 'text-zinc-600 mr-1'}>{tab.code}.</span>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TAB I: LIFETIME LEDGER (6 COLS CHART + PILLARS | 6 COLS RANKED TABLE) */}
          {activeTab === 'breakdown' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left 6 Cols: Donut + 3 Macro Category Blocks */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-zinc-950/60 border border-zinc-800/80 p-6">
                <div className="h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={86}
                        outerRadius={132}
                        paddingAngle={1.5}
                        dataKey="hours"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${formatNum(value)} HRS (${(value / HOURS_PER_YEAR).toFixed(1)}Y)`,
                          'ALLOCATION',
                        ]}
                        contentStyle={{
                          backgroundColor: '#050507',
                          borderColor: '#3f3f46',
                          borderRadius: '0px',
                          color: '#f4f4f5',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '12px',
                        }}
                        itemStyle={{ color: '#e4e4e7' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Axial Center Readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">REMAINING</span>
                    <span className="text-4xl font-black text-white font-mono my-0.5">{sim.yearsRemaining}Y</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      {formatNum(sim.totalRemainingHours)} HRS
                    </span>
                  </div>
                </div>

                {/* 3 Symmetrical Macro-Pillar Summary Cards */}
                <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-zinc-800/80 text-center font-mono">
                  <div className="bg-zinc-900/60 border border-zinc-800 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">I. INEVITABLE</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {(inevitableHours / HOURS_PER_YEAR).toFixed(1)}Y
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {((inevitableHours / sim.totalRemainingHours) * 100).toFixed(0)}% TOTAL
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">II. FRICTION</div>
                    <div className="text-sm font-bold text-red-400 mt-0.5">
                      {(frictionHours / HOURS_PER_YEAR).toFixed(1)}Y
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {((frictionHours / sim.totalRemainingHours) * 100).toFixed(0)}% TOTAL
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 p-2.5">
                    <div className="text-[10px] text-zinc-500 uppercase">III. SOVEREIGN</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {(totalSovereignHours / HOURS_PER_YEAR).toFixed(1)}Y
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {((totalSovereignHours / sim.totalRemainingHours) * 100).toFixed(0)}% TOTAL
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 6 Cols: Architectural Ledger with Proportional Bars */}
              <div className="lg:col-span-6 bg-zinc-950/60 border border-zinc-800/80 p-6 flex flex-col justify-between">
                <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest pb-3 border-b border-zinc-800">
                  <div className="col-span-5">ALLOCATION VECTOR</div>
                  <div className="col-span-2 text-right">TOTAL</div>
                  <div className="col-span-2 text-right">WAKING</div>
                  <div className="col-span-3 text-right">DURATION</div>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar my-2">
                  {[...chartData]
                    .sort((a, b) => b.hours - a.hours)
                    .map((item) => {
                      const totalPct =
                        sim.totalRemainingHours > 0 ? (item.hours / sim.totalRemainingHours) * 100 : 0;
                      const wakingPct =
                        item.id === 'sleep'
                          ? '—'
                          : `${((item.hours / wakingHoursRemaining) * 100).toFixed(1)}%`;
                      return (
                        <div key={item.id} className="space-y-1 py-1.5 border-b border-zinc-900/90">
                          <div className="grid grid-cols-12 items-center gap-2 text-xs font-mono">
                            <div className="col-span-5 flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rotate-45 flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-sans font-medium text-zinc-200 truncate">{item.name}</span>
                            </div>
                            <div className="col-span-2 text-right text-zinc-400">{totalPct.toFixed(1)}%</div>
                            <div className="col-span-2 text-right text-cyan-400/90">{wakingPct}</div>
                            <div className="col-span-3 text-right text-zinc-100 font-bold">
                              {formatNum(item.hours)}{' '}
                              <span className="text-zinc-500 font-normal">
                                ({(item.hours / HOURS_PER_YEAR).toFixed(1)}Y)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-zinc-900 h-1 overflow-hidden">
                            <div
                              className="h-full"
                              style={{ width: `${Math.min(100, totalPct)}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* TAB II: AGE-BY-AGE PHASE TRAJECTORY */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.15em]">
                    DIURNAL 24-HOUR PARTITION ACROSS REMAINING AGES ({state.currentAge}Y → {sim.lifespan}Y)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Observe the structural liberation at Career Exit (Age {state.retirementAge}) and the onset of late-life fragility (Age {sim.actuarial.healthspanAge}+).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase">
                  <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2 h-2 rotate-45 bg-blue-600" />SLEEP</span>
                  <span className="flex items-center gap-1.5 text-teal-400"><span className="w-2 h-2 rotate-45 bg-teal-600" />RITUALS</span>
                  <span className="flex items-center gap-1.5 text-orange-400"><span className="w-2 h-2 rotate-45 bg-orange-600" />LABOR</span>
                  <span className="flex items-center gap-1.5 text-pink-400"><span className="w-2 h-2 rotate-45 bg-pink-600" />LINEAGE</span>
                  <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2 h-2 rotate-45 bg-zinc-500" />FRICTION</span>
                  <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2 h-2 rotate-45 bg-cyan-500" />CHOICE</span>
                  <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rotate-45 bg-emerald-500" />FREE</span>
                </div>
              </div>

              <div className="h-[350px] w-full bg-zinc-950/60 border border-zinc-800/80 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim.yearlyTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#18181b" />
                    <XAxis
                      dataKey="age"
                      stroke="#71717a"
                      tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                    <YAxis
                      stroke="#71717a"
                      tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                      domain={[0, 24]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#050507',
                        borderColor: '#3f3f46',
                        borderRadius: '0px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                      }}
                      formatter={(val: number, name: string) => [`${val} HRS/DAY`, name.toUpperCase()]}
                      labelFormatter={(age) => {
                        const row = sim.yearlyTimeline.find((r) => r.age === age);
                        return `AGE ${age} // PHASE: ${row?.phase.toUpperCase() || ''}`;
                      }}
                    />
                    <Area type="monotone" dataKey="Sleep" stackId="1" stroke="#2563eb" fill="#1d4ed8" />
                    <Area type="monotone" dataKey="Routine" stackId="1" stroke="#0d9488" fill="#0f766e" />
                    <Area type="monotone" dataKey="WorkAndSchool" stackId="1" stroke="#ea580c" fill="#c2410c" />
                    <Area type="monotone" dataKey="Caregiving" stackId="1" stroke="#db2777" fill="#be185d" />
                    <Area type="monotone" dataKey="Friction" stackId="1" stroke="#64748b" fill="#475569" />
                    <Area type="monotone" dataKey="Intentional" stackId="1" stroke="#06b6d4" fill="#0891b2" />
                    <Area type="monotone" dataKey="FreeTime" stackId="1" stroke="#22c55e" fill="#16a34a" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB III: MEMENTO MORI MATRIX (SYMMETRICAL 20-COL ARCHITECTURAL GRID) */}
          {activeTab === 'weeks' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.15em]">
                    MEMENTO MORI ARCHITECTURAL MATRIX // {sim.lifespan} SOLAR YEARS ({formatNum(Math.round(sim.lifespan * 52.18))} WEEKS)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Each monolith represents one solar year (52 weeks). Hover any coordinate to inspect its phase and daily sovereignty.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono uppercase">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <span className="w-3 h-3 bg-zinc-900 border border-zinc-700" /> EXPENDED ({state.currentAge}Y)
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-400">
                    <span className="w-3 h-3 bg-orange-950/90 border border-orange-500" /> LABOR PHASE
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-3 bg-emerald-950/90 border border-emerald-400" /> GOLDEN AUTONOMY
                  </span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="w-3 h-3 bg-red-950/90 border border-red-600" /> TWILIGHT FRAGILITY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5">
                {Array.from({ length: sim.lifespan }, (_, age) => {
                  const isPast = age < state.currentAge;
                  const isCurrent = age === state.currentAge;
                  const futureRow = sim.yearlyTimeline.find((r) => r.age === age);

                  let cellStyle = 'bg-zinc-950/80 border-zinc-800/80 text-zinc-600';
                  if (isCurrent) {
                    cellStyle = 'bg-white text-black border-white font-black shadow-[0_0_15px_rgba(255,255,255,0.6)]';
                  } else if (!isPast && futureRow) {
                    if (!futureRow.isHealthy) {
                      cellStyle = 'bg-red-950/60 border-red-700/70 text-red-200 hover:bg-red-900/80';
                    } else if (age < state.retirementAge) {
                      cellStyle = 'bg-orange-950/60 border-orange-600/70 text-orange-200 hover:bg-orange-900/80';
                    } else {
                      cellStyle = 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200 hover:bg-emerald-900/80';
                    }
                  }

                  return (
                    <div
                      key={age}
                      onMouseEnter={() => setHoveredAge(age)}
                      onMouseLeave={() => setHoveredAge(null)}
                      className={`h-9 border flex items-center justify-center cursor-crosshair transition-all font-mono text-xs ${cellStyle}`}
                    >
                      <span>{age}</span>
                    </div>
                  );
                })}
              </div>

              {/* Symmetrical 4-Column Coordinate Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">COORDINATE</span>
                  <strong className="text-white text-sm">
                    AGE {inspectedAge} (WEEKS {inspectedAge * 52}–{(inspectedAge + 1) * 52})
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">LIFE STAGE</span>
                  <strong className="text-zinc-200 text-sm uppercase">
                    {inspectedAge < state.currentAge ? 'EXPENDED PAST' : inspectedRow?.phase || 'ACTIVE'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">LABOR & FRICTION</span>
                  <strong className="text-orange-400 text-sm">
                    {inspectedAge < state.currentAge
                      ? 'HISTORICAL'
                      : `${((inspectedRow?.WorkAndSchool || 0) + (inspectedRow?.Friction || 0)).toFixed(1)} HRS/DAY`}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">SOVEREIGN AUTONOMY</span>
                  <strong className="text-emerald-400 text-sm">
                    {inspectedAge < state.currentAge
                      ? 'EXPENDED'
                      : `${((inspectedRow?.Intentional || 0) + (inspectedRow?.FreeTime || 0)).toFixed(1)} HRS/DAY`}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB IV: DIURNAL 24H AUDIT (3 SYMMETRICAL MONOLITH CARDS) */}
          {activeTab === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  code: 'I // LABOR DAY',
                  title: 'Current Onsite Workday',
                  subtitle: `Normalized across ${state.workDaysPerWeek} workdays/wk`,
                  used: sim.dailyAudit.workdayUsed,
                  free: sim.dailyAudit.workdayFree,
                },
                {
                  code: 'II // SABBATH DAY',
                  title: 'Current Weekend / Off-Day',
                  subtitle: 'Zero career labor or commuting tax',
                  used: sim.dailyAudit.weekendUsed,
                  free: sim.dailyAudit.weekendFree,
                },
                {
                  code: `III // ENCORE DAY (AGE ${state.retirementAge}+)`,
                  title: 'Post-Retirement Equilibrium',
                  subtitle:
                    state.encoreWorkHrsPerWeek > 0
                      ? `Includes ${state.encoreWorkHrsPerWeek}h/wk encore craft`
                      : 'Complete liberation from career labor',
                  used: sim.dailyAudit.retirementUsed,
                  free: sim.dailyAudit.retirementFree,
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="relative bg-zinc-950/90 border border-zinc-800 p-6 flex flex-col justify-between space-y-5"
                >
                  <CornerReticles />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-1">
                      {card.code}
                    </div>
                    <h4 className="font-bold text-white text-lg tracking-wide">{card.title}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{card.subtitle}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900 font-mono">
                    <div className="bg-zinc-900/60 border border-zinc-800 p-3">
                      <span className="text-[10px] text-zinc-500 block uppercase">COMMITTED</span>
                      <span className="text-2xl font-bold text-zinc-100">{card.used.toFixed(1)}H</span>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 p-3 text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase">UNALLOCATED</span>
                      <span
                        className={`text-2xl font-black ${
                          card.free >= 0 ? 'text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {card.free >= 0 ? `+${card.free.toFixed(1)}H` : `${card.free.toFixed(1)}H`}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-900 h-2 border border-zinc-800 overflow-hidden flex">
                    <div
                      className={`h-full ${card.free >= 0 ? 'bg-emerald-500' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(100, (card.used / 24) * 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                    {card.free >= 0
                      ? `STATUS: SOLVENT // ${card.free.toFixed(1)} hrs/day of unscripted margin remains beyond your scheduled leisure.`
                      : `STATUS: INSOLVENT // Overbooked by ${Math.abs(card.free).toFixed(1)} hrs/day. Sleep or sanity is being cannibalized.`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================================
            5. SYMMETRICAL 3x3 & 1x3 CONTROL MATRICES
           ============================================================================ */}
        <div className="space-y-16 pt-4">
          
          {/* SECTION I: THE INEVITABLE (EXACT 3x3 = 9 INSTRUMENT CARDS) */}
          <section>
            <AxialSectionHeader
              roman="I"
              title="The Inevitable"
              subtitle="Biological imperatives, career horizons, academic foundations, and lineage caregiving windows."
              accentColor="#3b82f6"
              totalHours={inevitableHours}
              wakingPct={(( (inevitableHours - sim.totals.sleep) / wakingHoursRemaining) * 100).toFixed(1)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <SliderControl
                indexCode="I.01"
                label="Sleep & Nocturnal Rest"
                subtitle="Biological recovery (7.0–8.5h optimal)"
                icon={Moon}
                colorClass="text-blue-400"
                accentHex="#3b82f6"
                value={state.sleepHrsPerDay}
                onChange={(v) => updateField('sleepHrsPerDay', v)}
                min={4}
                max={11}
                step={0.25}
                unit="hrs/d"
                hours={sim.totals.sleep}
                benchmark={ATUS_BENCHMARKS.sleep}
              />

              <SliderControl
                indexCode="I.02"
                label="Daily Maintenance"
                subtitle="Cooking, dining, hygiene & basic upkeep"
                icon={Coffee}
                colorClass="text-teal-400"
                accentHex="#14b8a6"
                value={state.routineHrsPerDay}
                onChange={(v) => updateField('routineHrsPerDay', v)}
                min={0.5}
                max={6}
                step={0.25}
                unit="hrs/d"
                hours={sim.totals.routine}
                benchmark={ATUS_BENCHMARKS.routine}
              />

              <SliderControl
                indexCode="I.03"
                label="Primary Career Labor"
                subtitle={`Active until Career Exit (Age ${state.retirementAge})`}
                icon={Briefcase}
                colorClass="text-orange-400"
                accentHex="#f97316"
                value={state.workHrsPerWeek}
                onChange={(v) => updateField('workHrsPerWeek', v)}
                min={0}
                max={80}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.work}
                benchmark={ATUS_BENCHMARKS.work}
              />

              <SliderControl
                indexCode="I.04"
                label="Active Working Weeks"
                subtitle="Annual workweeks minus PTO & sabbaticals"
                icon={Calendar}
                colorClass="text-orange-300"
                accentHex="#fb923c"
                value={state.workWeeksPerYear}
                onChange={(v) => updateField('workWeeksPerYear', v)}
                min={36}
                max={52}
                step={1}
                unit="wks/yr"
                hours={sim.totals.work}
                benchmark={ATUS_BENCHMARKS.workWeeks}
                secondaryNote={`${52 - state.workWeeksPerYear} WKS PTO / YR`}
              />

              <SliderControl
                indexCode="I.05"
                label="Encore / Post-Exit Craft"
                subtitle={`Part-time passion work after Age ${state.retirementAge}`}
                icon={Briefcase}
                colorClass="text-amber-400"
                accentHex="#f59e0b"
                value={state.encoreWorkHrsPerWeek}
                onChange={(v) => updateField('encoreWorkHrsPerWeek', v)}
                min={0}
                max={30}
                step={1}
                unit="hrs/wk"
                hours={
                  Math.max(0, sim.actuarial.healthspanAge - Math.max(state.currentAge, state.retirementAge)) *
                  state.encoreWorkHrsPerWeek *
                  WEEKS_PER_YEAR
                }
              />

              <SliderControl
                indexCode="I.06"
                label="Lineage & Caregiving"
                subtitle="Dedicated parenting or eldercare hours"
                icon={Users}
                colorClass="text-pink-400"
                accentHex="#ec4899"
                value={state.caregivingHrsPerWeek}
                onChange={(v) => updateField('caregivingHrsPerWeek', v)}
                min={0}
                max={50}
                step={1}
                unit="hrs/wk"
                hours={sim.totals.caregiving}
                benchmark={ATUS_BENCHMARKS.caregiving}
              />

              <SliderControl
                indexCode="I.07"
                label="Caregiving Window"
                subtitle="Remaining years of active caregiving"
                icon={Hourglass}
                colorClass="text-pink-300"
                accentHex="#f472b6"
                value={state.caregivingYearsRemaining}
                onChange={(v) => updateField('caregivingYearsRemaining', v)}
                min={0}
                max={30}
                step={1}
                unit="years"
                hours={sim.totals.caregiving}
                secondaryNote={
                  state.caregivingYearsRemaining > 0
                    ? `ACTIVE UNTIL AGE ${state.currentAge + state.caregivingYearsRemaining}`
                    : 'PHASE INACTIVE'
                }
              />

              <SliderControl
                indexCode="I.08"
                label="Academic Study"
                subtitle="Lectures, research & coursework (190d/yr)"
                icon={GraduationCap}
                colorClass="text-purple-400"
                accentHex="#a855f7"
                value={state.schoolHrsPerDay}
                onChange={(v) => updateField('schoolHrsPerDay', v)}
                min={0}
                max={12}
                step={0.5}
                unit="hrs/d"
                hours={sim.totals.school}
              />

              <SliderControl
                indexCode="I.09"
                label="Academic Horizon"
                subtitle="Remaining years of formal schooling"
                icon={Hourglass}
                colorClass="text-purple-300"
                accentHex="#c084fc"
                value={state.schoolYearsRemaining}
                onChange={(v) => updateField('schoolYearsRemaining', v)}
                min={0}
                max={12}
                step={1}
                unit="years"
                hours={sim.totals.school}
                secondaryNote={
                  state.schoolYearsRemaining > 0
                    ? `GRADUATES AGE ${state.currentAge + state.schoolYearsRemaining}`
                    : 'COMPLETED'
                }
              />
            </div>
          </section>

          {/* SECTION II: THE FRICTION (EXACT 3x3 = 9 INSTRUMENT CARDS) */}
          <section>
            <AxialSectionHeader
              roman="II"
              title="The Friction"
              subtitle="Entropy and unseen taxes on waking consciousness: transit, algorithmic drift, morbidity, and bureaucracy."
              accentColor="#ef4444"
              totalHours={frictionHours}
              wakingPct={((frictionHours / wakingHoursRemaining) * 100).toFixed(1)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <SliderControl
                indexCode="II.01"
                label="Round-Trip Commute"
                subtitle="Applied strictly to onsite workdays"
                icon={Car}
                colorClass="text-slate-300"
                accentHex="#94a3b8"
                value={state.commuteHrsPerWorkday}
                onChange={(v) => updateField('commuteHrsPerWorkday', v)}
                min={0}
                max={4}
                step={0.1}
                unit="hrs/d"
                hours={sim.totals.commute}
                benchmark={ATUS_BENCHMARKS.commute}
              />

              <SliderControl
                indexCode="II.02"
                label="Workdays Per Week"
                subtitle="Weekly frequency of scheduled labor"
                icon={Calendar}
                colorClass="text-slate-400"
                accentHex="#64748b"
                value={state.workDaysPerWeek}
                onChange={(v) => updateField('workDaysPerWeek', v)}
                min={1}
                max={7}
                step={0.5}
                unit="days/wk"
                hours={sim.totals.commute}
                benchmark={ATUS_BENCHMARKS.workDays}
                secondaryNote={`${(state.workDaysPerWeek * (1 - state.remoteWorkPercent / 100)).toFixed(1)} ONSITE DAYS/WK`}
              />

              <SliderControl
                indexCode="II.03"
                label="Remote / WFH Autonomy"
                subtitle="Percentage of workdays with zero transit"
                icon={Car}
                colorClass="text-slate-400"
                accentHex="#475569"
                value={state.remoteWorkPercent}
                onChange={(v) => updateField('remoteWorkPercent', v)}
                min={0}
                max={100}
                step={10}
                unit="% wfh"
                hours={sim.totals.commute}
                secondaryNote={`${100 - state.remoteWorkPercent}% ONSITE PRESENCE`}
              />

              <SliderControl
                indexCode="II.04"
                label="Algorithmic / Screen Drift"
                subtitle="Unintentional scrolling & passive feeds"
                icon={Smartphone}
                colorClass="text-indigo-400"
                accentHex="#6366f1"
                value={state.passiveScreenHrsPerDay}
                onChange={(v) => updateField('passiveScreenHrsPerDay', v)}
                min={0}
                max={8}
                step={0.25}
                unit="hrs/d"
                hours={sim.totals.screen}
                benchmark={ATUS_BENCHMARKS.screen}
              />

              <SliderControl
                indexCode="II.05"
                label="Acute Sickness & Morbidity"
                subtitle="Waking down-days (+late-life fragility curve)"
                icon={Thermometer}
                colorClass="text-red-500"
                accentHex="#ef4444"
                value={state.sickDaysPerYear}
                onChange={(v) => updateField('sickDaysPerYear', v)}
                min={0}
                max={60}
                step={1}
                unit="days/yr"
                hours={sim.totals.sick}
                benchmark={ATUS_BENCHMARKS.sick}
              />

              <SliderControl
                indexCode="II.06"
                label="Life Admin & Bureaucracy"
                subtitle="Taxes, errands, paperwork, logistics"
                icon={PhoneCall}
                colorClass="text-yellow-500"
                accentHex="#eab308"
                value={state.adminHrsPerWeek}
                onChange={(v) => updateField('adminHrsPerWeek', v)}
                min={0}
                max={15}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.admin}
                benchmark={ATUS_BENCHMARKS.admin}
              />

              <SliderControl
                indexCode="II.07"
                label="Queues, Delays & Traffic"
                subtitle="Waiting rooms, transit friction, hold lines"
                icon={Hourglass}
                colorClass="text-stone-400"
                accentHex="#a8a29e"
                value={state.waitHrsPerWeek}
                onChange={(v) => updateField('waitHrsPerWeek', v)}
                min={0}
                max={10}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.wait}
                benchmark={ATUS_BENCHMARKS.wait}
              />

              <SliderControl
                indexCode="II.08"
                label="Unexpected Disasters"
                subtitle="Breakdowns, home repairs, acute crises"
                icon={AlertTriangle}
                colorClass="text-orange-500"
                accentHex="#f97316"
                value={state.disasterHrsPerYear}
                onChange={(v) => updateField('disasterHrsPerYear', v)}
                min={0}
                max={150}
                step={5}
                unit="hrs/yr"
                hours={sim.totals.disaster}
                benchmark={ATUS_BENCHMARKS.disaster}
              />

              <SliderControl
                indexCode="II.09"
                label="Major Life Detours"
                subtitle="Years lost to severe crisis (waking hrs)"
                icon={RouteOff}
                colorClass="text-red-700"
                accentHex="#991b1b"
                value={state.detourYearsRemaining}
                onChange={(v) => updateField('detourYearsRemaining', v)}
                min={0}
                max={Math.min(20, sim.yearsRemaining)}
                step={0.5}
                unit="years"
                hours={sim.totals.detour}
              />
            </div>
          </section>

          {/* SECTION III: THE CHOICE (EXACT 1x3 = 3 ELEVATED INSTRUMENT CARDS) */}
          <section>
            <AxialSectionHeader
              roman="III"
              title="The Choice"
              subtitle="Deliberate investments in vitality, mastery, and communion. Physical training directly expands your actuarial healthspan."
              accentColor="#10b981"
              totalHours={choiceHours}
              wakingPct={((choiceHours / wakingHoursRemaining) * 100).toFixed(1)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SliderControl
                indexCode="III.01"
                label="Physical Vitality & Sport"
                subtitle="Compounds both total lifespan & healthspan"
                icon={Activity}
                colorClass="text-emerald-400"
                accentHex="#10b981"
                value={state.exerciseHrsPerWeek}
                onChange={(v) => updateField('exerciseHrsPerWeek', v)}
                min={0}
                max={20}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.exercise}
                benchmark={ATUS_BENCHMARKS.exercise}
              />

              <SliderControl
                indexCode="III.02"
                label="Mastery & Deep Craft"
                subtitle="Literature, study, creation, contemplation"
                icon={BookOpen}
                colorClass="text-emerald-500"
                accentHex="#059669"
                value={state.growthHrsPerWeek}
                onChange={(v) => updateField('growthHrsPerWeek', v)}
                min={0}
                max={40}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.growth}
                benchmark={ATUS_BENCHMARKS.growth}
              />

              <SliderControl
                indexCode="III.03"
                label="True Leisure & Communion"
                subtitle="Loved ones, art, presence, adventure"
                icon={Smile}
                colorClass="text-cyan-400"
                accentHex="#06b6d4"
                value={state.funHrsPerWeek}
                onChange={(v) => updateField('funHrsPerWeek', v)}
                min={0}
                max={50}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.fun}
                benchmark={ATUS_BENCHMARKS.fun}
              />
            </div>
          </section>
        </div>

        {/* Ceremonial Architectural Colophon Footer */}
        <footer className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rotate-45 bg-red-600" />
            <span>THE FINITE CANVAS // ARCHITECTURAL MEMENTO MORI</span>
          </div>
          <div>
            365.2425 DAYS/YR · 8,765.82 HRS/YR · SSA &amp; ATUS CALIBRATED
          </div>
        </footer>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #090a0f; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }

        input.angular-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          height: 20px;
        }
        input.angular-slider:focus {
          outline: none;
        }
        input.angular-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: transparent;
        }
        input.angular-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          width: 12px;
          background: #090a0f;
          border: 2px solid currentColor;
          transform: rotate(45deg);
          cursor: pointer;
          margin-top: -4px;
          box-shadow: 0 0 10px currentColor;
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        input.angular-slider::-webkit-slider-thumb:hover {
          background: currentColor;
          transform: rotate(45deg) scale(1.2);
        }
        input.angular-slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          background: #090a0f;
          border: 2px solid currentColor;
          border-radius: 0;
          transform: rotate(45deg);
          cursor: pointer;
          box-shadow: 0 0 10px currentColor;
        }
      `,
        }}
      />
    </div>
  );
}
