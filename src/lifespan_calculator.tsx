import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Moon, Briefcase, GraduationCap, Coffee, Car,
  Thermometer, Hourglass, PhoneCall, AlertTriangle,
  RouteOff, BookOpen, Smile, Clock, HeartPulse,
  Users, Smartphone, Activity, Calendar, RotateCcw,
  Bookmark, Check, Info, Sparkles, TrendingUp,
  Layers, Grid, BarChart2, PieChart as PieChartIcon,
  Copy, Download, Upload, Scale, Sun
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

  // 01. The Inevitable (Foundations & Phases)
  sleepHrsPerDay: number;
  routineHrsPerDay: number; // Hygiene, cooking, eating, basic house upkeep
  workHrsPerWeek: number;
  workWeeksPerYear: number;
  workDaysPerWeek: number;
  retirementAge: number;
  encoreWorkHrsPerWeek: number; // Optional part-time/passion work in early retirement
  schoolHrsPerDay: number;
  schoolYearsRemaining: number;

  // 02. Life Phases & Caregiving
  caregivingHrsPerWeek: number; // Parenting, child-rearing, or eldercare
  caregivingYearsRemaining: number;

  // 03. The Friction (Unseen Sinks)
  commuteHrsPerWorkday: number;
  remoteWorkPercent: number; // % of workdays worked from home (0-100)
  sickDaysPerYear: number;
  waitHrsPerWeek: number;
  adminHrsPerWeek: number;
  passiveScreenHrsPerDay: number; // Doomscrolling / unintentional screen drift
  disasterHrsPerYear: number;
  detourYearsRemaining: number;

  // 04. The Choice (Intentional Living)
  exerciseHrsPerWeek: number;
  growthHrsPerWeek: number;
  funHrsPerWeek: number;
}

