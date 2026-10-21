import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Moon, Briefcase, Coffee, Car,
  Thermometer, Hourglass, PhoneCall,
  BookOpen, Smile, HeartPulse,
  Users, Smartphone, Activity, Calendar, RotateCcw,
  Bookmark, Check, Sparkles, Layers, Grid,
  PieChart as PieChartIcon, Copy, Compass, Flame, Eye, Scale
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ============================================================================
// CONSTANTS & SACRED 3-6-9 GEOMETRY ARCHITECTURE
// ============================================================================

const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365.2425; // Exact Gregorian solar year
const HOURS_PER_YEAR = DAYS_PER_YEAR * HOURS_PER_DAY; // ~8,765.82 hrs/yr
const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7; // ~52.1775 wks/yr

type BiologicalSex = 'female' | 'average' | 'male';

interface PsychePolarities {
  empathy: number;     // -100 (Demand to Be Understood) <-> +100 (Seek to Understand)
  acceptance: number;  // -100 (Anger at What Happened)  <-> +100 (Radical Acceptance)
  forgiveness: number; // -100 (Harbor Resentment)       <-> +100 (Forgiveness & Release)
  surrender: number;   // -100 (Hyper-Control & Anxiety) <-> +100 (Surrender & Adaptability)
  gratitude: number;   // -100 (Scarcity & Envy)         <-> +100 (Gratitude & Sufficiency)
  presence: number;    // -100 (Regret & Future Dread)   <-> +100 (Grounded Presence)
  humility: number;    // -100 (Need to Be Right)        <-> +100 (Curiosity & Humility)
  communion: number;   // -100 (Cynicism & Isolation)    <-> +100 (Communion & Warmth)
  purpose: number;     // -100 (Nihilistic Drift)        <-> +100 (Sacred Purpose / Ikigai)
}

interface LifespanState {
  // Core Triad (3 Horizon Anchors)
  currentAge: number;
  retirementAge: number;
  baseLifespan: number;
  sex: BiologicalSex;
  useActuarialLifespan: boolean;

  // Section I: The Vessel & Obligations (6 Sliders — 2x3 Matrix)
  sleepHrsPerDay: number;
  routineHrsPerDay: number;
  workHrsPerWeek: number;
  workWeeksPerYear: number;
  caregivingHrsPerWeek: number;
  caregivingYearsRemaining: number;

  // Section II: The Matrix / External Friction (6 Sliders — 2x3 Matrix)
  commuteHrsPerWorkday: number;
  remoteWorkPercent: number;
  passiveScreenHrsPerDay: number;
  sickDaysPerYear: number;
  adminHrsPerWeek: number;
  waitAndDisasterHrsPerWeek: number;

  // Section III: The Sanctuary / Outer Sovereignty (3 Sliders — 1x3 Matrix)
  exerciseHrsPerWeek: number;
  growthHrsPerWeek: number;
  funHrsPerWeek: number;

  // Section IV: The Psyche / Heaven & Hell Polarities (9 Sliders — 3x3 Matrix)
  psyche: PsychePolarities;
}

interface PolarityDefinition {
  key: keyof PsychePolarities;
  code: string;
  title: string;
  hellPole: string;
  hellSub: string;
  heavenPole: string;
  heavenSub: string;
  maxYearsImpact: number; // Max +/- years of longevity shift from psychoneuroimmunology
}

// 9 Sacred Polarities of Consciousness (3x3 Matrix)
const PSYCHE_DEFINITIONS: PolarityDefinition[] = [
  {
    key: 'empathy',
    code: 'IV.01',
    title: 'THE EMPATHY AXIS',
    hellPole: 'Demand to Be Understood',
    hellSub: 'Egoic defense & relational friction',
    heavenPole: 'Seek to Understand',
    heavenSub: 'Compassionate curiosity & grace',
    maxYearsImpact: 1.2,
  },
  {
    key: 'acceptance',
    code: 'IV.02',
    title: 'THE REALITY AXIS',
    hellPole: 'Anger at the Uncontrollable',
    hellSub: 'Raging at why events happened',
    heavenPole: 'Radical Acceptance',
    heavenSub: 'Making peace with what is',
    maxYearsImpact: 1.5,
  },
  {
    key: 'forgiveness',
    code: 'IV.03',
    title: 'THE MEMORY AXIS',
    hellPole: 'Harbor Resentment',
    hellSub: 'Chronic cortisol from old wounds',
    heavenPole: 'Forgiveness & Release',
    heavenSub: 'Unburdening the nervous system',
    maxYearsImpact: 1.3,
  },
  {
    key: 'surrender',
    code: 'IV.04',
    title: 'THE UNCERTAINTY AXIS',
    hellPole: 'Hyper-Control & Dread',
    hellSub: 'Sympathetic nervous exhaustion',
    heavenPole: 'Trust & Adaptability',
    heavenSub: 'Calm readiness for the unknown',
    maxYearsImpact: 1.2,
  },
  {
    key: 'gratitude',
    code: 'IV.05',
    title: 'THE COMPARISON AXIS',
    hellPole: 'Scarcity, Envy & Status',
    hellSub: 'Measuring self against the Matrix',
    heavenPole: 'Gratitude & Sufficiency',
    heavenSub: 'Reverence for what already is',
    maxYearsImpact: 1.1,
  },
  {
    key: 'presence',
    code: 'IV.06',
    title: 'THE TEMPORAL AXIS',
    hellPole: 'Regret & Future Anxiety',
    hellSub: 'Absent from the living hour',
    heavenPole: 'Grounded Presence',
    heavenSub: 'Inhabiting the immediate moment',
    maxYearsImpact: 1.2,
  },
  {
    key: 'humility',
    code: 'IV.07',
    title: 'THE EGO AXIS',
    hellPole: 'Compulsion to Be Right',
    hellSub: 'Rigid certainty & hostility',
    heavenPole: 'Truth & Humility',
    heavenSub: 'Openness to unlearn & evolve',
    maxYearsImpact: 1.0,
  },
  {
    key: 'communion',
    code: 'IV.08',
    title: 'THE KINSHIP AXIS',
    hellPole: 'Cynicism & Alienation',
    hellSub: 'Guarded isolation (mortality risk)',
    heavenPole: 'Communion & Warmth',
    heavenSub: 'Harvard Study #1 longevity factor',
    maxYearsImpact: 1.8,
  },
  {
    key: 'purpose',
    code: 'IV.09',
    title: 'THE MEANING AXIS',
    hellPole: 'Existential Drift',
    hellSub: 'Treating time as a burden to kill',
    heavenPole: 'Sacred Purpose (Ikigai)',
    heavenSub: 'Treating life as an altar of craft',
    maxYearsImpact: 1.7,
  },
];

const DEFAULT_PSYCHE: PsychePolarities = {
  empathy: 20,
  acceptance: 20,
  forgiveness: 20,
  surrender: 10,
  gratitude: 25,
  presence: 15,
  humility: 25,
  communion: 30,
  purpose: 30,
};

const DEFAULT_STATE: LifespanState = {
  currentAge: 30,
  retirementAge: 65,
  baseLifespan: 80,
  sex: 'average',
  useActuarialLifespan: true,

  // Section I (6)
  sleepHrsPerDay: 8.0,
  routineHrsPerDay: 2.0,
  workHrsPerWeek: 40.0,
  workWeeksPerYear: 49,
  caregivingHrsPerWeek: 0,
  caregivingYearsRemaining: 0,

  // Section II (6)
  commuteHrsPerWorkday: 1.0,
  remoteWorkPercent: 20,
  passiveScreenHrsPerDay: 2.0,
  sickDaysPerYear: 5,
  adminHrsPerWeek: 3.0,
  waitAndDisasterHrsPerWeek: 2.0,

  // Section III (3)
  exerciseHrsPerWeek: 3.5,
  growthHrsPerWeek: 3.5,
  funHrsPerWeek: 10.0,

  // Section IV (9)
  psyche: DEFAULT_PSYCHE,
};

