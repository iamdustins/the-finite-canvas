import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Moon, Briefcase, Coffee, Car,
  Thermometer, Hourglass, PhoneCall,
  BookOpen, Smile,
  Users, Smartphone, Activity, Calendar, RotateCcw,
  Bookmark, Check, Sparkles, Layers, Grid,
  PieChart as PieChartIcon, Copy, Compass, Flame
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ============================================================================
// CONSTANTS & SACRED 3-6-9 ARCHITECTURE
// ============================================================================

const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365.2425; // Exact Gregorian solar year
const HOURS_PER_YEAR = DAYS_PER_YEAR * HOURS_PER_DAY; // ~8,765.82 hrs/yr
const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7; // ~52.1775 wks/yr

type BiologicalSex = 'female' | 'average' | 'male';

interface SoulPostures {
  empathy: number;     // -100 (Demand to Be Understood) <-> +100 (Seek to Understand)
  acceptance: number;  // -100 (Anger at What Happened)  <-> +100 (Radical Acceptance)
  forgiveness: number; // -100 (Harbor Resentment)       <-> +100 (Forgiveness & Release)
  surrender: number;   // -100 (Hyper-Control & Dread)   <-> +100 (Trust & Adaptability)
  gratitude: number;   // -100 (Scarcity & Comparison)   <-> +100 (Gratitude & Sufficiency)
  presence: number;    // -100 (Regret & Future Dread)   <-> +100 (Grounded Presence)
  humility: number;    // -100 (Compulsion to Be Right)  <-> +100 (Curiosity & Humility)
  communion: number;   // -100 (Cynicism & Isolation)    <-> +100 (Communion & Warmth)
  purpose: number;     // -100 (Existential Drift)       <-> +100 (Luminous Purpose)
}

interface LifespanState {
  // Core Triad (3 Horizon Anchors)
  currentAge: number;
  retirementAge: number;
  baseLifespan: number;
  sex: BiologicalSex;
  useActuarialLifespan: boolean;

  // Section I: The Foundation (6 Sliders — 2x3)
  sleepHrsPerDay: number;
  routineHrsPerDay: number;
  workHrsPerWeek: number;
  workWeeksPerYear: number;
  caregivingHrsPerWeek: number;
  caregivingYearsRemaining: number;

  // Section II: The Undertow (6 Sliders — 2x3)
  commuteHrsPerWorkday: number;
  remoteWorkPercent: number;
  passiveScreenHrsPerDay: number;
  sickDaysPerYear: number;
  adminHrsPerWeek: number;
  waitAndDisasterHrsPerWeek: number;

  // Section III: The Brushstrokes (3 Sliders — 1x3)
  exerciseHrsPerWeek: number;
  growthHrsPerWeek: number;
  funHrsPerWeek: number;

  // Section IV: The Posture of the Soul (9 Sliders — 3x3)
  psyche: SoulPostures;
}

interface PolarityDefinition {
  key: keyof SoulPostures;
  code: string;
  title: string;
  shadowPole: string;
  shadowSub: string;
  lightPole: string;
  lightSub: string;
  maxYearsImpact: number;
}

// 9 Sacred Polarities of the Soul (3x3 Matrix)
const SOUL_DEFINITIONS: PolarityDefinition[] = [
  {
    key: 'empathy',
    code: 'IV · 01',
    title: 'The Mirror of Understanding',
    shadowPole: 'Need to Be Understood',
    shadowSub: 'Defensive pride & unspoken grievance',
    lightPole: 'Seek to Understand',
    lightSub: 'Generous listening & quiet empathy',
    maxYearsImpact: 1.2,
  },
  {
    key: 'acceptance',
    code: 'IV · 02',
    title: 'The Weight of What Happened',
    shadowPole: 'Bitter Resistance',
    shadowSub: 'Warring against unchangeable events',
    lightPole: 'Luminous Acceptance',
    lightSub: 'Making peace with the shape of fate',
    maxYearsImpact: 1.5,
  },
  {
    key: 'forgiveness',
    code: 'IV · 03',
    title: 'The Ledger of Memory',
    shadowPole: 'Harbored Resentment',
    shadowSub: 'Carrying old embers that burn within',
    lightPole: 'Grace & Release',
    lightSub: 'Setting down the weight of old debts',
    maxYearsImpact: 1.3,
  },
  {
    key: 'surrender',
    code: 'IV · 04',
    title: 'The Horizon of Uncertainty',
    shadowPole: 'Clenched Control',
    shadowSub: 'Bracing in dread against the unknown',
    lightPole: 'Open Surrender',
    lightSub: 'Moving like water with what arrives',
    maxYearsImpact: 1.2,
  },
  {
    key: 'gratitude',
    code: 'IV · 05',
    title: 'The Measure of Enough',
    shadowPole: 'Restless Comparison',
    shadowSub: 'Starving inside another’s reflection',
    lightPole: 'Quiet Reverence',
    lightSub: 'Beholding the fullness of what is here',
    maxYearsImpact: 1.1,
  },
  {
    key: 'presence',
    code: 'IV · 06',
    title: 'The Inhabited Hour',
    shadowPole: 'Ghosts of Past & Future',
    shadowSub: 'Absent from the only hour that exists',
    lightPole: 'Stillness & Presence',
    lightSub: 'Awake inside the living breath',
    maxYearsImpact: 1.2,
  },
  {
    key: 'humility',
    code: 'IV · 07',
    title: 'The Armor of Certainty',
    shadowPole: 'Need to Be Right',
    shadowSub: 'Hardened walls around a fragile self',
    lightPole: 'Wonder & Humility',
    lightSub: 'Softness to unlearn, listen & grow',
    maxYearsImpact: 1.0,
  },
  {
    key: 'communion',
    code: 'IV · 08',
    title: 'The Bridge to Others',
    shadowPole: 'Guarded Isolation',
    shadowSub: 'Cold withdrawal from human warmth',
    lightPole: 'Deep Communion',
    lightSub: 'Unarmored kinship & shared belonging',
    maxYearsImpact: 1.8,
  },
  {
    key: 'purpose',
    code: 'IV · 09',
    title: 'The Meaning of the Work',
    shadowPole: 'Aimless Attrition',
    shadowSub: 'Spending days as a weight to endure',
    lightPole: 'Sacred Vocation',
    lightSub: 'Treating time as an offering of craft',
    maxYearsImpact: 1.7,
  },
];