// US BLS American Time Use Survey (ATUS) & OECD empirical adult baselines
const ATUS_BENCHMARKS: Record<string, { label: string; value: string; note: string }> = {
  sleep: { label: 'ATUS Avg: 8.6h/d', value: '8.6', note: 'Includes sleep, naps & sleeplessness in bed' },
  routine: { label: 'ATUS Avg: 2.3h/d', value: '2.3', note: 'Grooming (0.8h), eating/drinking (1.1h), food prep (0.4h)' },
  work: { label: 'ATUS Avg: 38.5h/wk', value: '38.5', note: 'Full-time employed civilian average' },
  commute: { label: 'US Census: 0.9h/d', value: '0.9', note: '27.6 min each way (~55 min round-trip)' },
  caregiving: { label: 'ATUS Parents: 12h/wk', value: '12', note: 'Primary + secondary childcare/eldercare in active households' },
  sick: { label: 'CDC Avg: 4.5d/yr', value: '5', note: 'Acute illness + mental health days (excluding late-life morbidity)' },
  wait: { label: 'Avg: 1.5h/wk', value: '1.5', note: 'Transit delays, queues, waiting rooms, hold times' },
  admin: { label: 'ATUS Avg: 3.5h/wk', value: '3.5', note: 'Household management, bills, consumer purchases, errands' },
  screen: { label: 'Avg Adult: 2.8h/d', value: '2.8', note: 'Algorithmic social feeds & passive background TV' },
  exercise: { label: 'WHO Target: 3.5h/wk', value: '3.5', note: '150–300 min/wk moderate-to-vigorous physical activity' },
  growth: { label: 'ATUS Avg: 2.1h/wk', value: '2.1', note: 'Personal reading, skill building, deliberate practice' },
  fun: { label: 'ATUS Avg: 14h/wk', value: '14', note: 'Active socializing, hobbies, arts, intentional recreation' },
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

const PRESETS: Record<string, { name: string; subtitle: string; state: Partial<LifespanState> }> = {
  atus: {
    name: 'US Statistical Average',
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
    name: 'High-Burn Corporate',
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
    name: 'Remote + Early Retirement',
    subtitle: 'Remote work, low friction, retire at 50',
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
    name: 'Active Family & Career',
    subtitle: 'Full-time career + 18 yrs active parenting',
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

/**
 * Computes conditional expected total lifespan based on SSA/CDC actuarial survival tables
 * and evidence-based lifestyle adjustments (sleep U-curve, physical activity, chronic overwork).
 */
function calculateActuarialProjection(state: LifespanState) {
  // Base expected lifespan at birth (US SSA / OECD developed baseline)
  const baseAtBirth = state.sex === 'female' ? 81.2 : state.sex === 'male' ? 76.1 : 78.6;

  // Conditional survival bonus: having survived to `currentAge` eliminates early-life mortality risk.
  // Approximated via Gompertz-Makeham conditional expectancy curve matching SSA Period Life Tables.
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

  // Empirical lifestyle longevity modifiers (capped reasonably)
  // 1. Exercise (Brigham / Harvard studies: 3.5-7h/wk adds ~2.5-4.2 yrs vs sedentary)
  const exerciseBonus =
    state.exerciseHrsPerWeek >= 5
      ? 3.2
      : state.exerciseHrsPerWeek >= 2.5
      ? 1.8
      : state.exerciseHrsPerWeek < 1
      ? -1.5
      : 0;

  // 2. Sleep U-curve (optimal 7.0 - 8.5 hrs; chronic <6h or >9.5h correlates with reduced healthspan)
  const sleepBonus =
    state.sleepHrsPerDay >= 7 && state.sleepHrsPerDay <= 8.5
      ? 1.0
      : state.sleepHrsPerDay < 6
      ? -2.2
      : state.sleepHrsPerDay < 6.5
      ? -1.0
      : -0.5;

  // 3. Chronic overwork penalty (WHO/ILO study: >=55 hrs/wk increases cardiovascular risk)
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

  // WHO HALE (Healthy Life Expectancy): typically ~87-89% of total lifespan, modified by exercise & sleep
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
// REUSABLE SLIDER CONTROL (Defined outside parent to preserve drag focus!)
// ============================================================================

interface SliderControlProps {
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
  showHoursSummary?: boolean;
}

const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));

const SliderControl: React.FC<SliderControlProps> = React.memo(({
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
  showHoursSummary = true,
}) => {
  return (
    <div className="bg-gray-900/90 border border-gray-800/90 rounded-xl p-4 flex flex-col gap-2.5 transition-all hover:border-gray-700 relative overflow-hidden group">
      <div className="flex justify-between items-start gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass}`} />
          <div className="truncate">
            <span className="font-semibold text-sm text-gray-200">{label}</span>
            {subtitle && (
              <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-white font-mono">{value}</span>
          <span className="text-xs text-gray-400 ml-1">{unit}</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer relative z-10"
        style={{ accentColor: accentHex }}
      />

      <div className="flex justify-between items-center text-[11px] text-gray-500 font-mono relative z-10 pt-0.5">
        {benchmark ? (
          <button
            type="button"
            onClick={() => onChange(parseFloat(benchmark.value))}
            title={`${benchmark.note} (Click to apply)`}
            className="text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
          >
            <span>{benchmark.label}</span>
          </button>
        ) : (
          <span>
            {min}–{max} {unit}
          </span>
        )}
        {showHoursSummary && (
          <span>
            <strong className="text-gray-300">{formatNum(hours)}</strong> hrs{' '}
            <span className="text-gray-600">
              ({(hours / HOURS_PER_YEAR).toFixed(1)}y)
            </span>
          </span>
        )}
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
      // Keep age/retirement/lifespan logically consistent
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
  // RIGOROUS YEAR-BY-YEAR SIMULATION ENGINE (NO DOUBLE-COUNTING)
  // ============================================================================

  const simulateLifecycle = useCallback((s: LifespanState) => {
    const actuarial = calculateActuarialProjection(s);
    const lifespan = actuarial.effectiveLifespan;
    const yearsRemaining = Math.max(0, lifespan - s.currentAge);
    const hoursLived = s.currentAge * HOURS_PER_YEAR;
    const totalRemainingHours = yearsRemaining * HOURS_PER_YEAR;
    const totalLifespanHours = lifespan * HOURS_PER_YEAR;
    const livedPercentage = totalLifespanHours > 0 ? (hoursLived / totalLifespanHours) * 100 : 100;

    // Accumulators across all remaining years
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

      // 1. Base biological & maintenance needs (apply every day of the year)
      const yrSleep = s.sleepHrsPerDay * DAYS_PER_YEAR;
      const yrRoutine = s.routineHrsPerDay * DAYS_PER_YEAR;
      const wakingNonRoutineHrsPerDay = Math.max(0, HOURS_PER_DAY - s.sleepHrsPerDay - s.routineHrsPerDay);

      // 2. Detours (e.g. major life crisis/addiction) only consume *waking non-routine* hours, never double-counting sleep!
      let detourFractionThisYear = 0;
      if (remainingDetourYears > 0) {
        detourFractionThisYear = Math.min(1, remainingDetourYears);
        remainingDetourYears -= detourFractionThisYear;
      }
      const yrDetour = detourFractionThisYear * wakingNonRoutineHrsPerDay * DAYS_PER_YEAR;
      const activeYearScale = 1 - detourFractionThisYear;

      // 3. Sickness & Late-Life Health Decline (consumes waking hours, not sleep!)
      // In late-life fragility years (beyond healthspanAge), chronic fatigue/medical care adds ~2.5 waking hrs/day
      const lateLifeExtraSickDays = isHealthyYear ? 0 : 35;
      const effectiveSickDays = Math.min(DAYS_PER_YEAR, s.sickDaysPerYear + lateLifeExtraSickDays);
      const yrSick = effectiveSickDays * wakingNonRoutineHrsPerDay * activeYearScale;

      // 4. Career / Work & Encore Work
      const yrWork = isWorkingYear
        ? s.workHrsPerWeek * s.workWeeksPerYear * activeYearScale
        : s.encoreWorkHrsPerWeek * WEEKS_PER_YEAR * (isHealthyYear ? 1 : 0.3) * activeYearScale;

      // 5. Commuting (ONLY on actual onsite workdays during working years!)
      const onsiteWorkdaysPerYear = isWorkingYear
        ? s.workDaysPerWeek * s.workWeeksPerYear * (1 - s.remoteWorkPercent / 100)
        : 0;
      const yrCommute = s.commuteHrsPerWorkday * onsiteWorkdaysPerYear * activeYearScale;

      // 6. Education / Schooling (190 academic days/year during school years)
      const yrSchool = isSchoolYear ? s.schoolHrsPerDay * 190 * activeYearScale : 0;

      // 7. Caregiving / Parenting Window
      const yrCaregiving = isCaregivingYear ? s.caregivingHrsPerWeek * WEEKS_PER_YEAR * activeYearScale : 0;

      // 8. Unseen Friction (Waiting, Life Admin, Disasters, Passive Screen Drift)
      const yrWait = s.waitHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;
      const yrAdmin = s.adminHrsPerWeek * WEEKS_PER_YEAR * activeYearScale;
      const yrScreen = s.passiveScreenHrsPerDay * DAYS_PER_YEAR * activeYearScale;
      const yrDisaster = s.disasterHrsPerYear * activeYearScale;

      // 9. Intentional Living (Exercise, Self-Improvement, True Leisure)
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

    // Current Daily 24-Hour Audit (Workday vs Weekend vs Retirement Day)
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
        breakdownWorkday: [
          { name: 'Sleep', hrs: s.sleepHrsPerDay, color: '#1e40af' },
          { name: 'Routines', hrs: s.routineHrsPerDay, color: '#0f766e' },
          {
            name: 'Work & Commute',
            hrs: s.currentAge < s.retirementAge ? dailyWorkHrsOnWorkday + dailyCommuteOnWorkday : s.encoreWorkHrsPerWeek / 5,
            color: '#c2410c',
          },
          { name: 'School & Caregiving', hrs: dailySchoolNow + dailyCaregivingNow, color: '#7e22ce' },
          { name: 'Friction & Screens', hrs: dailyFrictionNow, color: '#64748b' },
          { name: 'Growth, Fitness & Fun', hrs: dailyIntentionalNow, color: '#0891b2' },
        ],
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
      { id: 'sleep', name: 'Sleep & Rest', hours: t.sleep, color: '#1d4ed8', category: 'inevitable', icon: Moon },
      { id: 'routine', name: 'Daily Maintenance (Eat, Cook, Hygiene)', hours: t.routine, color: '#0f766e', category: 'inevitable', icon: Coffee },
      { id: 'work', name: 'Career & Encore Work', hours: t.work, color: '#c2410c', category: 'inevitable', icon: Briefcase },
      { id: 'school', name: 'Education & Study', hours: t.school, color: '#7e22ce', category: 'inevitable', icon: GraduationCap },
      { id: 'caregiving', name: 'Family & Caregiving Window', hours: t.caregiving, color: '#db2777', category: 'inevitable', icon: Users },

      { id: 'commute', name: 'Onsite Commuting', hours: t.commute, color: '#475569', category: 'friction', icon: Car },
      { id: 'screen', name: 'Passive Screen / Feed Drift', hours: t.screen, color: '#6366f1', category: 'friction', icon: Smartphone },
      { id: 'sick', name: 'Illness & Late-Life Morbidity', hours: t.sick, color: '#b91c1c', category: 'friction', icon: Thermometer },
      { id: 'admin', name: 'Life Admin, Errands & Bills', hours: t.admin, color: '#a16207', category: 'friction', icon: PhoneCall },
      { id: 'wait', name: 'Waiting in Lines & Traffic', hours: t.wait, color: '#57534e', category: 'friction', icon: Hourglass },
      { id: 'disaster', name: 'Unexpected Disasters & Repairs', hours: t.disaster, color: '#ea580c', category: 'friction', icon: AlertTriangle },
      { id: 'detour', name: 'Major Life Detours', hours: t.detour, color: '#7f1d1d', category: 'friction', icon: RouteOff },

      { id: 'exercise', name: 'Physical Fitness & Longevity', hours: t.exercise, color: '#10b981', category: 'choice', icon: Activity },
      { id: 'growth', name: 'Mastery & Self-Improvement', hours: t.growth, color: '#059669', category: 'choice', icon: BookOpen },
      { id: 'fun', name: 'True Leisure, Art & Connection', hours: t.fun, color: '#0891b2', category: 'choice', icon: Smile },
    ];
  }, [sim.totals]);

  const trulyFreeRemainingHours = sim.totals.free;
  const healthyFreeRemainingHours = sim.totals.healthyFree;
  const wakingHoursRemaining = Math.max(1, sim.totalRemainingHours - sim.totals.sleep);

  // Discretionary Sovereign Time = Unallocated Free Time + Intentional Choice (Exercise + Growth + Fun)
  const totalSovereignHours =
    Math.max(0, trulyFreeRemainingHours) +
    sim.totals.exercise +
    sim.totals.growth +
    sim.totals.fun;

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

  // Pin or clear baseline for scenario comparison
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

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 p-4 md:p-8 font-sans selection:bg-red-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Action & Scenario Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/60 border border-gray-800/80 rounded-2xl px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              Profiles:
            </span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                title={preset.subtitle}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  activePreset === key
                    ? 'bg-red-600/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                    : 'bg-gray-800/60 border-gray-700/70 text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleBaseline}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                baseline
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-gray-800/60 border-gray-700/70 text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {baseline ? 'Clear Pinned Baseline' : 'Pin Current as Baseline'}
            </button>

            <button
              type="button"
              onClick={copyScenarioJson}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-gray-800/60 border-gray-700/70 text-gray-300 hover:bg-gray-800 flex items-center gap-1.5 transition-all"
              title="Copy configuration JSON to clipboard"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotice ? 'Copied!' : 'Export JSON'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePreset(null);
                setState(DEFAULT_STATE);
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-gray-800/60 border-gray-700/70 text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-1.5 transition-all"
              title="Reset to default parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Header & Actuarial Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-b border-gray-800/80 pb-8">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-900/60 text-red-400 text-xs font-semibold tracking-wide uppercase mb-3">
                <HeartPulse className="w-3.5 h-3.5" />
                Actuarial & Phase-Aware Time Accounting
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3 flex items-center gap-3">
                <Hourglass className="text-red-600 w-10 h-10 md:w-12 md:h-12 animate-pulse flex-shrink-0" />
                The Finite Canvas
              </h1>
              <p className="text-gray-400 max-w-2xl text-base md:text-lg leading-relaxed">
                Every year contains exactly <span className="text-gray-200 font-mono font-semibold">8,765.8</span> hours.
                Model your remaining life across career, retirement, and healthspan phases—free of double-counted sleep or flat-average illusions.
              </p>
            </div>

            {/* Demographic & Lifespan Controls Card */}
            <div className="space-y-5 bg-gray-900/60 p-5 md:p-6 rounded-2xl border border-gray-800/90 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lifespan Model:</span>
                  <button
                    type="button"
                    onClick={() => updateField('useActuarialLifespan', true)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      state.useActuarialLifespan
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    SSA Actuarial + Habits ({sim.actuarial.calculatedLifespan}y)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('useActuarialLifespan', false)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      !state.useActuarialLifespan
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Manual Target
                  </button>
                </div>

                {state.useActuarialLifespan && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 mr-1">Cohort:</span>
                    {(['average', 'female', 'male'] as BiologicalSex[]).map((sexOpt) => (
                      <button
                        key={sexOpt}
                        type="button"
                        onClick={() => updateField('sex', sexOpt)}
                        className={`text-xs capitalize px-2.5 py-1 rounded-md font-medium transition-colors ${
                          state.sex === sexOpt
                            ? 'bg-gray-700 text-white border border-gray-600'
                            : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {sexOpt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="flex justify-between text-xs font-medium text-gray-400">
                    <span>Current Age</span>
                    <span className="text-white font-bold font-mono text-base">{state.currentAge} yrs</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={Math.max(16, sim.lifespan - 1)}
                    value={state.currentAge}
                    onChange={(e) => updateField('currentAge', parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#dc2626' }}
                  />
                  <div className="text-[11px] text-gray-500 font-mono">
                    Lived: {formatNum(sim.hoursLived)} hrs
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex justify-between text-xs font-medium text-gray-400">
                    <span>Retirement Age</span>
                    <span className="text-orange-400 font-bold font-mono text-base">
                      {state.retirementAge <= state.currentAge ? 'Retired' : `${state.retirementAge} yrs`}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={Math.min(state.currentAge, 45)}
                    max={Math.min(90, sim.lifespan)}
                    value={state.retirementAge}
                    onChange={(e) => updateField('retirementAge', parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#ea580c' }}
                  />
                  <div className="text-[11px] text-gray-500 font-mono">
                    {Math.max(0, Math.min(sim.lifespan, state.retirementAge) - state.currentAge)} working yrs left
                  </div>
                </div>

                {state.useActuarialLifespan ? (
                  <div className="space-y-1.5">
                    <label className="flex justify-between text-xs font-medium text-gray-400">
                      <span>Genetics / Health Offset</span>
                      <span className="text-emerald-400 font-bold font-mono text-base">
                        {state.healthLifestyleScore > 0 ? `+${state.healthLifestyleScore}` : state.healthLifestyleScore} yrs
                      </span>
                    </label>
                    <input
                      type="range"
                      min={-10}
                      max={10}
                      step={1}
                      value={state.healthLifestyleScore}
                      onChange={(e) => updateField('healthLifestyleScore', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#10b981' }}
                    />
                    <div className="text-[11px] text-gray-500 font-mono">
                      Net habit/cohort effect: {sim.actuarial.lifestyleDelta >= 0 ? `+${sim.actuarial.lifestyleDelta}` : sim.actuarial.lifestyleDelta}y
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="flex justify-between text-xs font-medium text-gray-400">
                      <span>Expected Lifespan</span>
                      <span className="text-white font-bold font-mono text-base">{sim.lifespan} yrs</span>
                    </label>
                    <input
                      type="range"
                      min={Math.max(40, state.currentAge + 1)}
                      max={115}
                      value={state.customLifespan}
                      onChange={(e) => updateField('customLifespan', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#6b7280' }}
                    />
                    <div className="text-[11px] text-gray-500 font-mono">
                      Healthspan est: ~{sim.actuarial.healthspanAge} yrs
                    </div>
                  </div>
                )}
              </div>

              {/* Lifespan & Healthspan Progress Bar */}
              <div className="pt-2 space-y-2">
                <div className="flex flex-wrap justify-between text-xs font-mono uppercase tracking-wider gap-2">
                  <span className="text-gray-400">
                    Lived: <strong className="text-gray-200">{state.currentAge}y</strong> ({sim.livedPercentage.toFixed(1)}%)
                  </span>
                  <span className="text-emerald-400">
                    Healthy Window: <strong className="text-emerald-300">Age {state.currentAge}→{sim.actuarial.healthspanAge}</strong> ({Math.max(0, sim.actuarial.healthspanAge - state.currentAge)}y)
                  </span>
                  <span className="text-red-400 font-bold">
                    Total Left: {formatNum(sim.totalRemainingHours)} hrs ({sim.yearsRemaining}y)
                  </span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-3.5 flex overflow-hidden shadow-inner border border-gray-700/50">
                  <div
                    className="bg-gray-600 h-full transition-all duration-500"
                    style={{ width: `${sim.livedPercentage}%` }}
                    title={`Already lived: ${state.currentAge} years`}
                  />
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, ((sim.actuarial.healthspanAge - state.currentAge) / sim.lifespan) * 100)}%`,
                    }}
                    title={`Healthy remaining window: ${Math.max(0, sim.actuarial.healthspanAge - state.currentAge)} years`}
                  />
                  <div
                    className="bg-red-900/90 h-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, ((sim.lifespan - sim.actuarial.healthspanAge) / sim.lifespan) * 100)}%`,
                    }}
                    title={`Late-life reduced healthspan window: ${sim.actuarial.morbidityYears} years`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Card: Sovereign Time & Healthspan Metrics */}
          <div
            className={`lg:col-span-5 flex flex-col justify-between p-6 md:p-8 rounded-2xl border ${
              trulyFreeRemainingHours < 0
                ? 'bg-red-950/25 border-red-900/60 text-red-400'
                : 'bg-gray-900/50 border-gray-800 text-gray-100 shadow-[0_0_50px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {trulyFreeRemainingHours < 0 ? 'Schedule Deficit (Overbooked)' : 'Unallocated Free Time Left'}
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                  Lifespan: {sim.lifespan} yrs
                </span>
              </div>

              <div className="text-5xl md:text-6xl font-black font-mono text-white tracking-tighter my-1">
                {formatNum(trulyFreeRemainingHours)}
                <span className="text-xl font-normal text-gray-500 ml-2">hrs</span>
              </div>

              {/* Baseline Delta Comparison Pill */}
              {baselineSim && (
                <div className="mt-2 inline-flex items-center gap-3 text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300">
                  <span>
                    vs. Baseline:{' '}
                    <strong className={freeDeltaHrs && freeDeltaHrs >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {freeDeltaHrs && freeDeltaHrs >= 0 ? `+${formatNum(freeDeltaHrs)}` : formatNum(freeDeltaHrs || 0)} hrs
                    </strong>
                  </span>
                  {lifespanDeltaYrs !== 0 && (
                    <span>
                      ({lifespanDeltaYrs && lifespanDeltaYrs > 0 ? `+${lifespanDeltaYrs}` : lifespanDeltaYrs}y lifespan)
                    </span>
                  )}
                </div>
              )}

              <div
                className={`mt-4 text-sm font-medium px-4 py-2.5 rounded-xl border ${
                  trulyFreeRemainingHours > 0
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50'
                    : 'bg-red-950/50 text-red-400 border-red-900/60'
                }`}
              >
                {trulyFreeRemainingHours > 0 ? (
                  <>
                    ≈ <strong>{(trulyFreeRemainingHours / HOURS_PER_YEAR).toFixed(1)} years</strong> of raw unallocated time (
                    <strong>{(healthyFreeRemainingHours / HOURS_PER_YEAR).toFixed(1)} yrs</strong> in peak health).
                  </>
                ) : (
                  <>
                    Your commitments exceed 24h/day by{' '}
                    <strong>{(Math.abs(trulyFreeRemainingHours) / sim.yearsRemaining / DAYS_PER_YEAR).toFixed(1)} hrs/day</strong>.
                  </>
                )}
              </div>
            </div>

            {/* Key Sub-Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-800/80">
              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3.5">
                <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                  Total Discretionary (Choice + Free)
                </div>
                <div className="text-xl font-black font-mono text-cyan-400 mt-1">
                  {formatNum(totalSovereignHours)} <span className="text-xs font-normal text-gray-500">hrs</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {((totalSovereignHours / wakingHoursRemaining) * 100).toFixed(1)}% of remaining waking life
                </div>
              </div>

              <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-3.5">
                <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                  Today&apos;s Workday Margin
                </div>
                <div
                  className={`text-xl font-black font-mono mt-1 ${
                    sim.dailyAudit.workdayFree >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {sim.dailyAudit.workdayFree >= 0 ? `+${sim.dailyAudit.workdayFree.toFixed(1)}` : sim.dailyAudit.workdayFree.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-gray-500">hrs/day</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Weekend: {sim.dailyAudit.weekendFree >= 0 ? `+${sim.dailyAudit.weekendFree.toFixed(1)}` : sim.dailyAudit.weekendFree.toFixed(1)}h unallocated
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-View Visualization Suite */}
        <div className="bg-gray-900/40 rounded-3xl p-6 border border-gray-800/80 space-y-6">
          {/* View Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('breakdown')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'breakdown'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white'
                }`}
              >
                <PieChartIcon className="w-4 h-4" />
                Lifetime Ledger
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                Age-by-Age Phase Curve
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('weeks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'weeks'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                Memento Mori Grid
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === 'daily'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                24-Hour Daily Audit
              </button>
            </div>

            <div className="text-xs text-gray-400 font-mono">
              Waking Hours Remaining: <strong className="text-white">{formatNum(wakingHoursRemaining)} hrs</strong>
            </div>
          </div>

          {/* TAB 1: LIFETIME BREAKDOWN (DONUT + LEDGER) */}
          {activeTab === 'breakdown' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="h-[340px] lg:col-span-5 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={88}
                      outerRadius={138}
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
                        `${formatNum(value)} hrs (${(value / HOURS_PER_YEAR).toFixed(1)} yrs)`,
                        'Remaining',
                      ]}
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#374151',
                        borderRadius: '0.75rem',
                        color: '#f3f4f6',
                      }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-white font-mono">{sim.yearsRemaining}</span>
                  <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Years Left</span>
                  <span className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    {Math.max(0, sim.actuarial.healthspanAge - state.currentAge)}y healthy
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-2 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-12 text-[11px] font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-800 sticky top-0 bg-[#0c0d12] z-10">
                  <div className="col-span-5">Category</div>
                  <div className="col-span-2 text-right">Total %</div>
                  <div className="col-span-2 text-right">Waking %</div>
                  <div className="col-span-3 text-right">Hours (Years)</div>
                </div>
                {[...chartData]
                  .sort((a, b) => b.hours - a.hours)
                  .map((item) => {
                    const totalPct =
                      sim.totalRemainingHours > 0 ? ((item.hours / sim.totalRemainingHours) * 100).toFixed(1) : '0.0';
                    const wakingPct =
                      item.id === 'sleep'
                        ? '—'
                        : `${((item.hours / wakingHoursRemaining) * 100).toFixed(1)}%`;
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 items-center gap-2 py-2 px-2.5 hover:bg-gray-800/40 rounded-lg transition-colors text-sm"
                      >
                        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-gray-200 truncate">{item.name}</span>
                        </div>
                        <div className="col-span-2 text-right font-mono text-xs text-gray-400">{totalPct}%</div>
                        <div className="col-span-2 text-right font-mono text-xs text-cyan-400/80">{wakingPct}</div>
                        <div className="col-span-3 text-right font-mono text-xs text-gray-200">
                          {formatNum(item.hours)}{' '}
                          <span className="text-gray-500">({(item.hours / HOURS_PER_YEAR).toFixed(1)}y)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: AGE-BY-AGE PHASE CURVE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Daily 24-Hour Allocation by Age ({state.currentAge} → {sim.lifespan})
                  </h3>
                  <p className="text-xs text-gray-400">
                    Notice how the career & commuting block drops at retirement ({state.retirementAge}), opening the Golden Window before late-life morbidity ({sim.actuarial.healthspanAge}+).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 rounded-sm bg-blue-700" />Sleep</span>
                  <span className="flex items-center gap-1.5 text-teal-400"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Routines</span>
                  <span className="flex items-center gap-1.5 text-orange-400"><span className="w-2.5 h-2.5 rounded-sm bg-orange-600" />Work/School/Commute</span>
                  <span className="flex items-center gap-1.5 text-pink-400"><span className="w-2.5 h-2.5 rounded-sm bg-pink-600" />Caregiving</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />Friction/Sick</span>
                  <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-600" />Choice</span>
                  <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Free Time</span>
                </div>
              </div>

              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim.yearlyTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="age"
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Age (Years)', position: 'insideBottomRight', offset: -5, fill: '#9ca3af', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      domain={[0, 24]}
                      label={{ value: 'Hours / Day', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#374151',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: number, name: string) => [`${val} hrs/day`, name]}
                      labelFormatter={(age) => {
                        const row = sim.yearlyTimeline.find((r) => r.age === age);
                        return `Age ${age} — Phase: ${row?.phase || ''}`;
                      }}
                    />
                    <Area type="monotone" dataKey="Sleep" stackId="1" stroke="#1d4ed8" fill="#1d4ed8" />
                    <Area type="monotone" dataKey="Routine" stackId="1" stroke="#0f766e" fill="#0f766e" />
                    <Area type="monotone" dataKey="WorkAndSchool" stackId="1" stroke="#ea580c" fill="#c2410c" />
                    <Area type="monotone" dataKey="Caregiving" stackId="1" stroke="#db2777" fill="#db2777" />
                    <Area type="monotone" dataKey="Friction" stackId="1" stroke="#64748b" fill="#475569" />
                    <Area type="monotone" dataKey="Intentional" stackId="1" stroke="#0891b2" fill="#0891b2" />
                    <Area type="monotone" dataKey="FreeTime" stackId="1" stroke="#22c55e" fill="#22c55e" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: MEMENTO MORI LIFE GRID (YEARS & WEEKS) */}
          {activeTab === 'weeks' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Memento Mori — Your {sim.lifespan} Years ({formatNum(Math.round(sim.lifespan * 52.18))} Weeks)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Each block represents 1 year (52 weeks) of life. Hover over any year to inspect its phase and discretionary freedom.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-3 h-3 rounded bg-gray-800 border border-gray-700" /> Spent ({state.currentAge}y)
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-300">
                    <span className="w-3 h-3 rounded bg-orange-600/80" /> Working Phase
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-3 h-3 rounded bg-emerald-500" /> Golden Retirement (Healthy)
                  </span>
                  <span className="flex items-center gap-1.5 text-red-300">
                    <span className="w-3 h-3 rounded bg-red-800/80" /> Late-Life Fragility
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-2 pt-2">
                {Array.from({ length: sim.lifespan }, (_, age) => {
                  const isPast = age < state.currentAge;
                  const futureRow = sim.yearlyTimeline.find((r) => r.age === age);
                  let bgClass = 'bg-gray-800/60 border-gray-700/50 text-gray-600';
                  if (!isPast && futureRow) {
                    if (!futureRow.isHealthy) {
                      bgClass = 'bg-red-900/70 border-red-700/60 text-red-200';
                    } else if (age < state.retirementAge) {
                      bgClass = 'bg-orange-600/75 border-orange-500/60 text-orange-100';
                    } else {
                      bgClass = 'bg-emerald-600/80 border-emerald-400/70 text-emerald-50';
                    }
                  }
                  return (
                    <div
                      key={age}
                      onMouseEnter={() => setHoveredAge(age)}
                      onMouseLeave={() => setHoveredAge(null)}
                      className={`h-9 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 font-mono text-xs font-bold ${bgClass}`}
                    >
                      <span>{age}</span>
                    </div>
                  );
                })}
              </div>

              {/* Hovered Year Inspector */}
              <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                {hoveredAge !== null ? (
                  hoveredAge < state.currentAge ? (
                    <div className="text-gray-400">
                      <strong className="text-white">Age {hoveredAge}</strong> (Weeks {hoveredAge * 52}–{(hoveredAge + 1) * 52}):{' '}
                      Already lived. Part of the {formatNum(sim.hoursLived)} hours behind you.
                    </div>
                  ) : (
                    (() => {
                      const row = sim.yearlyTimeline.find((r) => r.age === hoveredAge);
                      if (!row) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-6 text-gray-300">
                          <span>
                            <strong className="text-white">Age {hoveredAge}</strong> ({row.phase})
                          </span>
                          <span>Work/Commute: <strong>{row.WorkAndSchool}h/d</strong></span>
                          <span>Caregiving: <strong>{row.Caregiving}h/d</strong></span>
                          <span>Intentional Choice: <strong className="text-cyan-400">{row.Intentional}h/d</strong></span>
                          <span>Unallocated Free: <strong className="text-emerald-400">{row.FreeTime}h/d</strong></span>
                        </div>
                      );
                    })()
                  )
                ) : (
                  <div className="text-gray-500">
                    Hover over any year block above to inspect that year&apos;s daily breakdown and life phase.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: 24-HOUR DAILY AUDIT */}
          {activeTab === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Current Onsite Workday',
                  subtitle: `Based on ${state.workDaysPerWeek} workdays/wk`,
                  used: sim.dailyAudit.workdayUsed,
                  free: sim.dailyAudit.workdayFree,
                },
                {
                  title: 'Current Weekend / Off-Day',
                  subtitle: 'No career work or commuting',
                  used: sim.dailyAudit.weekendUsed,
                  free: sim.dailyAudit.weekendFree,
                },
                {
                  title: `Post-Retirement Day (Age ${state.retirementAge}+)`,
                  subtitle: state.encoreWorkHrsPerWeek > 0 ? `Includes ${state.encoreWorkHrsPerWeek}h/wk encore work` : 'Zero career obligations',
                  used: sim.dailyAudit.retirementUsed,
                  free: sim.dailyAudit.retirementFree,
                },
              ].map((card, idx) => (
                <div key={idx} className="bg-gray-950/60 border border-gray-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-white text-base">{card.title}</h4>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-xs text-gray-500 block">Committed</span>
                      <span className="text-2xl font-bold text-gray-200">{card.used.toFixed(1)}h</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Unallocated</span>
                      <span
                        className={`text-2xl font-black ${
                          card.free >= 0 ? 'text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {card.free >= 0 ? `+${card.free.toFixed(1)}h` : `${card.free.toFixed(1)}h`}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${card.free >= 0 ? 'bg-cyan-500' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(100, (card.used / 24) * 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-400">
                    {card.free >= 0
                      ? `Leaves ${card.free.toFixed(1)} hrs/day of unscripted breathing room on top of your scheduled leisure.`
                      : `Overbooked by ${Math.abs(card.free).toFixed(1)} hrs/day! Something (usually sleep or leisure) is being cannibalized.`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================================
            CONTROLS SECTIONS
           ============================================================================ */}
        <div className="space-y-12">
          
          {/* SECTION 01: THE INEVITABLE & LIFE PHASES */}
          <section>
            <div className="mb-6 border-b border-gray-800 pb-2 flex flex-wrap justify-between items-end gap-2">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span className="text-gray-600">01.</span> Foundations & Life Phases
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Biological necessities, career horizons, education, and active family/caregiving windows.
                </p>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Click any <span className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">ATUS Avg</span> badge to apply empirical US benchmarks
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SliderControl
                label="Sleep & Rest"
                subtitle="Biological recovery (7–8.5h optimal)"
                icon={Moon}
                colorClass="text-blue-500"
                accentHex="#3b82f6"
                value={state.sleepHrsPerDay}
                onChange={(v) => updateField('sleepHrsPerDay', v)}
                min={4}
                max={11}
                step={0.25}
                unit="hrs/day"
                hours={sim.totals.sleep}
                benchmark={ATUS_BENCHMARKS.sleep}
              />

              <SliderControl
                label="Daily Routines"
                subtitle="Cooking, eating, showering, basic chores"
                icon={Coffee}
                colorClass="text-teal-500"
                accentHex="#14b8a6"
                value={state.routineHrsPerDay}
                onChange={(v) => updateField('routineHrsPerDay', v)}
                min={0.5}
                max={6}
                step={0.25}
                unit="hrs/day"
                hours={sim.totals.routine}
                benchmark={ATUS_BENCHMARKS.routine}
              />

              <SliderControl
                label="Career Work Hours"
                subtitle={`Active until retirement (Age ${state.retirementAge})`}
                icon={Briefcase}
                colorClass="text-orange-500"
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
                label="Work Weeks / Year"
                subtitle="Accounts for PTO, holidays & sabbaticals"
                icon={Calendar}
                colorClass="text-orange-400"
                accentHex="#fb923c"
                value={state.workWeeksPerYear}
                onChange={(v) => updateField('workWeeksPerYear', v)}
                min={36}
                max={52}
                step={1}
                unit="wks/yr"
                hours={sim.totals.work}
                showHoursSummary={false}
              />

              <SliderControl
                label="Encore / Retirement Work"
                subtitle={`Part-time/passion work after Age ${state.retirementAge}`}
                icon={Briefcase}
                colorClass="text-amber-500"
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
                label="Caregiving / Parenting"
                subtitle="Dedicated childcare or eldercare hours"
                icon={Users}
                colorClass="text-pink-500"
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
                label="Caregiving Window"
                subtitle="Years of active caregiving remaining"
                icon={Hourglass}
                colorClass="text-pink-400"
                accentHex="#f472b6"
                value={state.caregivingYearsRemaining}
                onChange={(v) => updateField('caregivingYearsRemaining', v)}
                min={0}
                max={30}
                step={1}
                unit="years"
                hours={sim.totals.caregiving}
                showHoursSummary={false}
              />

              <SliderControl
                label="Higher Ed / Schooling"
                subtitle="Classes + study (~190 days/yr)"
                icon={GraduationCap}
                colorClass="text-purple-500"
                accentHex="#a855f7"
                value={state.schoolHrsPerDay}
                onChange={(v) => updateField('schoolHrsPerDay', v)}
                min={0}
                max={12}
                step={0.5}
                unit="hrs/day"
                hours={sim.totals.school}
              />

              <SliderControl
                label="Remaining School Years"
                subtitle="Duration of degree or training program"
                icon={Hourglass}
                colorClass="text-purple-400"
                accentHex="#c084fc"
                value={state.schoolYearsRemaining}
                onChange={(v) => updateField('schoolYearsRemaining', v)}
                min={0}
                max={12}
                step={1}
                unit="years"
                hours={sim.totals.school}
                showHoursSummary={false}
              />
            </div>
          </section>

          {/* SECTION 02: THE FRICTION */}
          <section>
            <div className="mb-6 border-b border-gray-800 pb-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span className="text-gray-600">02.</span> The Friction
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Hidden taxes on your waking hours: commuting (scaled strictly to onsite workdays), passive screen drift, illness, and bureaucracy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SliderControl
                label="Round-Trip Commute"
                subtitle="Counted ONLY on onsite workdays"
                icon={Car}
                colorClass="text-slate-400"
                accentHex="#94a3b8"
                value={state.commuteHrsPerWorkday}
                onChange={(v) => updateField('commuteHrsPerWorkday', v)}
                min={0}
                max={4}
                step={0.1}
                unit="hrs/workday"
                hours={sim.totals.commute}
                benchmark={ATUS_BENCHMARKS.commute}
              />

              <SliderControl
                label="Remote / WFH Share"
                subtitle="% of workdays with zero commute"
                icon={Car}
                colorClass="text-slate-500"
                accentHex="#64748b"
                value={state.remoteWorkPercent}
                onChange={(v) => updateField('remoteWorkPercent', v)}
                min={0}
                max={100}
                step={10}
                unit="% remote"
                hours={sim.totals.commute}
                showHoursSummary={false}
              />

              <SliderControl
                label="Passive Screen / Feed Drift"
                subtitle="Unintentional scrolling & background TV"
                icon={Smartphone}
                colorClass="text-indigo-400"
                accentHex="#6366f1"
                value={state.passiveScreenHrsPerDay}
                onChange={(v) => updateField('passiveScreenHrsPerDay', v)}
                min={0}
                max={8}
                step={0.25}
                unit="hrs/day"
                hours={sim.totals.screen}
                benchmark={ATUS_BENCHMARKS.screen}
              />

              <SliderControl
                label="Acute Sickness / Down Days"
                subtitle="Consumes waking hours only (+late-life curve)"
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
                label="Life Admin, Errands & Bills"
                subtitle="Paperwork, taxes, shopping, scheduling"
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
                label="Waiting / Lines / Traffic"
                subtitle="Transit delays, queues, hold music"
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
                label="Unexpected Disasters"
                subtitle="Car breakdowns, home leaks, IT crashes"
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
              />

              <SliderControl
                label="Major Life Detours"
                subtitle="Years lost to crisis/burnout (waking hrs)"
                icon={RouteOff}
                colorClass="text-red-800"
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

          {/* SECTION 03: THE CHOICE */}
          <section>
            <div className="mb-6 border-b border-gray-800 pb-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span className="text-gray-600">03.</span> The Choice (Intentional Living)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Time deliberately invested in health, mastery, and joy. Exercise also directly extends your actuarial healthspan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SliderControl
                label="Physical Fitness & Sport"
                subtitle="Extends both lifespan & healthy years"
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
                label="Self-Improvement & Craft"
                subtitle="Reading, deep learning, creative building"
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
                label="True Leisure & Connection"
                subtitle="Loved ones, play, travel, deep rest"
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
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
      `,
        }}
      />
    </div>
  );
}