// Strictly 3 Archetype Presets (Triad)
const ARCHETYPE_PRESETS: Record<string, { code: string; name: string; subtitle: string; state: Partial<LifespanState> }> = {
  matrix: {
    code: 'I',
    name: 'THE MATRIX (MEAN)',
    subtitle: 'US Statistical Average & Neutral Psyche',
    state: {
      sleepHrsPerDay: 8.5,
      routineHrsPerDay: 2.3,
      workHrsPerWeek: 38.5,
      workWeeksPerYear: 49,
      retirementAge: 66,
      commuteHrsPerWorkday: 0.9,
      remoteWorkPercent: 20,
      passiveScreenHrsPerDay: 2.8,
      sickDaysPerYear: 5,
      adminHrsPerWeek: 3.5,
      waitAndDisasterHrsPerWeek: 2.0,
      exerciseHrsPerWeek: 1.5,
      growthHrsPerWeek: 2.0,
      funHrsPerWeek: 12.0,
      psyche: {
        empathy: 0,
        acceptance: 0,
        forgiveness: 0,
        surrender: 0,
        gratitude: 0,
        presence: 0,
        humility: 0,
        communion: 0,
        purpose: 0,
      },
    },
  },
  inferno: {
    code: 'II',
    name: 'THE INFERNO (ATTRITION)',
    subtitle: 'High-Burn Overwork, Screen Trap & Resentment',
    state: {
      sleepHrsPerDay: 6.25,
      routineHrsPerDay: 1.5,
      workHrsPerWeek: 60.0,
      workWeeksPerYear: 51,
      retirementAge: 67,
      commuteHrsPerWorkday: 1.5,
      remoteWorkPercent: 0,
      passiveScreenHrsPerDay: 3.5,
      sickDaysPerYear: 9,
      adminHrsPerWeek: 4.0,
      waitAndDisasterHrsPerWeek: 3.5,
      exerciseHrsPerWeek: 0.5,
      growthHrsPerWeek: 1.0,
      funHrsPerWeek: 5.0,
      psyche: {
        empathy: -65,
        acceptance: -75,
        forgiveness: -70,
        surrender: -80,
        gratitude: -60,
        presence: -70,
        humility: -55,
        communion: -65,
        purpose: -60,
      },
    },
  },
  elysium: {
    code: 'III',
    name: 'ELYSIUM (SOVEREIGN)',
    subtitle: 'Autonomous Craft, Vitality & Deep Acceptance',
    state: {
      sleepHrsPerDay: 8.0,
      routineHrsPerDay: 2.0,
      workHrsPerWeek: 36.0,
      workWeeksPerYear: 46,
      retirementAge: 55,
      commuteHrsPerWorkday: 0.5,
      remoteWorkPercent: 80,
      passiveScreenHrsPerDay: 0.5,
      sickDaysPerYear: 3,
      adminHrsPerWeek: 2.0,
      waitAndDisasterHrsPerWeek: 1.0,
      exerciseHrsPerWeek: 5.5,
      growthHrsPerWeek: 7.0,
      funHrsPerWeek: 14.0,
      psyche: {
        empathy: 80,
        acceptance: 85,
        forgiveness: 85,
        surrender: 75,
        gratitude: 90,
        presence: 80,
        humility: 80,
        communion: 90,
        purpose: 90,
      },
    },
  },
};

// ============================================================================
// ACTUARIAL & PSYCHONEUROIMMUNOLOGY ENGINE
// ============================================================================

function calculateActuarialAndPsyche(state: LifespanState) {
  const baseAtBirth = state.sex === 'female' ? 81.2 : state.sex === 'male' ? 76.1 : 78.6;
  const age = state.currentAge;

  // Conditional SSA survival curve
  let survivalBonus = 0;
  if (age <= 20) survivalBonus = age * 0.04;
  else if (age <= 50) survivalBonus = 0.8 + (age - 20) * 0.065;
  else if (age <= 75) survivalBonus = 2.75 + (age - 50) * 0.18;
  else survivalBonus = 7.25 + (age - 75) * 0.38;

  // Physical habit modifiers
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

  // Psychoneuroimmunology longevity modifier from the 9 Heaven/Hell Polarities
  let psycheYearsDelta = 0;
  let psycheScoreSum = 0;
  PSYCHE_DEFINITIONS.forEach((def) => {
    const val = state.psyche[def.key] ?? 0; // -100 to +100
    psycheScoreSum += val;
    psycheYearsDelta += (val / 100) * def.maxYearsImpact;
  });

  // Mean psyche alignment (-100 = Pure Inferno, +100 = Pure Elysium)
  const meanPsycheIndex = psycheScoreSum / PSYCHE_DEFINITIONS.length;

  const baseAnchor = state.useActuarialLifespan ? baseAtBirth + survivalBonus : state.baseLifespan;

  const effectiveLifespan = Math.round(
    Math.max(
      state.currentAge + 1,
      Math.min(
        115,
        baseAnchor + exerciseBonus + sleepBonus + workStressPenalty + psycheYearsDelta
      )
    )
  );

  // WHO HALE Healthspan ratio modified by physical vitality & psychological peace
  const lateLifeMorbidityRatio =
    0.115 -
    (state.exerciseHrsPerWeek >= 3.5 ? 0.02 : 0) -
    (meanPsycheIndex > 35 ? 0.015 : 0) +
    (meanPsycheIndex < -35 ? 0.025 : 0) +
    (state.sleepHrsPerDay < 6 ? 0.015 : 0);

  const morbidityYears = Math.max(
    1,
    Math.round(effectiveLifespan * Math.max(0.05, Math.min(0.2, lateLifeMorbidityRatio)))
  );
  const healthspanAge = Math.max(state.currentAge, effectiveLifespan - morbidityYears);

  return {
    effectiveLifespan,
    healthspanAge,
    morbidityYears,
    physicalDelta: +(exerciseBonus + sleepBonus + workStressPenalty).toFixed(1),
    psycheYearsDelta: +psycheYearsDelta.toFixed(1),
    totalLongevityDelta: +(exerciseBonus + sleepBonus + workStressPenalty + psycheYearsDelta).toFixed(1),
    meanPsycheIndex: +meanPsycheIndex.toFixed(0),
  };
}

// ============================================================================
// ARCHITECTURAL HELPERS & UNIFORM INSTRUMENT COMPONENTS
// ============================================================================

const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));

const CornerReticles: React.FC<{ color?: string }> = ({ color = 'border-zinc-600/70' }) => (
  <>
    <span className={`pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 ${color}`} />
    <span className={`pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 ${color}`} />
    <span className={`pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 h-2.5 border-b-2 border-l-2 ${color}`} />
    <span className={`pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 ${color}`} />
  </>
);

const AxialSectionHeader: React.FC<{
  roman: string;
  matrixBadge: string;
  title: string;
  subtitle: string;
  accentColor: string;
  rightStatLabel: string;
  rightStatValue: string;
}> = ({ roman, matrixBadge, title, subtitle, accentColor, rightStatLabel, rightStatValue }) => (
  <div className="relative mb-8">
    <div className="flex items-center justify-center gap-4 mb-3">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-zinc-700" />
      <div className="flex items-center gap-3 px-4 py-1.5 bg-[#090a0f] border border-zinc-800 text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-400">
        <span className="w-2 h-2 rotate-45 inline-block" style={{ backgroundColor: accentColor }} />
        <span className="text-zinc-200 font-bold">SECTION {roman}</span>
        <span className="text-zinc-700">//</span>
        <span>{matrixBadge}</span>
        <span className="text-zinc-700">//</span>
        <span className="text-zinc-300">
          {rightStatLabel}: <strong className="text-white">{rightStatValue}</strong>
        </span>
        <span className="w-2 h-2 rotate-45 inline-block" style={{ backgroundColor: accentColor }} />
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-zinc-700" />
    </div>

    <div className="text-center max-w-2xl mx-auto">
      <h2
        className="text-2xl md:text-3xl font-bold uppercase tracking-[0.14em] text-white"
        style={{ fontFamily: "'Cinzel', 'Space Grotesk', serif" }}
      >
        {title}
      </h2>
      <p className="text-xs md:text-sm text-zinc-400 mt-1.5 tracking-wide">{subtitle}</p>
    </div>
  </div>
);