const DEFAULT_PSYCHE: SoulPostures = {
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
  drift: {
    code: 'I',
    name: 'The Common Drift',
    subtitle: 'Statistical Mean & Unexamined Equilibrium',
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
  yoke: {
    code: 'II',
    name: 'The Heavy Yoke',
    subtitle: 'Relentless Attrition, Restlessness & Inner Friction',
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
  luminous: {
    code: 'III',
    name: 'The Luminous Life',
    subtitle: 'Sovereign Craft, Vitality & Deep Acceptance',
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

  let survivalBonus = 0;
  if (age <= 20) survivalBonus = age * 0.04;
  else if (age <= 50) survivalBonus = 0.8 + (age - 20) * 0.065;
  else if (age <= 75) survivalBonus = 2.75 + (age - 50) * 0.18;
  else survivalBonus = 7.25 + (age - 75) * 0.38;

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

  let psycheYearsDelta = 0;
  let psycheScoreSum = 0;
  SOUL_DEFINITIONS.forEach((def) => {
    const val = state.psyche[def.key] ?? 0;
    psycheScoreSum += val;
    psycheYearsDelta += (val / 100) * def.maxYearsImpact;
  });

  const meanPsycheIndex = psycheScoreSum / SOUL_DEFINITIONS.length;
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
// ETHEREAL & ANGULAR ARCHITECTURAL COMPONENTS
// ============================================================================

const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));

const CornerFrames: React.FC<{ color?: string }> = ({ color = 'border-amber-200/20' }) => (
  <>
    <span className={`pointer-events-none absolute top-0 left-0 w-3 h-3 border-t border-l ${color}`} />
    <span className={`pointer-events-none absolute top-0 right-0 w-3 h-3 border-t border-r ${color}`} />
    <span className={`pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-b border-l ${color}`} />
    <span className={`pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b border-r ${color}`} />
  </>
);

const AxialSectionHeader: React.FC<{
  roman: string;
  cadenceLabel: string;
  title: string;
  subtitle: string;
  accentColor: string;
  statLabel: string;
  statValue: string;
}> = ({ roman, cadenceLabel, title, subtitle, accentColor, statLabel, statValue }) => (
  <div className="relative mb-10">
    {/* Symmetrical Luminous Horizon Line */}
    <div className="flex items-center justify-center gap-5 mb-4">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-amber-200/25" />
      <div className="flex items-center gap-3 px-5 py-1.5 bg-[#0a0b10]/90 border border-white/[0.08] text-[11px] tracking-[0.22em] uppercase text-zinc-400 backdrop-blur-md">
        <span className="w-1.5 h-1.5 rotate-45 inline-block" style={{ backgroundColor: accentColor }} />
        <span className="text-amber-100/90 font-medium">Movement {roman}</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-400">{cadenceLabel}</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-300">
          {statLabel}: <strong className="text-white font-mono">{statValue}</strong>
        </span>
        <span className="w-1.5 h-1.5 rotate-45 inline-block" style={{ backgroundColor: accentColor }} />
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-amber-200/25" />
    </div>

    <div className="text-center max-w-2xl mx-auto space-y-2">
      <h2
        className="text-3xl md:text-4xl font-normal italic tracking-wide text-zinc-100"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="text-xs md:text-sm text-zinc-400/90 font-light tracking-wide leading-relaxed">
        {subtitle}
      </p>
    </div>
  </div>
);

/**
 * 100% Uniform Standard Instrument Card (Used across Movements I, II, and III)
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
    <div className="relative bg-[#090a10]/90 border border-white/[0.07] p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:border-amber-100/25 hover:bg-[#0d0f17] backdrop-blur-md group h-full shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <CornerFrames color="border-white/15 group-hover:border-amber-200/40 transition-colors" />
      <div
        className="absolute top-0 left-10 right-10 h-[1px] opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)` }}
      />

      {/* Row 1: Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-8 h-8 flex-shrink-0 bg-zinc-950/90 border flex items-center justify-center mt-0.5"
            style={{ borderColor: `${accentHex}45` }}
          >
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest">{indexCode}</span>
              <span
                className="text-lg font-medium text-zinc-100 tracking-wide truncate"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {label}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate font-light">{subtitle}</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 bg-zinc-950/90 border border-white/[0.07] px-2.5 py-1 min-w-[78px]">
          <span className="text-base font-semibold text-white font-mono tracking-tight">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 ml-1 font-mono">{unit}</span>
        </div>
      </div>

      {/* Row 2: Precision Angular Track */}
      <div className="relative py-1 flex items-center">
        <div className="w-full h-1.5 bg-zinc-950 border border-white/[0.07] overflow-hidden pointer-events-none">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${fillPct}%`,
              background: `linear-gradient(90deg, ${accentHex}33 0%, ${accentHex} 100%)`,
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

      {/* Row 3: 100% Uniform Footer */}
      <div className="flex justify-between items-center text-[11px] font-mono pt-2 border-t border-white/[0.05]">
        <button
          type="button"
          onClick={() => onChange(benchmarkValue)}
          className="text-zinc-400 hover:text-amber-100 bg-zinc-950/90 hover:bg-zinc-900 border border-white/[0.07] hover:border-amber-200/30 px-2.5 py-0.5 transition-all tracking-wider text-[10px]"
        >
          {benchmarkLabel}
        </button>

        <div className="text-right text-zinc-400">
          <strong className="text-zinc-100 font-medium">{formatNum(hours)}</strong>{' '}
          <span className="text-zinc-500">hrs</span>{' '}
          <span className="text-zinc-700">·</span>{' '}
          <span className="text-amber-100/70">{(hours / HOURS_PER_YEAR).toFixed(1)} yrs</span>
        </div>
      </div>
    </div>
  );
});

/**
 * 100% Uniform Soul Posture Duality Card (Used across Movement IV — 3x3 Matrix)
 * Pull Left (-100) -> Heavy Shadow / Contraction (Rose-Crimson)
 * Pull Right (+100) -> Ethereal Light / Expansion (Celestial Gold & Emerald-Teal)
 */
interface PolarityCardProps {
  def: PolarityDefinition;
  value: number;
  onChange: (val: number) => void;
  wakingHoursRemaining: number;
}

const SoulPostureCard: React.FC<PolarityCardProps> = React.memo(({
  def,
  value,
  onChange,
  wakingHoursRemaining,
}) => {
  const isLight = value > 0;
  const isShadow = value < 0;
  const accentHex = isLight ? '#34d399' : isShadow ? '#e11d48' : '#a1a1aa';

  const yearsShift = +((value / 100) * def.maxYearsImpact).toFixed(2);
  const consciousnessHrsShift = Math.round((Math.abs(value) / 100) * 0.035 * wakingHoursRemaining);

  const leftWidth = value < 0 ? Math.abs(value) / 2 : 0;
  const rightWidth = value > 0 ? value / 2 : 0;

  return (
    <div
      className={`relative bg-[#090a10]/90 border p-5 flex flex-col justify-between gap-4 transition-all duration-300 backdrop-blur-md group h-full shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${
        isLight
          ? 'border-emerald-400/20 hover:border-emerald-300/45'
          : isShadow
          ? 'border-rose-500/20 hover:border-rose-400/45'
          : 'border-white/[0.07] hover:border-white/20'
      }`}
    >
      <CornerFrames
        color={
          isLight
            ? 'border-emerald-300/35'
            : isShadow
            ? 'border-rose-400/35'
            : 'border-white/15'
        }
      />

      {/* Top Bilateral Chiaroscuro Hairline */}
      <div
        className="absolute top-0 left-8 right-8 h-[1px] opacity-75"
        style={{
          background: 'linear-gradient(90deg, #e11d48 0%, rgba(255,255,255,0.15) 50%, #34d399 100%)',
        }}
      />

      {/* Row 1: Poetic Title + Symmetrical Shadow vs. Light Poles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] border-b border-white/[0.06] pb-2">
          <span className="text-rose-400/80 font-mono">Shadow</span>
          <span
            className="text-base italic font-medium text-amber-50/95 tracking-wide capitalize"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {def.title}
          </span>
          <span className="text-emerald-300/80 font-mono">Grace</span>
        </div>

        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* Left Pole: Contraction / Weight */}
          <div
            className={`text-left p-2.5 border transition-colors flex flex-col justify-between ${
              isShadow
                ? 'bg-rose-950/25 border-rose-500/35 text-rose-100'
                : 'bg-zinc-950/60 border-white/[0.05] text-zinc-400'
            }`}
          >
            <div
              className="text-sm font-medium leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {def.shadowPole}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 leading-snug font-light">{def.shadowSub}</div>
          </div>

          {/* Right Pole: Expansion / Light */}
          <div
            className={`text-right p-2.5 border transition-colors flex flex-col justify-between ${
              isLight
                ? 'bg-emerald-950/25 border-emerald-400/35 text-emerald-100'
                : 'bg-zinc-950/60 border-white/[0.05] text-zinc-400'
            }`}
          >
            <div
              className="text-sm font-medium leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {def.lightPole}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 leading-snug font-light">{def.lightSub}</div>
          </div>
        </div>
      </div>

      {/* Row 2: Center-Stillpoint Bipolar Track */}
      <div className="relative py-1.5 flex items-center">
        <div className="w-full h-1.5 bg-zinc-950 border border-white/[0.08] relative overflow-hidden pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-amber-100/50 z-10" />
          {leftWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-l from-rose-950 via-rose-700 to-rose-500"
              style={{ right: '50%', width: `${leftWidth}%` }}
            />
          )}
          {rightWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-950 via-emerald-600 to-teal-300"
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

      {/* Row 3: 100% Uniform Bipolar Footer */}
      <div className="flex justify-between items-center text-[11px] font-mono pt-2 border-t border-white/[0.05]">
        <button
          type="button"
          onClick={() => onChange(0)}
          title="Return to Stillpoint (0)"
          className={`px-2.5 py-0.5 border text-[10px] tracking-wider transition-all ${
            yearsShift > 0
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : yearsShift < 0
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
              : 'bg-zinc-950 border-white/[0.07] text-zinc-400'
          }`}
        >
          Horizon {yearsShift > 0 ? `+${yearsShift} yrs` : `${yearsShift} yrs`}
        </button>

        <div className="text-right">
          {value === 0 ? (
            <span className="text-zinc-500">Stillpoint · 0 hrs</span>
          ) : isLight ? (
            <span className="text-emerald-300">
              <strong>+{formatNum(consciousnessHrsShift)}</strong> luminous hrs
            </span>
          ) : (
            <span className="text-rose-400">
              <strong>-{formatNum(consciousnessHrsShift)}</strong> heavy hrs
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

const STORAGE_KEY = 'finite_canvas_v4_ethereal_state';
const BASELINE_STORAGE_KEY = 'finite_canvas_v4_ethereal_baseline';

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

  const updatePsyche = useCallback((key: keyof SoulPostures, value: number) => {
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
      SOUL_DEFINITIONS.forEach((d) => {
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
  // RIGOROUS YEAR-BY-YEAR + SOUL POSTURE SIMULATION ENGINE
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
      innerShadowHrs: 0,
      innerGraceHrs: 0,
    };

    let shadowFractionOfWaking = 0;
    let graceFractionOfWaking = 0;
    SOUL_DEFINITIONS.forEach((def) => {
      const val = s.psyche[def.key] ?? 0;
      if (val < 0) shadowFractionOfWaking += (Math.abs(val) / 100) * 0.035;
      if (val > 0) graceFractionOfWaking += (val / 100) * 0.035;
    });

    const yearlyTimeline: Array<{
      age: number;
      phase: 'The Vocation Years' | 'The Sovereign Years' | 'The Twilight Years';
      isHealthy: boolean;
      Sleep: number;
      Routine: number;
      WorkAndCommute: number;
      Caregiving: number;
      Undertow: number;
      Brushstrokes: number;
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

      totals.innerShadowHrs += yrWakingHrs * shadowFractionOfWaking;
      totals.innerGraceHrs += yrWakingHrs * graceFractionOfWaking;

      const phase = isWorkingYear
        ? 'The Vocation Years'
        : isHealthyYear
        ? 'The Sovereign Years'
        : 'The Twilight Years';

      yearlyTimeline.push({
        age,
        phase,
        isHealthy: isHealthyYear,
        Sleep: +(yrSleep / DAYS_PER_YEAR).toFixed(2),
        Routine: +(yrRoutine / DAYS_PER_YEAR).toFixed(2),
        WorkAndCommute: +((yrWork + yrCommute) / DAYS_PER_YEAR).toFixed(2),
        Caregiving: +(yrCaregiving / DAYS_PER_YEAR).toFixed(2),
        Undertow: +((yrSick + yrScreen + yrAdmin + yrWaitAndDisaster) / DAYS_PER_YEAR).toFixed(2),
        Brushstrokes: +((yrExercise + yrGrowth + yrFun) / DAYS_PER_YEAR).toFixed(2),
        FreeTime: +(Math.max(0, yrFree) / DAYS_PER_YEAR).toFixed(2),
      });
    }

    const dailyWorkHrsOnWorkday = s.workHrsPerWeek / 5;
    const dailyCommuteOnWorkday = s.commuteHrsPerWorkday * (1 - s.remoteWorkPercent / 100);
    const dailyCaregivingNow = s.caregivingYearsRemaining > 0 ? s.caregivingHrsPerWeek / 7 : 0;
    const dailyUndertowNow =
      (s.adminHrsPerWeek + s.waitAndDisasterHrsPerWeek) / 7 + s.passiveScreenHrsPerDay;
    const dailyBrushstrokesNow = (s.exerciseHrsPerWeek + s.growthHrsPerWeek + s.funHrsPerWeek) / 7;

    const currentWorkdayUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      (s.currentAge < s.retirementAge ? dailyWorkHrsOnWorkday + dailyCommuteOnWorkday : 0) +
      dailyCaregivingNow +
      dailyUndertowNow +
      dailyBrushstrokesNow;

    const currentWeekendUsed =
      s.sleepHrsPerDay +
      s.routineHrsPerDay +
      dailyCaregivingNow +
      dailyUndertowNow +
      dailyBrushstrokesNow;

    const retirementDayUsed =
      s.sleepHrsPerDay + s.routineHrsPerDay + dailyUndertowNow + dailyBrushstrokesNow;

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
      { id: 'sleep', name: 'Nocturnal Rest & Dreaming', hours: t.sleep, color: '#3b82f6' },
      { id: 'routine', name: 'Daily Rituals & Sustenance', hours: t.routine, color: '#14b8a6' },
      { id: 'work', name: 'Vocation & Trade', hours: t.work, color: '#d97706' },
      { id: 'caregiving', name: 'Kinship & Caregiving', hours: t.caregiving, color: '#ec4899' },

      { id: 'commute', name: 'Transit & Passage', hours: t.commute, color: '#64748b' },
      { id: 'screen', name: 'Wandering Attention (Feeds)', hours: t.screen, color: '#6366f1' },
      { id: 'sick', name: 'Frailty & Convalescence', hours: t.sick, color: '#e11d48' },
      { id: 'admin', name: 'Worldly Administration', hours: t.admin, color: '#ca8a04' },
      { id: 'wait', name: 'Delays & Unforeseen Storms', hours: t.waitAndDisaster, color: '#9f1239' },

      { id: 'exercise', name: 'Physical Vitality & Movement', hours: t.exercise, color: '#10b981' },
      { id: 'growth', name: 'Study, Craft & Contemplation', hours: t.growth, color: '#059669' },
      { id: 'fun', name: 'Communion, Art & Wonder', hours: t.fun, color: '#2dd4bf' },
    ];
  }, [sim.totals]);

  const trulyFreeRemainingHours = sim.totals.free;
  const wakingHoursRemaining = Math.max(1, sim.totalRemainingHours - sim.totals.sleep);

  const foundationHours = sim.totals.sleep + sim.totals.routine + sim.totals.work + sim.totals.caregiving;
  const undertowHours =
    sim.totals.commute +
    sim.totals.screen +
    sim.totals.sick +
    sim.totals.admin +
    sim.totals.waitAndDisaster;
  const brushstrokeHours = sim.totals.exercise + sim.totals.growth + sim.totals.fun;

  const totalShadowHours = Math.round(undertowHours + sim.totals.innerShadowHrs);
  const totalLuminousHours = Math.round(
    Math.max(0, trulyFreeRemainingHours) + brushstrokeHours + sim.totals.innerGraceHrs
  );
  const dualityTotal = Math.max(1, totalShadowHours + totalLuminousHours);
  const luminousRatioPct = (totalLuminousHours / dualityTotal) * 100;

  const chartData = useMemo(() => {
    return [
      ...calculations.filter((c) => c.hours > 0),
      ...(trulyFreeRemainingHours > 0
        ? [
            {
              id: 'free',
              name: 'Unpainted Open Canvas',
              hours: trulyFreeRemainingHours,
              color: '#fde68a',
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
    <div
      className="min-h-screen bg-[#050508] text-zinc-100 relative overflow-x-hidden selection:bg-amber-200/20"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Ethereal Chiaroscuro Cathedral Lighting & Fine Architectural Lines */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #fde68a 1px, transparent 1px),
            linear-gradient(to bottom, #fde68a 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      {/* Central Zenith Pearl & Champagne Glow */}
      <div
        className="pointer-events-none fixed -top-28 left-1/2 -translate-x-1/2 w-[1100px] h-[420px] opacity-25 blur-[150px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(253, 230, 138, 0.35) 0%, rgba(45, 212, 191, 0.12) 45%, transparent 75%)',
        }}
      />
      {/* Subtle Bilateral Undertow (Left Rose) & Grace (Right Teal) Glows */}
      <div
        className="pointer-events-none fixed top-1/4 left-0 w-[550px] h-[550px] opacity-10 blur-[160px]"
        style={{ background: 'radial-gradient(circle, #e11d48 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed top-1/4 right-0 w-[550px] h-[550px] opacity-10 blur-[160px]"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-14">
        
        {/* ============================================================================
            1. TRANSCENDENTAL HEADER & 3x3 SYMMETRICAL COMMAND BAR (3 LEFT | 3 RIGHT)
           ============================================================================ */}
        <header className="space-y-8">
          {/* Top Sacred Axis */}
          <div className="flex items-center justify-center gap-5">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-amber-200/30" />
            <div className="flex items-center gap-3 px-5 py-1.5 border border-white/[0.08] bg-[#090a10]/80 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rotate-45 bg-rose-400/80" />
              <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-100/80">
                Memento Mori · A Contemplation of Mortal Time
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-emerald-300/80" />
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-amber-200/30" />
          </div>

          {/* Alluring Editorial Serif Title */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h1
              className="text-5xl sm:text-7xl md:text-8xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-amber-100/75"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <span className="italic font-light">The</span>{' '}
              <span className="font-semibold tracking-wider uppercase text-white">Finite</span>{' '}
              <span className="italic font-light text-amber-100/90">Canvas</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-zinc-400 font-light tracking-wide leading-relaxed max-w-2xl mx-auto">
              Every solar year bestows <span className="text-amber-100 font-mono font-normal">8,765.82</span> hours.
              What remains of your canvas—and whether its hours feel heavy with shadow or luminous with grace—is shaped by what claims your days and what postures your soul.
            </p>
          </div>

          {/* Symmetrical 3 vs 3 Command Bar (3 Archetypes Left | 3 Actions Right) */}
          <div className="relative bg-[#090a10]/90 border border-white/[0.08] p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center backdrop-blur-md">
            <CornerFrames color="border-amber-200/25" />

            {/* Left Triad: 3 Archetypes */}
            <div className="lg:col-span-6 grid grid-cols-3 gap-2">
              {Object.entries(ARCHETYPE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  title={preset.subtitle}
                  className={`py-2.5 px-3 border text-xs tracking-wider text-center truncate transition-all ${
                    activePreset === key
                      ? key === 'yoke'
                        ? 'bg-rose-950/50 border-rose-400/60 text-rose-100 font-medium'
                        : key === 'luminous'
                        ? 'bg-emerald-950/50 border-emerald-400/60 text-emerald-100 font-medium'
                        : 'bg-amber-950/30 border-amber-200/50 text-amber-50 font-medium'
                      : 'bg-zinc-950/70 border-white/[0.06] text-zinc-400 hover:border-white/20 hover:text-zinc-100'
                  }`}
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px' }}
                >
                  <span className="font-mono text-[10px] text-amber-200/60 mr-1.5">{preset.code}.</span>
                  <span className="italic">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Right Triad: 3 Actions */}
            <div className="lg:col-span-6 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={toggleBaseline}
                className={`py-2.5 px-2 border font-mono text-[10px] uppercase tracking-[0.18em] flex items-center justify-center gap-1.5 transition-all ${
                  baseline
                    ? 'bg-amber-950/40 border-amber-300/50 text-amber-200 font-medium'
                    : 'bg-zinc-950/70 border-white/[0.06] text-zinc-400 hover:border-white/20 hover:text-zinc-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{baseline ? 'Clear Anchor' : 'I · Hold Anchor'}</span>
              </button>

              <button
                type="button"
                onClick={copyScenarioJson}
                className="py-2.5 px-2 border font-mono text-[10px] uppercase tracking-[0.18em] bg-zinc-950/70 border-white/[0.06] text-zinc-400 hover:border-white/20 hover:text-zinc-100 flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotice ? 'Copied' : 'II · Inscribe JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset(null);
                  setState(DEFAULT_STATE);
                }}
                className="py-2.5 px-2 border font-mono text-[10px] uppercase tracking-[0.18em] bg-zinc-950/70 border-white/[0.06] text-zinc-400 hover:border-rose-400/40 hover:text-rose-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>III · Restore</span>
              </button>
            </div>
          </div>
        </header>

        {/* ============================================================================
            2. SYMMETRICAL TWIN-MONOLITH HERO (6 COLS LEFT | 6 COLS RIGHT)
            Identical 3-Part Internal Proportions Across the Central Spine
           ============================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT MONOLITH (6 COLS): I · THE MORTAL SPAN */}
          <div className="lg:col-span-6 relative bg-[#090a10]/90 border border-white/[0.08] p-6 md:p-8 flex flex-col justify-between space-y-6 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <CornerFrames color="border-amber-200/30" />
            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />

            {/* Part 1: Header + Triad of Biological Cohorts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
                <div className="flex items-baseline gap-2.5">
                  <span className="w-2 h-2 rotate-45 bg-amber-200/80" />
                  <h2
                    className="text-xl italic font-medium tracking-wide text-zinc-100"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    I · The Mortal Span &amp; Horizon
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('useActuarialLifespan', !state.useActuarialLifespan)}
                  className="text-[10px] font-mono uppercase tracking-[0.18em] px-2.5 py-1 border border-white/[0.08] bg-zinc-950 text-amber-100/80 hover:border-amber-200/40"
                >
                  {state.useActuarialLifespan ? 'Actuarial Table' : 'Custom Horizon'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['female', 'average', 'male'] as BiologicalSex[]).map((sexOpt, idx) => (
                  <button
                    key={sexOpt}
                    type="button"
                    onClick={() => {
                      updateField('useActuarialLifespan', true);
                      updateField('sex', sexOpt);
                    }}
                    className={`py-2 px-3 border text-center font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                      state.useActuarialLifespan && state.sex === sexOpt
                        ? 'bg-amber-100/10 border-amber-200/40 text-amber-50 font-medium'
                        : 'bg-zinc-950/60 border-white/[0.06] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    0{idx + 1} · {sexOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Part 2: Triad of Horizon Dials (3 Equal Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dial 1: Current Age */}
              <div className="bg-zinc-950/90 border border-white/[0.07] p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">I · Age Now</span>
                  <span className="text-xl font-semibold font-mono text-white">{state.currentAge}y</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={Math.max(16, sim.lifespan - 1)}
                  value={state.currentAge}
                  onChange={(e) => updateField('currentAge', parseInt(e.target.value, 10))}
                  className="angular-slider w-full"
                  style={{ color: '#fde68a' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>Spent</span>
                  <span className="text-zinc-300">{sim.livedPercentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Dial 2: Career Release Age */}
              <div className="bg-zinc-950/90 border border-white/[0.07] p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">II · Release</span>
                  <span className="text-xl font-semibold font-mono text-amber-300">
                    {state.retirementAge <= state.currentAge ? 'Now' : `${state.retirementAge}y`}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.min(state.currentAge, 40)}
                  max={Math.min(90, sim.lifespan)}
                  value={state.retirementAge}
                  onChange={(e) => updateField('retirementAge', parseInt(e.target.value, 10))}
                  className="angular-slider w-full"
                  style={{ color: '#f59e0b' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>Vocation Left</span>
                  <span className="text-amber-200/90">
                    {Math.max(0, Math.min(sim.lifespan, state.retirementAge) - state.currentAge)}y
                  </span>
                </div>
              </div>

              {/* Dial 3: Expected Horizon */}
              <div className="bg-zinc-950/90 border border-white/[0.07] p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">III · Horizon</span>
                  <span className="text-xl font-semibold font-mono text-emerald-300">{sim.lifespan}y</span>
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
                  style={{ color: '#34d399' }}
                />
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>Net Shift</span>
                  <span className={sim.actuarial.totalLongevityDelta >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                    {sim.actuarial.totalLongevityDelta >= 0
                      ? `+${sim.actuarial.totalLongevityDelta}y`
                      : `${sim.actuarial.totalLongevityDelta}y`}
                  </span>
                </div>
              </div>
            </div>

            {/* Part 3: 3-Segment Horizon Bar & 3-Column Legend */}
            <div className="space-y-3 pt-2 border-t border-white/[0.07]">
              <div className="w-full bg-zinc-950 h-3.5 flex overflow-hidden border border-white/[0.08] p-0.5 gap-0.5">
                <div
                  className="bg-zinc-600/80 h-full transition-all duration-500"
                  style={{ width: `${sim.livedPercentage}%` }}
                />
                <div
                  className="bg-gradient-to-r from-amber-200/80 to-emerald-400/80 h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, ((sim.actuarial.healthspanAge - state.currentAge) / sim.lifespan) * 100)}%`,
                  }}
                />
                <div
                  className="bg-rose-900/80 h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, ((sim.lifespan - sim.actuarial.healthspanAge) / sim.lifespan) * 100)}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2 h-2 rotate-45 bg-zinc-500 inline-block" />
                  <span>I · Past ({state.currentAge}y)</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-100">
                  <span className="w-2 h-2 rotate-45 bg-emerald-300 inline-block" />
                  <span>II · Vital ({Math.max(0, sim.actuarial.healthspanAge - state.currentAge)}y)</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-rose-300/90">
                  <span className="w-2 h-2 rotate-45 bg-rose-800 inline-block" />
                  <span>III · Twilight ({sim.actuarial.morbidityYears}y)</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MONOLITH (6 COLS): II · THE LUMINOUS & HEAVY LEDGER */}
          <div className="lg:col-span-6 relative bg-[#090a10]/90 border border-white/[0.08] p-6 md:p-8 flex flex-col justify-between space-y-6 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <CornerFrames color={luminousRatioPct >= 50 ? 'border-emerald-300/35' : 'border-rose-400/35'} />
            <div
              className="absolute top-0 left-12 right-12 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, #e11d48 0%, #fde68a 50%, #34d399 100%)',
              }}
            />

            {/* Part 1: Header + Triad of Soul Tunings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`w-2 h-2 rotate-45 ${
                      luminousRatioPct >= 50 ? 'bg-emerald-300' : 'bg-rose-500'
                    }`}
                  />
                  <h2
                    className="text-xl italic font-medium tracking-wide text-zinc-100"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    II · The Quality of Remaining Hours
                  </h2>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.18em] px-2.5 py-1 border ${
                    luminousRatioPct >= 60
                      ? 'bg-emerald-950/40 border-emerald-400/30 text-emerald-200'
                      : luminousRatioPct <= 40
                      ? 'bg-rose-950/40 border-rose-400/30 text-rose-200'
                      : 'bg-zinc-950 border-white/[0.08] text-amber-100/80'
                  }`}
                >
                  {luminousRatioPct.toFixed(0)}% Luminous
                </span>
              </div>

              {/* Triad of Quick Soul Postures */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAllPsyche(-75)}
                  className="py-2 px-3 border border-rose-500/25 bg-rose-950/20 hover:bg-rose-950/40 text-rose-200 text-center font-mono text-[10px] uppercase tracking-[0.18em] transition-all"
                >
                  I · Heavy Spirit
                </button>
                <button
                  type="button"
                  onClick={() => setAllPsyche(0)}
                  className="py-2 px-3 border border-white/[0.07] bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 hover:text-white text-center font-mono text-[10px] uppercase tracking-[0.18em] transition-all"
                >
                  II · Stillpoint
                </button>
                <button
                  type="button"
                  onClick={() => setAllPsyche(80)}
                  className="py-2 px-3 border border-emerald-400/25 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-200 text-center font-mono text-[10px] uppercase tracking-[0.18em] transition-all"
                >
                  III · Radiant Spirit
                </button>
              </div>
            </div>

            {/* Part 2: Triad of Monumental Readout Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Box 1: Heavy / Shadow Hours */}
              <div className="bg-rose-950/15 border border-rose-500/25 p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-rose-300/90">
                  <span>I · Shadow</span>
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-xl font-semibold font-mono text-rose-200 tracking-tight">
                  {formatNum(totalShadowHours)} <span className="text-xs font-normal text-rose-400/80">hrs</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>Undertow &amp; Grief</span>
                  <span className="text-rose-300">{(totalShadowHours / HOURS_PER_YEAR).toFixed(1)}y</span>
                </div>
              </div>

              {/* Box 2: Unpainted Open Canvas */}
              <div className="bg-zinc-950/90 border border-amber-200/25 p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-amber-100/90">
                  <span>II · Open Canvas</span>
                  <Hourglass className="w-3.5 h-3.5 text-amber-200" />
                </div>
                <div className="text-xl font-semibold font-mono text-white tracking-tight">
                  {formatNum(trulyFreeRemainingHours)} <span className="text-xs font-normal text-zinc-500">hrs</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>Unclaimed</span>
                  <span className={trulyFreeRemainingHours >= 0 ? 'text-amber-100' : 'text-rose-400'}>
                    {(trulyFreeRemainingHours / HOURS_PER_YEAR).toFixed(1)}y
                  </span>
                </div>
              </div>

              {/* Box 3: Luminous / Grace Hours */}
              <div className="bg-emerald-950/15 border border-emerald-400/25 p-4 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-emerald-300/90">
                  <span>III · Grace</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div className="text-xl font-semibold font-mono text-emerald-200 tracking-tight">
                  {formatNum(totalLuminousHours)} <span className="text-xs font-normal text-emerald-500/80">hrs</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>Craft &amp; Peace</span>
                  <span className="text-emerald-300">{(totalLuminousHours / HOURS_PER_YEAR).toFixed(1)}y</span>
                </div>
              </div>
            </div>

            {/* Part 3: Shadow vs. Grace Balance Bar & 3-Column Legend */}
            <div className="space-y-3 pt-2 border-t border-white/[0.07]">
              <div className="w-full bg-zinc-950 h-3.5 flex overflow-hidden border border-white/[0.08] p-0.5 gap-0.5">
                <div
                  className="bg-gradient-to-r from-rose-950 via-rose-700 to-rose-500 h-full transition-all duration-500"
                  style={{ width: `${100 - luminousRatioPct}%` }}
                />
                <div
                  className="bg-gradient-to-r from-amber-200/80 via-emerald-400 to-teal-300 h-full transition-all duration-500"
                  style={{ width: `${luminousRatioPct}%` }}
                />
              </div>

              <div className="grid grid-cols-3 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-rose-300/90">
                  <span className="w-2 h-2 rotate-45 bg-rose-500 inline-block" />
                  <span>I · Shadow ({(100 - luminousRatioPct).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-zinc-300">
                  <span>
                    II · Soul Span:{' '}
                    <strong className={sim.actuarial.psycheYearsDelta >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                      {sim.actuarial.psycheYearsDelta >= 0
                        ? `+${sim.actuarial.psycheYearsDelta}y`
                        : `${sim.actuarial.psycheYearsDelta}y`}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-emerald-300">
                  <span className="w-2 h-2 rotate-45 bg-emerald-300 inline-block" />
                  <span>III · Grace ({luminousRatioPct.toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================
            3. SYMMETRICAL 6-PILLAR TELEMETRY RIBBON (GROUP OF 6)
           ============================================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              code: 'I · Memory',
              val: `${formatNum(sim.hoursLived)}h`,
              sub: `${state.currentAge} Years Behind You`,
              border: 'border-white/[0.07]',
              text: 'text-zinc-200',
            },
            {
              code: 'II · Waking Breath',
              val: `${formatNum(wakingHoursRemaining)}h`,
              sub: `${(wakingHoursRemaining / HOURS_PER_YEAR).toFixed(1)} Waking Years Left`,
              border: 'border-blue-400/20',
              text: 'text-blue-200',
            },
            {
              code: 'III · Golden Window',
              val: `${Math.max(0, sim.actuarial.healthspanAge - Math.max(state.currentAge, state.retirementAge))} yrs`,
              sub: `Age ${Math.max(state.currentAge, state.retirementAge)} → ${sim.actuarial.healthspanAge} Unbound`,
              border: 'border-amber-200/25',
              text: 'text-amber-100',
            },
            {
              code: 'IV · Worldly Undertow',
              val: `${(undertowHours / HOURS_PER_YEAR).toFixed(1)} yrs`,
              sub: `${formatNum(undertowHours)}h External Drain`,
              border: 'border-rose-500/20',
              text: 'text-rose-300',
            },
            {
              code: 'V · Inner Weight',
              val: `${(sim.totals.innerShadowHrs / HOURS_PER_YEAR).toFixed(1)} yrs`,
              sub: `${formatNum(sim.totals.innerShadowHrs)}h Heavy Spirit`,
              border: 'border-rose-400/25',
              text: 'text-rose-200',
            },
            {
              code: 'VI · Inner Radiance',
              val: `${(sim.totals.innerGraceHrs / HOURS_PER_YEAR).toFixed(1)} yrs`,
              sub: `${formatNum(sim.totals.innerGraceHrs)}h Quiet Grace`,
              border: 'border-emerald-400/25',
              text: 'text-emerald-200',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-[#090a10]/85 border ${item.border} p-4 flex flex-col justify-between backdrop-blur-md`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <span>{item.code}</span>
                <span className="w-1 h-1 rotate-45 bg-amber-200/40" />
              </div>
              <div
                className={`text-2xl font-medium my-1.5 ${item.text}`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {item.val}
              </div>
              <div className="text-[10px] font-light tracking-wide text-zinc-400 truncate">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Anchor Delta Banner (When Pinned) */}
        {baselineSim && (
          <div className="grid grid-cols-3 gap-4 bg-amber-950/20 border border-amber-200/30 p-4 font-mono text-xs text-center backdrop-blur-md">
            <div>
              <span className="text-zinc-400 mr-2">I · Horizon Shift:</span>
              <strong className={lifespanDeltaYrs && lifespanDeltaYrs >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                {lifespanDeltaYrs && lifespanDeltaYrs >= 0 ? `+${lifespanDeltaYrs} yrs` : `${lifespanDeltaYrs} yrs`}
              </strong>
            </div>
            <div>
              <span className="text-zinc-400 mr-2">II · Open Canvas Shift:</span>
              <strong className={freeDeltaHrs && freeDeltaHrs >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                {freeDeltaHrs && freeDeltaHrs >= 0 ? `+${formatNum(freeDeltaHrs)} hrs` : `${formatNum(freeDeltaHrs || 0)} hrs`}
              </strong>
            </div>
            <div>
              <span className="text-zinc-400 mr-2">III · Soul Resonance:</span>
              <strong className="text-amber-200">{sim.actuarial.meanPsycheIndex}</strong>
            </div>
          </div>
        )}

        {/* ============================================================================
            4. SYMMETRICAL OBSERVATORY (STRICT TRIAD OF 3 TABS)
           ============================================================================ */}
        <div className="relative bg-[#090a10]/90 border border-white/[0.08] p-6 md:p-8 space-y-8 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <CornerFrames color="border-amber-200/25" />

          {/* Triad of 3 Equal-Width Observatory Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-white/[0.07] pb-6">
            {[
              { id: 'ledger', code: 'I', label: 'The Proportion of Days', icon: PieChartIcon },
              { id: 'trajectory', code: 'II', label: 'The Arc of Ages & Daily Rhythm', icon: Layers },
              { id: 'matrix', code: 'III', label: 'The Tapestry of Years', icon: Grid },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3.5 px-4 border flex items-center justify-center gap-3 transition-all ${
                    isActive
                      ? 'bg-amber-50/10 border-amber-200/50 text-white shadow-[0_0_30px_rgba(253,230,138,0.1)]'
                      : 'bg-zinc-950/60 border-white/[0.06] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-200/80" />
                  <span
                    className="text-lg italic tracking-wide"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    <span className="font-mono text-xs not-italic text-amber-200/70 mr-2">{tab.code}.</span>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TAB I: THE PROPORTION OF DAYS (6 COLS LEFT | 6 COLS RIGHT) */}
          {activeTab === 'ledger' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between bg-zinc-950/60 border border-white/[0.06] p-6">
                <div className="h-[300px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={88}
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
                          `${formatNum(value)} hrs (${(value / HOURS_PER_YEAR).toFixed(1)} yrs)`,
                          'Portion',
                        ]}
                        contentStyle={{
                          backgroundColor: '#07080d',
                          borderColor: 'rgba(253,230,138,0.25)',
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
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Remaining</span>
                    <span
                      className="text-5xl italic font-normal text-white my-0.5"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {sim.yearsRemaining} yrs
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/80">
                      {formatNum(sim.totalRemainingHours)} hrs
                    </span>
                  </div>
                </div>

                {/* Triad of Movement Totals */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06] text-center">
                  <div className="bg-zinc-900/40 border border-white/[0.05] p-3">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">I · Foundation</div>
                    <div
                      className="text-xl italic text-white mt-0.5"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {(foundationHours / HOURS_PER_YEAR).toFixed(1)} yrs
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {((foundationHours / sim.totalRemainingHours) * 100).toFixed(0)}% of span
                    </div>
                  </div>
                  <div className="bg-zinc-900/40 border border-white/[0.05] p-3">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">II · Undertow</div>
                    <div
                      className="text-xl italic text-rose-300 mt-0.5"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {(undertowHours / HOURS_PER_YEAR).toFixed(1)} yrs
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {((undertowHours / sim.totalRemainingHours) * 100).toFixed(0)}% of span
                    </div>
                  </div>
                  <div className="bg-zinc-900/40 border border-white/[0.05] p-3">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">III · Sovereign</div>
                    <div
                      className="text-xl italic text-emerald-300 mt-0.5"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {((brushstrokeHours + Math.max(0, trulyFreeRemainingHours)) / HOURS_PER_YEAR).toFixed(1)} yrs
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {(
                        ((brushstrokeHours + Math.max(0, trulyFreeRemainingHours)) / sim.totalRemainingHours) *
                        100
                      ).toFixed(0)}
                      % of span
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-zinc-950/60 border border-white/[0.06] p-6 flex flex-col justify-between">
                <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase tracking-widest pb-3 border-b border-white/[0.07]">
                  <div className="col-span-5">Portion of Life</div>
                  <div className="col-span-2 text-right">Span</div>
                  <div className="col-span-2 text-right">Waking</div>
                  <div className="col-span-3 text-right">Measure</div>
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
                        <div key={item.id} className="space-y-1.5 py-1.5 border-b border-white/[0.04]">
                          <div className="grid grid-cols-12 items-center gap-2 text-xs font-mono">
                            <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-2 h-2 rotate-45 flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-sans font-normal text-zinc-200 truncate">{item.name}</span>
                            </div>
                            <div className="col-span-2 text-right text-zinc-400">{totalPct.toFixed(1)}%</div>
                            <div className="col-span-2 text-right text-amber-200/80">{wakingPct}</div>
                            <div className="col-span-3 text-right text-zinc-100">
                              {formatNum(item.hours)}{' '}
                              <span className="text-zinc-500">
                                ({(item.hours / HOURS_PER_YEAR).toFixed(1)}y)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-zinc-900/80 h-1 overflow-hidden">
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

          {/* TAB II: THE ARC OF AGES & DAILY RHYTHM */}
          {activeTab === 'trajectory' && (
            <div className="space-y-6">
              <div className="h-[300px] w-full bg-zinc-950/60 border border-white/[0.06] p-4">
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
                        backgroundColor: '#07080d',
                        borderColor: 'rgba(253,230,138,0.25)',
                        borderRadius: '0px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                      }}
                      formatter={(val: number, name: string) => [`${val} hrs/day`, name]}
                      labelFormatter={(age) => {
                        const row = sim.yearlyTimeline.find((r) => r.age === age);
                        return `Age ${age} · ${row?.phase || ''}`;
                      }}
                    />
                    <Area type="monotone" dataKey="Sleep" stackId="1" stroke="#3b82f6" fill="#1d4ed8" />
                    <Area type="monotone" dataKey="Routine" stackId="1" stroke="#14b8a6" fill="#0f766e" />
                    <Area type="monotone" dataKey="WorkAndCommute" stackId="1" stroke="#f59e0b" fill="#b45309" />
                    <Area type="monotone" dataKey="Caregiving" stackId="1" stroke="#ec4899" fill="#be185d" />
                    <Area type="monotone" dataKey="Undertow" stackId="1" stroke="#e11d48" fill="#881337" />
                    <Area type="monotone" dataKey="Brushstrokes" stackId="1" stroke="#2dd4bf" fill="#0d9488" />
                    <Area type="monotone" dataKey="FreeTime" stackId="1" stroke="#fde68a" fill="#d97706" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Symmetrical Triad of 24-Hour Daily Rhythms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    code: 'I · Working Day',
                    title: 'Current Vocation Day (24h)',
                    used: sim.dailyAudit.workdayUsed,
                    free: sim.dailyAudit.workdayFree,
                  },
                  {
                    code: 'II · Unbound Day',
                    title: 'Current Day of Rest (24h)',
                    used: sim.dailyAudit.weekendUsed,
                    free: sim.dailyAudit.weekendFree,
                  },
                  {
                    code: `III · Sovereign Day (Age ${state.retirementAge}+)`,
                    title: 'Post-Vocation Day (24h)',
                    used: sim.dailyAudit.retirementUsed,
                    free: sim.dailyAudit.retirementFree,
                  },
                ].map((card, idx) => (
                  <div key={idx} className="bg-zinc-950/80 border border-white/[0.07] p-5 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                      <span>{card.code}</span>
                      <span>{card.free >= 0 ? 'Breathing Room' : 'Overdrawn'}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span
                        className="text-lg italic text-zinc-100"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {card.title}
                      </span>
                      <span className={`text-lg font-mono font-semibold ${card.free >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                        {card.free >= 0 ? `+${card.free.toFixed(1)}h open` : `${card.free.toFixed(1)}h`}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${card.free >= 0 ? 'bg-emerald-400/80' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, (card.used / 24) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB III: THE TAPESTRY OF YEARS (MEMENTO MORI MATRIX) */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5">
                {Array.from({ length: sim.lifespan }, (_, age) => {
                  const isPast = age < state.currentAge;
                  const isCurrent = age === state.currentAge;
                  const futureRow = sim.yearlyTimeline.find((r) => r.age === age);

                  let cellStyle = 'bg-zinc-950/60 border-white/[0.05] text-zinc-600';
                  if (isCurrent) {
                    cellStyle = 'bg-amber-100 text-black border-amber-200 font-bold shadow-[0_0_20px_rgba(253,230,138,0.6)]';
                  } else if (!isPast && futureRow) {
                    if (!futureRow.isHealthy) {
                      cellStyle = 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/60';
                    } else if (age < state.retirementAge) {
                      cellStyle = 'bg-amber-950/35 border-amber-400/40 text-amber-100 hover:bg-amber-900/50';
                    } else {
                      cellStyle = 'bg-emerald-950/40 border-emerald-400/45 text-emerald-100 hover:bg-emerald-900/60';
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/90 border border-white/[0.07] p-4 text-center">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-widest">I · Year of Life</span>
                  <strong
                    className="text-amber-50 text-lg italic font-normal"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Age {inspectedAge} · Weeks {inspectedAge * 52}–{(inspectedAge + 1) * 52}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-widest">II · Season</span>
                  <strong
                    className="text-zinc-200 text-lg italic font-normal"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {inspectedAge < state.currentAge ? 'Already Lived' : inspectedRow?.phase || 'Present'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-widest">III · Daily Openness</span>
                  <strong
                    className="text-emerald-300 text-lg italic font-normal"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {inspectedAge < state.currentAge
                      ? 'In Memory'
                      : `${((inspectedRow?.Brushstrokes || 0) + (inspectedRow?.FreeTime || 0)).toFixed(1)} Sovereign Hrs / Day`}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================================
            5. THE 3-6-9 SACRED CONTROL MOVEMENTS (6, 6, 3, 9)
           ============================================================================ */}
        <div className="space-y-20 pt-4">
          
          {/* MOVEMENT I: THE FOUNDATION (6 CARDS — 2x3) */}
          <section>
            <AxialSectionHeader
              roman="I"
              cadenceLabel="Six Pillars · 2×3"
              title="The Foundation of Days"
              subtitle="Rest, daily sustenance, vocation, and the seasons devoted to caring for those entrusted to you."
              accentColor="#60a5fa"
              statLabel="Committed"
              statValue={`${(foundationHours / HOURS_PER_YEAR).toFixed(1)} yrs`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <UniformSliderCard
                indexCode="I · 01"
                label="Nocturnal Rest"
                subtitle="Sleep & biological restoration (7–8.5h ideal)"
                icon={Moon}
                colorClass="text-blue-300"
                accentHex="#60a5fa"
                value={state.sleepHrsPerDay}
                onChange={(v) => updateField('sleepHrsPerDay', v)}
                min={4}
                max={11}
                step={0.25}
                unit="hrs/d"
                hours={sim.totals.sleep}
                benchmarkLabel="Mean · 8.5h"
                benchmarkValue={8.5}
              />

              <UniformSliderCard
                indexCode="I · 02"
                label="Daily Rituals"
                subtitle="Preparing meals, dining, bathing & order"
                icon={Coffee}
                colorClass="text-teal-300"
                accentHex="#2dd4bf"
                value={state.routineHrsPerDay}
                onChange={(v) => updateField('routineHrsPerDay', v)}
                min={0.5}
                max={6}
                step={0.25}
                unit="hrs/d"
                hours={sim.totals.routine}
                benchmarkLabel="Mean · 2.3h"
                benchmarkValue={2.3}
              />

              <UniformSliderCard
                indexCode="I · 03"
                label="Weekly Vocation"
                subtitle={`Hours of trade until age ${state.retirementAge}`}
                icon={Briefcase}
                colorClass="text-amber-300"
                accentHex="#f59e0b"
                value={state.workHrsPerWeek}
                onChange={(v) => updateField('workHrsPerWeek', v)}
                min={0}
                max={80}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.work}
                benchmarkLabel="Mean · 38.5h"
                benchmarkValue={38.5}
              />

              <UniformSliderCard
                indexCode="I · 04"
                label="Working Weeks"
                subtitle="Annual weeks of labor excluding sabbaticals"
                icon={Calendar}
                colorClass="text-amber-200"
                accentHex="#fbbf24"
                value={state.workWeeksPerYear}
                onChange={(v) => updateField('workWeeksPerYear', v)}
                min={36}
                max={52}
                step={1}
                unit="wks/yr"
                hours={sim.totals.work}
                benchmarkLabel="Standard · 49w"
                benchmarkValue={49}
              />

              <UniformSliderCard
                indexCode="I · 05"
                label="Kinship & Care"
                subtitle="Hours devoted to raising children or elders"
                icon={Users}
                colorClass="text-pink-300"
                accentHex="#f472b6"
                value={state.caregivingHrsPerWeek}
                onChange={(v) => updateField('caregivingHrsPerWeek', v)}
                min={0}
                max={50}
                step={1}
                unit="hrs/wk"
                hours={sim.totals.caregiving}
                benchmarkLabel="Active · 12h"
                benchmarkValue={12}
              />

              <UniformSliderCard
                indexCode="I · 06"
                label="Years of Caregiving"
                subtitle="Remaining years of active family stewardship"
                icon={Hourglass}
                colorClass="text-pink-200"
                accentHex="#ec4899"
                value={state.caregivingYearsRemaining}
                onChange={(v) => updateField('caregivingYearsRemaining', v)}
                min={0}
                max={30}
                step={1}
                unit="years"
                hours={sim.totals.caregiving}
                benchmarkLabel="Season · 18y"
                benchmarkValue={18}
              />
            </div>
          </section>

          {/* MOVEMENT II: THE UNDERTOW (6 CARDS — 2x3) */}
          <section>
            <AxialSectionHeader
              roman="II"
              cadenceLabel="Six Undertows · 2×3"
              title="The Undertow"
              subtitle="The quiet erosion of waking hours—transit, wandering attention, bodily frailty, and worldly errands."
              accentColor="#e11d48"
              statLabel="Eroded"
              statValue={`${(undertowHours / HOURS_PER_YEAR).toFixed(1)} yrs`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <UniformSliderCard
                indexCode="II · 01"
                label="Daily Passage"
                subtitle="Round-trip transit on days of onsite work"
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
                benchmarkLabel="Mean · 0.9h"
                benchmarkValue={0.9}
              />

              <UniformSliderCard
                indexCode="II · 02"
                label="Sanctuary Work"
                subtitle="Share of working days spent at home"
                icon={Compass}
                colorClass="text-slate-300"
                accentHex="#64748b"
                value={state.remoteWorkPercent}
                onChange={(v) => updateField('remoteWorkPercent', v)}
                min={0}
                max={100}
                step={10}
                unit="% home"
                hours={sim.totals.commute}
                benchmarkLabel="Hybrid · 40%"
                benchmarkValue={40}
              />

              <UniformSliderCard
                indexCode="II · 03"
                label="Wandering Attention"
                subtitle="Unintentional drift into feeds & screens"
                icon={Smartphone}
                colorClass="text-indigo-300"
                accentHex="#818cf8"
                value={state.passiveScreenHrsPerDay}
                onChange={(v) => updateField('passiveScreenHrsPerDay', v)}
                min={0}
                max={8}
                step={0.25}
                unit="hrs/d"
                hours={sim.totals.screen}
                benchmarkLabel="Mean · 2.8h"
                benchmarkValue={2.8}
              />

              <UniformSliderCard
                indexCode="II · 04"
                label="Bodily Frailty"
                subtitle="Waking days lost to illness & exhaustion"
                icon={Thermometer}
                colorClass="text-rose-400"
                accentHex="#e11d48"
                value={state.sickDaysPerYear}
                onChange={(v) => updateField('sickDaysPerYear', v)}
                min={0}
                max={60}
                step={1}
                unit="days/yr"
                hours={sim.totals.sick}
                benchmarkLabel="Mean · 5.0d"
                benchmarkValue={5}
              />

              <UniformSliderCard
                indexCode="II · 05"
                label="Worldly Ledger"
                subtitle="Accounts, errands, maintenance & forms"
                icon={PhoneCall}
                colorClass="text-amber-400"
                accentHex="#eab308"
                value={state.adminHrsPerWeek}
                onChange={(v) => updateField('adminHrsPerWeek', v)}
                min={0}
                max={15}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.admin}
                benchmarkLabel="Mean · 3.5h"
                benchmarkValue={3.5}
              />

              <UniformSliderCard
                indexCode="II · 06"
                label="Delays & Storms"
                subtitle="Waiting lines, traffic & unforeseen repairs"
                icon={Hourglass}
                colorClass="text-rose-300"
                accentHex="#f43f5e"
                value={state.waitAndDisasterHrsPerWeek}
                onChange={(v) => updateField('waitAndDisasterHrsPerWeek', v)}
                min={0}
                max={12}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.waitAndDisaster}
                benchmarkLabel="Mean · 2.0h"
                benchmarkValue={2.0}
              />
            </div>
          </section>

          {/* MOVEMENT III: THE BRUSHSTROKES (3 CARDS — 1x3) */}
          <section>
            <AxialSectionHeader
              roman="III"
              cadenceLabel="Three Brushstrokes · 1×3"
              title="The Deliberate Brushstrokes"
              subtitle="The hours you claim by choice to cultivate strength, wisdom, and shared joy."
              accentColor="#34d399"
              statLabel="Devoted"
              statValue={`${(brushstrokeHours / HOURS_PER_YEAR).toFixed(1)} yrs`}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <UniformSliderCard
                indexCode="III · 01"
                label="Vitality & Movement"
                subtitle="Training the body to lengthen healthy years"
                icon={Activity}
                colorClass="text-emerald-300"
                accentHex="#34d399"
                value={state.exerciseHrsPerWeek}
                onChange={(v) => updateField('exerciseHrsPerWeek', v)}
                min={0}
                max={20}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.exercise}
                benchmarkLabel="Ideal · 3.5h"
                benchmarkValue={3.5}
              />

              <UniformSliderCard
                indexCode="III · 02"
                label="Craft & Contemplation"
                subtitle="Reading, creation, study & quiet mastery"
                icon={BookOpen}
                colorClass="text-teal-300"
                accentHex="#14b8a6"
                value={state.growthHrsPerWeek}
                onChange={(v) => updateField('growthHrsPerWeek', v)}
                min={0}
                max={40}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.growth}
                benchmarkLabel="Mean · 2.0h"
                benchmarkValue={2.0}
              />

              <UniformSliderCard
                indexCode="III · 03"
                label="Communion & Wonder"
                subtitle="Presence with loved ones, beauty & play"
                icon={Smile}
                colorClass="text-amber-200"
                accentHex="#fde68a"
                value={state.funHrsPerWeek}
                onChange={(v) => updateField('funHrsPerWeek', v)}
                min={0}
                max={50}
                step={0.5}
                unit="hrs/wk"
                hours={sim.totals.fun}
                benchmarkLabel="Mean · 14.0h"
                benchmarkValue={14.0}
              />
            </div>
          </section>

          {/* MOVEMENT IV: THE POSTURE OF THE SOUL (9 CARDS — 3x3) */}
          <section>
            <AxialSectionHeader
              roman="IV"
              cadenceLabel="Nine Postures · 3×3"
              title="The Posture of the Soul"
              subtitle="Nine inward orientations of the heart. Resentment, dread, and pride age the body and darken waking hours; understanding, acceptance, and reverence lengthen life and fill the canvas with light."
              accentColor="#fde68a"
              statLabel="Horizon Shift"
              statValue={
                sim.actuarial.psycheYearsDelta >= 0
                  ? `+${sim.actuarial.psycheYearsDelta} yrs`
                  : `${sim.actuarial.psycheYearsDelta} yrs`
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {SOUL_DEFINITIONS.map((def) => (
                <SoulPostureCard
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
        <footer className="pt-10 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] font-mono text-zinc-500 uppercase tracking-[0.22em]">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <span className="w-1.5 h-1.5 rotate-45 bg-rose-400/70" />
            <span>I · The Finite Canvas</span>
          </div>
          <div
            className="text-center text-sm italic normal-case tracking-wider text-amber-100/70"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            “Teach us to number our days, that we may gain a heart of wisdom.”
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2.5">
            <span>III · Memento Mori</span>
            <span className="w-1.5 h-1.5 rotate-45 bg-emerald-300/70" />
          </div>
        </footer>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #07080d; }
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
          height: 11px;
          width: 11px;
          background: #07080d;
          border: 1.5px solid currentColor;
          transform: rotate(45deg);
          cursor: pointer;
          margin-top: -3.5px;
          box-shadow: 0 0 12px currentColor;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        input.angular-slider::-webkit-slider-thumb:hover {
          background: currentColor;
          transform: rotate(45deg) scale(1.25);
        }
        input.angular-slider::-moz-range-thumb {
          height: 11px;
          width: 11px;
          background: #07080d;
          border: 1.5px solid currentColor;
          border-radius: 0;
          transform: rotate(45deg);
          cursor: pointer;
          box-shadow: 0 0 12px currentColor;
        }
      `,
        }}
      />
    </div>
  );
}