/**
 * 100% Uniform Standard Instrument Card (Used across Sections I, II, and III)
 * Every card has the exact same 3-row anatomy:
 * 1. Code + Icon + Title + Subtitle (Left) | Value + Unit Readout Box (Right)
 * 2. Angular Progress Bar + Diamond Slider
 * 3. Clickable Benchmark Button (Left) | Lifetime Hours & Years Readout (Right)
 */
interface UniformSliderProps {
  indexCode: string;
  label: string;
  subtitle: string;
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
  benchmarkLabel: string;
  benchmarkValue: number;
}

const UniformSliderCard: React.FC<UniformSliderProps> = React.memo(({
  indexCode,
  label,
  subtitle,
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
  benchmarkLabel,
  benchmarkValue,
}) => {
  const fillPct = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className="relative bg-[#090a0f] border border-zinc-800/90 p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-zinc-600 hover:bg-[#0c0e14] group h-full">
      <CornerReticles color="border-zinc-700/60 group-hover:border-zinc-400 transition-colors" />
      <div
        className="absolute top-0 left-8 right-8 h-[1px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentHex }}
      />

      {/* Row 1: Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-8 h-8 flex-shrink-0 bg-zinc-950 border flex items-center justify-center mt-0.5"
            style={{ borderColor: `${accentHex}55` }}
          >
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest">{indexCode}</span>
              <span className="font-semibold text-sm text-zinc-100 tracking-wide truncate">{label}</span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 bg-zinc-950 border border-zinc-800 px-2.5 py-1 min-w-[78px]">
          <span className="text-base font-extrabold text-white font-mono tracking-tight">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 ml-1 font-mono">{unit}</span>
        </div>
      </div>

      {/* Row 2: Precision Angular Track */}
      <div className="relative py-1 flex items-center">
        <div className="w-full h-1.5 bg-zinc-950 border border-zinc-800 overflow-hidden pointer-events-none">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${fillPct}%`,
              background: `linear-gradient(90deg, ${accentHex}44 0%, ${accentHex} 100%)`,
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

      {/* Row 3: 100% Uniform Footer (Benchmark Button Left | Hours & Years Right) */}
      <div className="flex justify-between items-center text-[11px] font-mono pt-2 border-t border-zinc-900">
        <button
          type="button"
          onClick={() => onChange(benchmarkValue)}
          className="text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 px-2 py-0.5 transition-all uppercase tracking-wider text-[10px]"
        >
          [{benchmarkLabel}]
        </button>

        <div className="text-right">
          <strong className="text-zinc-200">{formatNum(hours)}</strong>{' '}
          <span className="text-zinc-500">HRS</span>{' '}
          <span className="text-zinc-700">//</span>{' '}
          <span className="text-zinc-400">{(hours / HOURS_PER_YEAR).toFixed(1)}Y</span>
        </div>
      </div>
    </div>
  );
});

/**
 * 100% Uniform Heaven vs. Hell Bipolar Duality Card (Used across Section IV — 3x3 Matrix)
 * Pull Left (-100) -> The Inferno (Crimson: Resentment, Cortisol, Lifespan Loss & Inner Torment)
 * Pull Right (+100) -> Elysium (Celestial Emerald/Gold: Acceptance, Grace, Lifespan Gain & Inner Peace)
 */
interface PolarityCardProps {
  def: PolarityDefinition;
  value: number; // -100 to +100
  onChange: (val: number) => void;
  wakingHoursRemaining: number;
}

const PolarityDualityCard: React.FC<PolarityCardProps> = React.memo(({
  def,
  value,
  onChange,
  wakingHoursRemaining,
}) => {
  const isHeaven = value > 0;
  const isHell = value < 0;
  const accentHex = isHeaven ? '#10b981' : isHell ? '#dc2626' : '#71717a';

  const yearsShift = +((value / 100) * def.maxYearsImpact).toFixed(2);
  // Each of the 9 axes governs up to ~3.5% of waking consciousness quality
  const consciousnessHrsShift = Math.round((Math.abs(value) / 100) * 0.035 * wakingHoursRemaining);

  // Calculate center-origin bar geometry
  const leftWidth = value < 0 ? Math.abs(value) / 2 : 0; // 0 to 50%
  const rightWidth = value > 0 ? value / 2 : 0; // 0 to 50%

  return (
    <div
      className={`relative bg-[#090a0f] border p-5 flex flex-col justify-between gap-4 transition-all duration-200 group h-full ${
        isHeaven
          ? 'border-emerald-900/60 hover:border-emerald-500/80'
          : isHell
          ? 'border-red-900/60 hover:border-red-500/80'
          : 'border-zinc-800/90 hover:border-zinc-600'
      }`}
    >
      <CornerReticles
        color={
          isHeaven
            ? 'border-emerald-500/70'
            : isHell
            ? 'border-red-500/70'
            : 'border-zinc-600/60'
        }
      />

      {/* Top Bilateral Gradient Hairline */}
      <div
        className="absolute top-0 left-6 right-6 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, #dc2626 0%, #3f3f46 50%, #10b981 100%)',
        }}
      />

      {/* Row 1: Centered Axis Title + Symmetrical Left/Right Poles */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] border-b border-zinc-900 pb-1.5">
          <span className="text-red-500/90 flex items-center gap-1">
            <Flame className="w-3 h-3" /> INFERNO
          </span>
          <span className="text-zinc-300 font-bold">
            {def.code} // {def.title}
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            ELYSIUM <Sparkles className="w-3 h-3" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 items-start">
          {/* Left Pole: Hell / Contraction */}
          <div
            className={`text-left p-2 border transition-colors ${
              isHell
                ? 'bg-red-950/30 border-red-800/70 text-red-200'
                : 'bg-zinc-950/60 border-zinc-900 text-zinc-400'
            }`}
          >
            <div className="text-xs font-bold leading-tight">{def.hellPole}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{def.hellSub}</div>
          </div>

          {/* Right Pole: Heaven / Expansion */}
          <div
            className={`text-right p-2 border transition-colors ${
              isHeaven
                ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200'
                : 'bg-zinc-950/60 border-zinc-900 text-zinc-400'
            }`}
          >
            <div className="text-xs font-bold leading-tight">{def.heavenPole}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{def.heavenSub}</div>
          </div>
        </div>
      </div>

      {/* Row 2: Center-Zero Bipolar Tug-of-War Track */}
      <div className="relative py-1.5 flex items-center">
        <div className="w-full h-2 bg-zinc-950 border border-zinc-800 relative overflow-hidden pointer-events-none">
          {/* Center Zero Reticle Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-zinc-500 z-10" />
          {/* Left Inferno Fill */}
          {leftWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-l from-red-900 to-red-500"
              style={{ right: '50%', width: `${leftWidth}%` }}
            />
          )}
          {/* Right Elysium Fill */}
          {rightWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-900 to-emerald-400"
              style={{ left: '50%', width: `${rightWidth}%` }}
            />
          )}
        </div>
        <input
          type="range"
          min={-100}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="angular-slider absolute inset-0 w-full h-full opacity-100 cursor-pointer"
          style={{ color: accentHex }}
        />
      </div>

      {/* Row 3: 100% Uniform Bipolar Footer (Longevity Impact Left | Consciousness Yield Right) */}
      <div className="flex justify-between items-center text-[11px] font-mono pt-2 border-t border-zinc-900">
        <button
          type="button"
          onClick={() => onChange(0)}
          title="Click to center at 0 (Neutral)"
          className={`px-2 py-0.5 border text-[10px] uppercase tracking-wider transition-all ${
            yearsShift > 0
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : yearsShift < 0
              ? 'bg-red-950/50 border-red-800 text-red-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
          }`}
        >
          [LONGEVITY: {yearsShift > 0 ? `+${yearsShift}Y` : `${yearsShift}Y`}]
        </button>

        <div className="text-right">
          {value === 0 ? (
            <span className="text-zinc-500">EQUILIBRIUM // 0 HRS</span>
          ) : isHeaven ? (
            <span className="text-emerald-400">
              <strong>+{formatNum(consciousnessHrsShift)}</strong> ELYSIAN HRS
            </span>
          ) : (
            <span className="text-red-400">
              <strong>-{formatNum(consciousnessHrsShift)}</strong> TORMENT HRS
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

const STORAGE_KEY = 'finite_canvas_v3_duality_state';
const BASELINE_STORAGE_KEY = 'finite_canvas_v3_duality_baseline';

export default function LifespanApp() {
  const [state, setState] = useState<LifespanState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          psyche: { ...DEFAULT_PSYCHE, ...(parsed.psyche || {}) },
        };
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

  // Strictly 3 Observatory Tabs (Triad)
  const [activeTab, setActiveTab] = useState<'ledger' | 'trajectory' | 'matrix'>('ledger');
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
        if (next.baseLifespan <= ageVal) next.baseLifespan = ageVal + 5;
      }
      return next;
    });
  }, []);

  const updatePsyche = useCallback((key: keyof PsychePolarities, value: number) => {
    setActivePreset(null);
    setState((prev) => ({
      ...prev,
      psyche: {
        ...prev.psyche,
        [key]: value,
      },
    }));
  }, []);

  const setAllPsyche = useCallback((targetValue: number) => {
    setActivePreset(null);
    setState((prev) => {
      const updated = { ...prev.psyche };
      PSYCHE_DEFINITIONS.forEach((d) => {
        updated[d.key] = targetValue;
      });
      return { ...prev, psyche: updated };
    });
  }, []);

  const applyPreset = (key: string) => {
    const preset = ARCHETYPE_PRESETS[key];
    if (!preset) return;
    setActivePreset(key);
    setState((prev) => ({
      ...prev,
      ...preset.state,
      psyche: {
        ...prev.psyche,
        ...(preset.state.psyche || {}),
      },
    }));
  };

  // ============================================================================
  // RIGOROUS YEAR-BY-YEAR + HEAVEN/HELL SIMULATION ENGINE
  // ============================================================================

  const simulateLifecycle = useCallback((s: LifespanState) => {
    const actuarial = calculateActuarialAndPsyche(s);
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
      caregiving: 0,
      commute: 0,
      screen: 0,
      sick: 0,
      admin: 0,
      waitAndDisaster: 0,
      exercise: 0,
      growth: 0,
      fun: 0,
      free: 0,
      healthyFree: 0,
      innerTormentHrs: 0, // Waking hours poisoned by negative psyche polarities (Hell)
      innerElysiumHrs: 0, // Waking hours sanctified by positive psyche polarities (Heaven)
    };

    // Compute aggregate psyche torment vs elysium fractions across the 9 axes
    let tormentFractionOfWaking = 0;
    let elysiumFractionOfWaking = 0;
    PSYCHE_DEFINITIONS.forEach((def) => {
      const val = s.psyche[def.key] ?? 0;
      if (val < 0) tormentFractionOfWaking += (Math.abs(val) / 100) * 0.035;
      if (val > 0) elysiumFractionOfWaking += (val / 100) * 0.035;
    });

    const yearlyTimeline: Array<{
      age: number;
      phase: 'Career Matrix' | 'Golden Elysium' | 'Twilight Fragility';
      isHealthy: boolean;
      Sleep: number;
      Routine: number;
      WorkAndCommute: number;
      Caregiving: number;
      Friction: number;
      Sanctuary: number;
      FreeTime: number;
    }> = [];

    for (let y = 0; y < yearsRemaining; y++) {
      const age = s.currentAge + y;
      const isWorkingYear = age < s.retirementAge;
      const isCaregivingYear = y < s.caregivingYearsRemaining;
      const isHealthyYear = age < actuarial.healthspanAge;

      const yrSleep = s.sleepHrsPerDay * DAYS_PER_YEAR;
      const yrRoutine = s.routineHrsPerDay * DAYS_PER_YEAR;
      const wakingNonRoutineHrsPerDay = Math.max(0, HOURS_PER_DAY - s.sleepHrsPerDay - s.routineHrsPerDay);
      const yrWakingHrs = Math.max(0, HOURS_PER_YEAR - yrSleep);

      const lateLifeExtraSickDays = isHealthyYear ? 0 : 35;
      const effectiveSickDays = Math.min(DAYS_PER_YEAR, s.sickDaysPerYear + lateLifeExtraSickDays);
      const yrSick = effectiveSickDays * wakingNonRoutineHrsPerDay;

      const yrWork = isWorkingYear ? s.workHrsPerWeek * s.workWeeksPerYear : 0;

      // Standard 5 workdays/week scaled by remoteWorkPercent
      const onsiteWorkdaysPerYear = isWorkingYear
        ? 5 * s.workWeeksPerYear * (1 - s.remoteWorkPercent / 100)
        : 0;
      const yrCommute = s.commuteHrsPerWorkday * onsiteWorkdaysPerYear;

      const yrCaregiving = isCaregivingYear ? s.caregivingHrsPerWeek * WEEKS_PER_YEAR : 0;
      const yrScreen = s.passiveScreenHrsPerDay * DAYS_PER_YEAR;
      const yrAdmin = s.adminHrsPerWeek * WEEKS_PER_YEAR;
      const yrWaitAndDisaster = s.waitAndDisasterHrsPerWeek * WEEKS_PER_YEAR;

      const yrExercise = s.exerciseHrsPerWeek * WEEKS_PER_YEAR;
      const yrGrowth = s.growthHrsPerWeek * WEEKS_PER_YEAR;
      const yrFun = s.funHrsPerWeek * WEEKS_PER_YEAR;

      const yrCommitted =
        yrSleep +
        yrRoutine +
        yrSick +
        yrWork +
        yrCommute +
        yrCaregiving +
        yrScreen +
        yrAdmin +
        yrWaitAndDisaster +
        yrExercise +
        yrGrowth +
        yrFun;

      const yrFree = HOURS_PER_YEAR - yrCommitted;

      totals.sleep += yrSleep;
      totals.routine += yrRoutine;
      totals.work += yrWork;
      totals.caregiving += yrCaregiving;
      totals.commute += yrCommute;
      totals.screen += yrScreen;
      totals.sick += yrSick;
      totals.admin += yrAdmin;
      totals.waitAndDisaster += yrWaitAndDisaster;
      totals.exercise += yrExercise;
      totals.growth += yrGrowth;
      totals.fun += yrFun;
      totals.free += yrFree;
      if (isHealthyYear && yrFree > 0) {
        totals.healthyFree += yrFree;
      }

      totals.innerTormentHrs += yrWakingHrs * tormentFractionOfWaking;
      totals.innerElysiumHrs += yrWakingHrs * elysiumFractionOfWaking;

      const phase = isWorkingYear
        ? 'Career Matrix'
        : isHealthyYear
        ? 'Golden Elysium'
        : 'Twilight Fragility';

      yearlyTimeline.push({
        age,
        phase,
        isHealthy: isHealthyYear,
        Sleep: +(yrSleep / DAYS_PER_YEAR).toFixed(2),
        Routine: +(yrRoutine / DAYS_PER_YEAR).toFixed(2),
        WorkAndCommute: +((yrWork + yrCommute) / DAYS_PER_YEAR).toFixed(2),
        Caregiving: +(yrCaregiving / DAYS_PER_YEAR).toFixed(2),
        Friction: +((yrSick + yrScreen + yrAdmin + yrWaitAndDisaster) / DAYS_PER_YEAR).toFixed(2),
        Sanctuary: +((yrExercise + yrGrowth + yrFun) / DAYS_PER_YEAR).toFixed(2),
        FreeTime: +(Math.max(0, yrFree) / DAYS_PER_YEAR).toFixed(2),
      });
    }

    const dailyWorkHrsOnWorkday = s.workHrsPerWeek / 5;
    const dailyCommuteOnWorkday = s.commuteHrsPerWorkday * (1 - s.remoteWorkPercent / 100);
    const dailyCaregivingNow = s.caregivingYearsRemaining > 0 ? s.caregivingHrsPerWeek / 7 : 0;
    const dailyFrictionNow =
      (s.adminHrsPerWeek + s.waitAndDisasterHrsPerWeek) / 7 + s.passiveScreenHrsPerDay;
    const dailySanctuaryNow = (s.exerciseHrsPerWeek + s.growthHrsPerWeek + s.funHrsPerWeek) / 7;

    const currentWorkdayUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      (s.currentAge < s.retirementAge ? dailyWorkHrsOnWorkday + dailyCommuteOnWorkday : 0) +
      dailyCaregivingNow +
      dailyFrictionNow +
      dailySanctuaryNow;

    const currentWeekendUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      dailyCaregivingNow +
      dailyFrictionNow +
      dailySanctuaryNow;

    const retirementDayUsed =
      s.sleepHrsPerDay + s.routineHrsPerDay + dailyFrictionNow + dailySanctuaryNow;

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
      { id: 'sleep', name: 'Sleep & Nocturnal Rest', hours: t.sleep, color: '#2563eb' },
      { id: 'routine', name: 'Daily Maintenance & Rituals', hours: t.routine, color: '#0d9488' },
      { id: 'work', name: 'Primary Career Labor', hours: t.work, color: '#ea580c' },
      { id: 'caregiving', name: 'Lineage & Caregiving', hours: t.caregiving, color: '#db2777' },

      { id: 'commute', name: 'Onsite Transit & Commuting', hours: t.commute, color: '#64748b' },
      { id: 'screen', name: 'Algorithmic Screen Drift', hours: t.screen, color: '#6366f1' },
      { id: 'sick', name: 'Illness & Late-Life Morbidity', hours: t.sick, color: '#dc2626' },
      { id: 'admin', name: 'Life Admin & Bureaucracy', hours: t.admin, color: '#ca8a04' },
      { id: 'wait', name: 'Queues, Delays & Disasters', hours: t.waitAndDisaster, color: '#991b1b' },

      { id: 'exercise', name: 'Physical Vitality & Sport', hours: t.exercise, color: '#10b981' },
      { id: 'growth', name: 'Mastery & Deep Craft', hours: t.growth, color: '#059669' },
      { id: 'fun', name: 'True Leisure & Communion', hours: t.fun, color: '#06b6d4' },
    ];
  }, [sim.totals]);

  const trulyFreeRemainingHours = sim.totals.free;
  const wakingHoursRemaining = Math.max(1, sim.totalRemainingHours - sim.totals.sleep);

  const vesselHours = sim.totals.sleep + sim.totals.routine + sim.totals.work + sim.totals.caregiving;
  const frictionHours =
    sim.totals.commute +
    sim.totals.screen +
    sim.totals.sick +
    sim.totals.admin +
    sim.totals.waitAndDisaster;
  const sanctuaryHours = sim.totals.exercise + sim.totals.growth + sim.totals.fun;

  // Total Heaven (Elysian) vs Total Hell (Infernal) Experiential Hours
  const totalInfernoHours = Math.round(frictionHours + sim.totals.innerTormentHrs);
  const totalElysiumHours = Math.round(
    Math.max(0, trulyFreeRemainingHours) + sanctuaryHours + sim.totals.innerElysiumHrs
  );
  const heavenHellTotal = Math.max(1, totalInfernoHours + totalElysiumHours);
  const elysiumRatioPct = (totalElysiumHours / heavenHellTotal) * 100;

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
      {/* Sacred Matrix Grid Overlay */}
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
      {/* Bilateral Heaven (Right Emerald) & Hell (Left Crimson) Ambient Horizon Glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/4 -translate-x-1/2 w-[700px] h-[300px] opacity-15 blur-[140px]"
        style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed top-0 left-3/4 -translate-x-1/2 w-[700px] h-[300px] opacity-15 blur-[140px]"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        
        {/* ============================================================================
            1. CEREMONIAL AXIAL HEADER & 3x3 SYMMETRICAL COMMAND BAR (3 LEFT | 3 RIGHT)
           ============================================================================ */}
        <header className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-900/60 to-zinc-700" />
            <div className="flex items-center gap-3 px-4 py-1 border border-zinc-800 bg-[#090a0f]">
              <span className="w-1.5 h-1.5 rotate-45 bg-red-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-300">
                THE MATRIX // INFERNO &amp; ELYSIUM LEDGER
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-emerald-400" />
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-emerald-900/60 to-zinc-700" />
          </div>

          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.14em] text-white"
              style={{ fontFamily: "'Cinzel', 'Space Grotesk', serif" }}
            >
              The Finite Canvas
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-zinc-400 tracking-wide leading-relaxed">
              Every solar year grants <span className="text-zinc-200 font-mono font-semibold">8,765.82</span> hours.
              How long you live—and whether those hours are <span className="text-red-400 font-semibold">Hell</span> or <span className="text-emerald-400 font-semibold">Heaven</span>—is governed by what binds your time and what rules your mind.
            </p>
          </div>

          {/* Symmetrical 3 vs 3 Command Bar (3 Archetypes Left | Center Spine | 3 Actions Right) */}
          <div className="relative bg-[#090a0e] border border-zinc-800/90 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <CornerReticles />

            {/* Left Triad: 3 Archetypes */}
            <div className="lg:col-span-6 grid grid-cols-3 gap-2">
              {Object.entries(ARCHETYPE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  title={preset.subtitle}
                  className={`py-2 px-2 border font-mono text-[11px] uppercase tracking-wider text-center truncate transition-all ${
                    activePreset === key
                      ? key === 'inferno'
                        ? 'bg-red-950/70 border-red-500 text-white font-bold'
                        : key === 'elysium'
                        ? 'bg-emerald-950/70 border-emerald-400 text-white font-bold'
                        : 'bg-zinc-800 border-white text-white font-bold'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                  }`}
                >
                  <span className="text-zinc-500 mr-1">{preset.code}.</span>
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Right Triad: 3 Actions */}
            <div className="lg:col-span-6 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={toggleBaseline}
                className={`py-2 px-2 border font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  baseline
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{baseline ? 'CLEAR PIN' : 'I. PIN BASELINE'}</span>
              </button>

              <button
                type="button"
                onClick={copyScenarioJson}
                className="py-2 px-2 border font-mono text-[11px] uppercase tracking-wider bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotice ? 'COPIED JSON' : 'II. EXPORT JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset(null);
                  setState(DEFAULT_STATE);
                }}
                className="py-2 px-2 border font-mono text-[11px] uppercase tracking-wider bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-red-800 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>III. RESET ALL</span>
              </button>
            </div>
          </div>
        </header>

        {/* ============================================================================
            2. SYMMETRICAL TWIN-MONOLITH HERO (6 COLS LEFT | 6 COLS RIGHT)
            Both Monoliths share the exact same 3-part vertical structure!
           ============================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT MONOLITH (6 COLS): I // THE MORTAL VESSEL & HORIZON */}
          <div className="lg:col-span-6 relative bg-[#090a0f] border border-zinc-800 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <CornerReticles color="border-zinc-500/80" />
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-zinc-400/70 to-transparent" />

            {/* Part 1: Header + 3 Cohort Buttons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rotate-45 bg-zinc-300" />
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-200 font-bold">
                    I // THE MORTAL VESSEL &amp; HORIZON
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('useActuarialLifespan', !state.useActuarialLifespan)}
                  className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  MODE // {state.useActuarialLifespan ? 'SSA ACTUARIAL' : 'MANUAL TARGET'}
                </button>
              </div>

              {/* Triad of Biological Cohorts */}
              <div className="grid grid-cols-3 gap-2">
                {(['female', 'average', 'male'] as BiologicalSex[]).map((sexOpt, idx) => (
                  <button
                    key={sexOpt}
                    type="button"
                    onClick={() => {
                      updateField('useActuarialLifespan', true);
                      updateField('sex', sexOpt);
                    }}
                    className={`py-2 px-3 border text-center font-mono text-[11px] uppercase tracking-widest transition-all ${
                      state.useActuarialLifespan && state.sex === sexOpt
                        ? 'bg-zinc-800 border-zinc-400 text-white font-bold'
                        : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    0{idx + 1} // {sexOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Part 2: Triad of Horizon Dials (3 Equal Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dial 1: Current Age */}
              <div className="bg-zinc-950 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">01. AGE NOW</span>
                  <span className="text-xl font-black font-mono text-white">{state.currentAge}Y</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={Math.max(16, sim.lifespan - 1)}
                  value={state.currentAge}
                  onChange={(e) => updateField('currentAge', parseInt(e.target.value, 10))}
                  className="angular-slider w-full"
                  style={{ color: '#e4e4e7' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>EXPENDED</span>
                  <span className="text-zinc-300">{sim.livedPercentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Dial 2: Career Exit Age */}
              <div className="bg-zinc-950 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">02. EXIT LABOR</span>
                  <span className="text-xl font-black font-mono text-orange-400">
                    {state.retirementAge <= state.currentAge ? 'NOW' : `${state.retirementAge}Y`}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.min(state.currentAge, 40)}
                  max={Math.min(90, sim.lifespan)}
                  value={state.retirementAge}
                  onChange={(e) => updateField('retirementAge', parseInt(e.target.value, 10))}
                  className="angular-slider w-full"
                  style={{ color: '#f97316' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>CAREER LEFT</span>
                  <span className="text-orange-300">
                    {Math.max(0, Math.min(sim.lifespan, state.retirementAge) - state.currentAge)}Y
                  </span>
                </div>
              </div>

              {/* Dial 3: Base Lifespan / Longevity */}
              <div className="bg-zinc-950 border border-zinc-800/90 p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">03. HORIZON</span>
                  <span className="text-xl font-black font-mono text-emerald-400">{sim.lifespan}Y</span>
                </div>
                <input
                  type="range"
                  min={Math.max(45, state.currentAge + 1)}
                  max={110}
                  value={state.baseLifespan}
                  onChange={(e) => {
                    updateField('useActuarialLifespan', false);
                    updateField('baseLifespan', parseInt(e.target.value, 10));
                  }}
                  className="angular-slider w-full"
                  style={{ color: '#10b981' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>HABIT/MIND Δ</span>
                  <span className={sim.actuarial.totalLongevityDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {sim.actuarial.totalLongevityDelta >= 0
                      ? `+${sim.actuarial.totalLongevityDelta}Y`
                      : `${sim.actuarial.totalLongevityDelta}Y`}
                  </span>
                </div>
              </div>
            </div>

            {/* Part 3: 3-Segment Horizon Bar & 3-Column Legend */}
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
                  <span>I. PAST ({state.currentAge}Y)</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 bg-emerald-500 inline-block" />
                  <span>II. VITAL ({Math.max(0, sim.actuarial.healthspanAge - state.currentAge)}Y)</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-red-400">
                  <span className="w-2 h-2 bg-red-800 inline-block" />
                  <span>III. TWILIGHT ({sim.actuarial.morbidityYears}Y)</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MONOLITH (6 COLS): II // THE ETERNAL LEDGER (HEAVEN vs. HELL) */}
          <div className="lg:col-span-6 relative bg-[#090a0f] border border-zinc-800 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <CornerReticles color={elysiumRatioPct >= 50 ? 'border-emerald-500/80' : 'border-red-500/80'} />
            <div
              className="absolute top-0 left-10 right-10 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, #dc2626 0%, #ffffff 50%, #10b981 100%)',
              }}
            />

            {/* Part 1: Header + Resonance Badge + 3 Quick Psyche Alignment Buttons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rotate-45 ${
                      elysiumRatioPct >= 50 ? 'bg-emerald-400' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-200 font-bold">
                    II // SOVEREIGNTY &amp; THE SOUL&apos;S LEDGER
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border ${
                    elysiumRatioPct >= 60
                      ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                      : elysiumRatioPct <= 40
                      ? 'bg-red-950/50 border-red-700 text-red-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                  }`}
                >
                  RESONANCE // {elysiumRatioPct.toFixed(0)}% ELYSIAN
                </span>
              </div>

              {/* Triad of Quick Consciousness Alignments (Matches Left Monolith's 3 Cohort Buttons!) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAllPsyche(-75)}
                  className="py-2 px-3 border border-red-900/60 bg-red-950/20 hover:bg-red-950/50 text-red-300 text-center font-mono text-[11px] uppercase tracking-widest transition-all"
                >
                  I // INFERNO MIND
                </button>
                <button
                  type="button"
                  onClick={() => setAllPsyche(0)}
                  className="py-2 px-3 border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 hover:text-white text-center font-mono text-[11px] uppercase tracking-widest transition-all"
                >
                  II // STILLPOINT (0)
                </button>
                <button
                  type="button"
                  onClick={() => setAllPsyche(80)}
                  className="py-2 px-3 border border-emerald-900/60 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-300 text-center font-mono text-[11px] uppercase tracking-widest transition-all"
                >
                  III // ELYSIUM MIND
                </button>
              </div>
            </div>

            {/* Part 2: Triad of Monumental Readout Boxes (Matches Left Monolith's 3 Dials!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Box 1: Inferno / Hell Hours */}
              <div className="bg-red-950/15 border border-red-900/60 p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-red-400">
                  <span>01. INFERNO TAX</span>
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-black font-mono text-red-300 tracking-tight">
                  {formatNum(totalInfernoHours)} <span className="text-xs font-normal text-red-500">HRS</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>FRICTION + TORMENT</span>
                  <span className="text-red-400">{(totalInfernoHours / HOURS_PER_YEAR).toFixed(1)}Y</span>
                </div>
              </div>

              {/* Box 2: Unallocated Raw Free Time */}
              <div className="bg-zinc-950 border border-zinc-700 p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                  <span>02. RAW FREE TIME</span>
                  <Hourglass className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-xl font-black font-mono text-white tracking-tight">
                  {formatNum(trulyFreeRemainingHours)} <span className="text-xs font-normal text-zinc-500">HRS</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>UNSCRIPTED</span>
                  <span className={trulyFreeRemainingHours >= 0 ? 'text-zinc-200' : 'text-red-400'}>
                    {(trulyFreeRemainingHours / HOURS_PER_YEAR).toFixed(1)}Y
                  </span>
                </div>
              </div>

              {/* Box 3: Elysium / Heaven Hours */}
              <div className="bg-emerald-950/15 border border-emerald-900/60 p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                  <span>03. ELYSIAN PEACE</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-black font-mono text-emerald-300 tracking-tight">
                  {formatNum(totalElysiumHours)} <span className="text-xs font-normal text-emerald-600">HRS</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>SANCTUARY + GRACE</span>
                  <span className="text-emerald-400">{(totalElysiumHours / HOURS_PER_YEAR).toFixed(1)}Y</span>
                </div>
              </div>
            </div>

            {/* Part 3: Heaven vs. Hell Balance Bar & 3-Column Legend (Matches Left Monolith!) */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/80">
              <div className="w-full bg-zinc-950 h-4 flex overflow-hidden border border-zinc-800 p-0.5 gap-0.5">
                <div
                  className="bg-gradient-to-r from-red-900 to-red-600 h-full transition-all duration-500"
                  style={{ width: `${100 - elysiumRatioPct}%` }}
                />
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-500"
                  style={{ width: `${elysiumRatioPct}%` }}
                />
              </div>

              <div className="grid grid-cols-3 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-red-400">
                  <span className="w-2 h-2 bg-red-600 inline-block" />
                  <span>I. HELL: {(100 - elysiumRatioPct).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-zinc-300">
                  <span>
                    II. PSYCHE LONGEVITY:{' '}
                    <strong className={sim.actuarial.psycheYearsDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {sim.actuarial.psycheYearsDelta >= 0
                        ? `+${sim.actuarial.psycheYearsDelta}Y`
                        : `${sim.actuarial.psycheYearsDelta}Y`}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-emerald-400">
                  <span className="w-2 h-2 bg-emerald-400 inline-block" />
                  <span>III. HEAVEN: {elysiumRatioPct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================
            3. SYMMETRICAL 6-PILLAR TELEMETRY MATRIX (2x3 / 1x6 — GROUP OF 6)
           ============================================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              code: '01 // PAST',
              label: 'HOURS EXPENDED',
              val: `${formatNum(sim.hoursLived)}H`,
              sub: `${state.currentAge} SOLAR YEARS`,
              border: 'border-zinc-800',
              text: 'text-zinc-200',
            },
            {
              code: '02 // WAKING',
              label: 'WAKING HOURS LEFT',
              val: `${formatNum(wakingHoursRemaining)}H`,
              sub: `${(wakingHoursRemaining / HOURS_PER_YEAR).toFixed(1)} WAKING YRS`,
              border: 'border-blue-900/70',
              text: 'text-blue-300',
            },
            {
              code: '03 // GOLDEN',
              label: 'VITAL RETIREMENT',
              val: `${Math.max(0, sim.actuarial.healthspanAge - Math.max(state.currentAge, state.retirementAge))} YRS`,
              sub: `AGE ${Math.max(state.currentAge, state.retirementAge)} → ${sim.actuarial.healthspanAge}`,
              border: 'border-amber-900/70',
              text: 'text-amber-300',
            },
            {
              code: '04 // MATRIX',
              label: 'OUTER FRICTION TAX',
              val: `${(frictionHours / HOURS_PER_YEAR).toFixed(1)} YRS`,
              sub: `${formatNum(frictionHours)} HRS DRAINED`,
              border: 'border-red-900/70',
              text: 'text-red-400',
            },
            {
              code: '05 // INFERNO',
              label: 'INNER TORMENT TAX',
              val: `${(sim.totals.innerTormentHrs / HOURS_PER_YEAR).toFixed(1)} YRS`,
              sub: `${formatNum(sim.totals.innerTormentHrs)} HRS RUMINATION`,
              border: 'border-red-800/80',
              text: 'text-red-300',
            },
            {
              code: '06 // ELYSIUM',
              label: 'INNER GRACE YIELD',
              val: `${(sim.totals.innerElysiumHrs / HOURS_PER_YEAR).toFixed(1)} YRS`,
              sub: `${formatNum(sim.totals.innerElysiumHrs)} HRS PRESENCE`,
              border: 'border-emerald-800/80',
              text: 'text-emerald-300',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-[#090a0f] border ${item.border} p-4 flex flex-col justify-between`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <span>{item.code}</span>
                <span className="w-1.5 h-1.5 rotate-45 bg-zinc-700" />
              </div>
              <div className={`text-xl font-black font-mono my-1 ${item.text}`}>
                {item.val}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 truncate">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Baseline Delta Banner (Only shown when a Baseline is pinned) */}
        {baselineSim && (
          <div className="grid grid-cols-3 gap-4 bg-amber-950/20 border border-amber-700/70 p-4 font-mono text-xs text-center">
            <div>
              <span className="text-zinc-400 mr-2">I. LIFESPAN SHIFT vs. PIN:</span>
              <strong className={lifespanDeltaYrs && lifespanDeltaYrs >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {lifespanDeltaYrs && lifespanDeltaYrs >= 0 ? `+${lifespanDeltaYrs} YEARS` : `${lifespanDeltaYrs} YEARS`}
              </strong>
            </div>
            <div>
              <span className="text-zinc-400 mr-2">II. RAW FREE TIME SHIFT:</span>
              <strong className={freeDeltaHrs && freeDeltaHrs >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {freeDeltaHrs && freeDeltaHrs >= 0 ? `+${formatNum(freeDeltaHrs)} HRS` : `${formatNum(freeDeltaHrs || 0)} HRS`}
              </strong>
            </div>
            <div>
              <span className="text-zinc-400 mr-2">III. PSYCHE INDEX:</span>
              <strong className="text-amber-300">{sim.actuarial.meanPsycheIndex}</strong>
            </div>
          </div>
        )}

        {/* ============================================================================
            4. SYMMETRICAL OBSERVATORY (STRICT TRIAD OF 3 TABS)
           ============================================================================ */}
        <div className="relative bg-[#090a0f] border border-zinc-800 p-6 md:p-8 space-y-8">
          <CornerReticles color="border-zinc-600" />

          {/* Triad of 3 Equal-Width Observatory Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-zinc-800 pb-6">
            {[
              { id: 'ledger', code: 'I', label: 'THE MORTAL LEDGER (ALLOCATION)', icon: PieChartIcon },
              { id: 'trajectory', code: 'II', label: 'PHASE TRAJECTORY & DIURNAL AUDIT', icon: Layers },
              { id: 'matrix', code: 'III', label: 'MEMENTO MORI SOLAR MATRIX', icon: Grid },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3.5 px-4 border font-mono text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all ${
                    isActive
                      ? 'bg-white text-black border-white font-extrabold shadow-[0_0_25px_rgba(255,255,255,0.15)]'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    <span className={isActive ? 'text-red-600 mr-1.5' : 'text-zinc-600 mr-1.5'}>{tab.code}.</span>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TAB I: THE MORTAL LEDGER (6 COLS LEFT | 6 COLS RIGHT) */}
          {activeTab === 'ledger' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between bg-zinc-950/70 border border-zinc-800/80 p-6">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">REMAINING</span>
                    <span className="text-4xl font-black text-white font-mono my-0.5">{sim.yearsRemaining}Y</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                      {formatNum(sim.totalRemainingHours)} HRS
                    </span>
                  </div>
                </div>

                {/* Triad of Realm Totals */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80 text-center font-mono">
                  <div className="bg-zinc-900/60 border border-zinc-800 p-3">
                    <div className="text-[10px] text-zinc-500 uppercase">I. THE VESSEL</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {(vesselHours / HOURS_PER_YEAR).toFixed(1)}Y
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {((vesselHours / sim.totalRemainingHours) * 100).toFixed(0)}% TOTAL
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 p-3">
                    <div className="text-[10px] text-zinc-500 uppercase">II. FRICTION</div>
                    <div className="text-base font-bold text-red-400 mt-0.5">
                      {(frictionHours / HOURS_PER_YEAR).toFixed(1)}Y
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {((frictionHours / sim.totalRemainingHours) * 100).toFixed(0)}% TOTAL
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 p-3">
                    <div className="text-[10px] text-zinc-500 uppercase">III. SOVEREIGN</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      {((sanctuaryHours + Math.max(0, trulyFreeRemainingHours)) / HOURS_PER_YEAR).toFixed(1)}Y
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {(
                        ((sanctuaryHours + Math.max(0, trulyFreeRemainingHours)) / sim.totalRemainingHours) *
                        100
                      ).toFixed(0)}
                      % TOTAL
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-zinc-950/70 border border-zinc-800/80 p-6 flex flex-col justify-between">
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

          {/* TAB II: PHASE TRAJECTORY + TRIAD OF DIURNAL AUDITS */}
          {activeTab === 'trajectory' && (
            <div className="space-y-6">
              <div className="h-[300px] w-full bg-zinc-950/70 border border-zinc-800/80 p-4">
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
                        return `AGE ${age} // ${row?.phase.toUpperCase() || ''}`;
                      }}
                    />
                    <Area type="monotone" dataKey="Sleep" stackId="1" stroke="#2563eb" fill="#1d4ed8" />
                    <Area type="monotone" dataKey="Routine" stackId="1" stroke="#0d9488" fill="#0f766e" />
                    <Area type="monotone" dataKey="WorkAndCommute" stackId="1" stroke="#ea580c" fill="#c2410c" />
                    <Area type="monotone" dataKey="Caregiving" stackId="1" stroke="#db2777" fill="#be185d" />
                    <Area type="monotone" dataKey="Friction" stackId="1" stroke="#dc2626" fill="#991b1b" />
                    <Area type="monotone" dataKey="Sanctuary" stackId="1" stroke="#06b6d4" fill="#0891b2" />
                    <Area type="monotone" dataKey="FreeTime" stackId="1" stroke="#22c55e" fill="#16a34a" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Symmetrical Triad of 24-Hour Daily Audits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    code: 'I // LABOR DAY',
                    title: 'Current Workday (24H)',
                    used: sim.dailyAudit.workdayUsed,
                    free: sim.dailyAudit.workdayFree,
                  },
                  {
                    code: 'II // SABBATH DAY',
                    title: 'Current Off-Day (24H)',
                    used: sim.dailyAudit.weekendUsed,
                    free: sim.dailyAudit.weekendFree,
                  },
                  {
                    code: `III // ENCORE DAY (AGE ${state.retirementAge}+)`,
                    title: 'Post-Exit Day (24H)',
                    used: sim.dailyAudit.retirementUsed,
                    free: sim.dailyAudit.retirementFree,
                  },
                ].map((card, idx) => (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 p-5 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                      <span>{card.code}</span>
                      <span>{card.free >= 0 ? 'SOLVENT' : 'DEFICIT'}</span>
                    </div>
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-sm font-bold text-white">{card.title}</span>
                      <span className={`text-xl font-black ${card.free >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {card.free >= 0 ? `+${card.free.toFixed(1)}H FREE` : `${card.free.toFixed(1)}H`}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${card.free >= 0 ? 'bg-emerald-500' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(100, (card.used / 24) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB III: MEMENTO MORI MATRIX + 3-COLUMN INSPECTOR */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
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

              {/* Symmetrical 3-Column Coordinate Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">I // SOLAR COORDINATE</span>
                  <strong className="text-white text-sm">
                    AGE {inspectedAge} (WEEKS {inspectedAge * 52}–{(inspectedAge + 1) * 52})
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">II // REALM PHASE</span>
                  <strong className="text-zinc-200 text-sm uppercase">
                    {inspectedAge < state.currentAge ? 'EXPENDED PAST' : inspectedRow?.phase || 'ACTIVE'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">III // DAILY SOVEREIGNTY</span>
                  <strong className="text-emerald-400 text-sm">
                    {inspectedAge < state.currentAge
                      ? 'HISTORICAL'
                      : `${((inspectedRow?.Sanctuary || 0) + (inspectedRow?.FreeTime || 0)).toFixed(1)} HRS / DAY`}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================================
            5. THE 3-6-9 SACRED CONTROL MATRICES
            Every section is a strict multiple of 3 (6, 6, 3, 9) with 100% uniform cards!
           ============================================================================ */}
        <div className="space-y-16 pt-4">
          
          {/* SECTION I: THE VESSEL & OBLIGATIONS (6 CARDS — 2x3 MATRIX) */}
          <section>
            <AxialSectionHeader
              roman="I"
              matrixBadge="6 INSTRUMENTS (2×3)"
              title="The Mortal Vessel"
              subtitle="Biological imperatives, career labor, and lineage commitments required to sustain existence."
              accentColor="#3b82f6"
              rightStatLabel="ALLOCATED"
              rightStatValue={`${(vesselHours / HOURS_PER_YEAR).toFixed(1)} YEARS`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <UniformSliderCard
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
                benchmarkLabel="ATUS // 8.5H"
                benchmarkValue={8.5}
              />

              <UniformSliderCard
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
                benchmarkLabel="ATUS // 2.3H"
                benchmarkValue={2.3}
              />

              <UniformSliderCard
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
                benchmarkLabel="ATUS // 38.5H"
                benchmarkValue={38.5}
              />

              <UniformSliderCard
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
                benchmarkLabel="US AVG // 49W"
                benchmarkValue={49}
              />

              <UniformSliderCard
                indexCode="I.05"
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
                benchmarkLabel="PARENTS // 12H"
                benchmarkValue={12}
              />

              <UniformSliderCard
                indexCode="I.06"
                label="Caregiving Horizon"
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
                benchmarkLabel="CHILD // 18Y"
                benchmarkValue={18}
              />
            </div>
          </section>

          {/* SECTION II: THE MATRIX — EXTERNAL FRICTION (6 CARDS — 2x3 MATRIX) */}
          <section>
            <AxialSectionHeader
              roman="II"
              matrixBadge="6 INSTRUMENTS (2×3)"
              title="The Matrix (External Friction)"
              subtitle="Unseen taxes on waking consciousness: transit, algorithmic feeds, illness, and bureaucratic entropy."
              accentColor="#dc2626"
              rightStatLabel="FRICTION DRAIN"
              rightStatValue={`${(frictionHours / HOURS_PER_YEAR).toFixed(1)} YEARS`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <UniformSliderCard
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
                benchmarkLabel="CENSUS // 0.9H"
                benchmarkValue={0.9}
              />

              <UniformSliderCard
                indexCode="II.02"
                label="Remote / WFH Autonomy"
                subtitle="Percentage of workdays with zero transit"
                icon={Compass}
                colorClass="text-slate-400"
                accentHex="#64748b"
                value={state.remoteWorkPercent}
                onChange={(v) => updateField('remoteWorkPercent', v)}
                min={0}
                max={100}
                step={10}
                unit="% wfh"
                hours={sim.totals.commute}
                benchmarkLabel="HYBRID // 40%"
                benchmarkValue={40}
              />

              <UniformSliderCard
                indexCode="II.03"
                label="Algorithmic Screen Drift"
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
                benchmarkLabel="US AVG // 2.8H"
                benchmarkValue={2.8}
              />

              <UniformSliderCard
                indexCode="II.04"
                label="Acute Sickness & Morbidity"
                subtitle="Waking down-days (+late-life fragility)"
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
                benchmarkLabel="CDC // 5.0D"
                benchmarkValue={5}
              />

              <UniformSliderCard
                indexCode="II.05"
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
                benchmarkLabel="ATUS // 3.5H"
                benchmarkValue={3.5}
              />

              <UniformSliderCard
                indexCode="II.06"
                label="Queues, Delays & Crises"
                subtitle="Waiting lines, traffic, unplanned repairs"
                icon={Hourglass}
                colorClass="text-orange-500"
                accentHex="#f97316"
                value={state.waitAndDisasterHrsPerWeek}
                onChange={(v) => updateField('waitAndDisasterHrsPerWeek', v)}
                min={0}
                max={12}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.waitAndDisaster}
                benchmarkLabel="AVG // 2.0H"
                benchmarkValue={2.0}
              />
            </div>
          </section>

          {/* SECTION III: THE SANCTUARY — OUTER SOVEREIGNTY (3 CARDS — 1x3 MATRIX) */}
          <section>
            <AxialSectionHeader
              roman="III"
              matrixBadge="3 INSTRUMENTS (1×3)"
              title="The Sanctuary (Outer Sovereignty)"
              subtitle="Deliberate investments in physical vitality, deep craft, and communion."
              accentColor="#10b981"
              rightStatLabel="SANCTUARY YIELD"
              rightStatValue={`${(sanctuaryHours / HOURS_PER_YEAR).toFixed(1)} YEARS`}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <UniformSliderCard
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
                benchmarkLabel="WHO // 3.5H"
                benchmarkValue={3.5}
              />

              <UniformSliderCard
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
                benchmarkLabel="ATUS // 2.0H"
                benchmarkValue={2.0}
              />

              <UniformSliderCard
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
                benchmarkLabel="ATUS // 14.0H"
                benchmarkValue={14.0}
              />
            </div>
          </section>

          {/* SECTION IV: THE PSYCHE — HEAVEN & HELL POLARITIES (9 CARDS — 3x3 MATRIX) */}
          <section>
            <AxialSectionHeader
              roman="IV"
              matrixBadge="9 POLARITIES (3×3)"
              title="The Psyche (Heaven &amp; Hell Within)"
              subtitle="Nine internal perspectives weighted on psychoneuroimmunology. Pulling left breeds cortisol, shortens life, and turns waking hours into Hell; pulling right cultivates acceptance, extends longevity, and turns time into Heaven."
              accentColor="#f59e0b"
              rightStatLabel="LONGEVITY SHIFT"
              rightStatValue={
                sim.actuarial.psycheYearsDelta >= 0
                  ? `+${sim.actuarial.psycheYearsDelta} YEARS`
                  : `${sim.actuarial.psycheYearsDelta} YEARS`
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PSYCHE_DEFINITIONS.map((def) => (
                <PolarityDualityCard
                  key={def.key}
                  def={def}
                  value={state.psyche[def.key]}
                  onChange={(val) => updatePsyche(def.key, val)}
                  wakingHoursRemaining={wakingHoursRemaining}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Ceremonial 3-Column Colophon Footer */}
        <footer className="pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-1.5 h-1.5 rotate-45 bg-red-600" />
            <span>I // THE FINITE CANVAS</span>
          </div>
          <div className="text-center">
            II // 3 · 6 · 9 SACRED SYMMETRY ARCHITECTURE
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <span>III // MEMENTO MORI</span>
            <span className="w-1.5 h-1.5 rotate-45 bg-emerald-400" />
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
