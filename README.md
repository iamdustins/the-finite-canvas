# The Finite Canvas

An actuarial and phase-aware lifespan and discretionary time accounting application built with **React**, **TypeScript**, **Recharts**, and **Tailwind CSS**.

Every year contains **8,765.82 hours** (`365.2425 × 24`). Rather than relying on flat lifetime averages or double-counting sleep during sick days and commutes on non-workdays, **The Finite Canvas** simulates your remaining life year-by-year across distinct life stages:

1. **Actuarial & Lifestyle Longevity Engine** — Conditional survival expectancy modeled after US SSA Period Life Tables (by biological cohort) plus empirical longevity modifiers for sleep adequacy, physical activity, and chronic overwork, alongside a **Healthy Life Expectancy (WHO HALE / Healthspan)** curve.
2. **Zero Double-Counting Time Ledger** — Commutes scale strictly to onsite workdays (`workDaysPerWeek × workWeeksPerYear × (1 - remoteWorkPercent)`), and sick days / life detours only consume waking non-routine hours.
3. **Empirical ATUS Benchmarks** — Built-in baselines from the US Bureau of Labor Statistics *American Time Use Survey* (ATUS), CDC, and US Census with one-click benchmark application.
4. **Four Interactive Views**:
   - **Lifetime Ledger**: Donut chart + ranked table showing total %, waking %, hours, and equivalent years.
   - **Age-by-Age Phase Curve**: Stacked 24-hour `AreaChart` across career, caregiving, golden retirement, and late-life fragility phases.
   - **Memento Mori Grid**: Year-by-year (`52 weeks/block`) interactive life grid with per-age hover inspection.
   - **24-Hour Daily Audit**: Compares your current onsite workday, weekend/off-day, and post-retirement day to catch daily schedule deficits.
5. **Scenario Comparison & Persistence** — Includes preset profiles (*US Statistical Average*, *High-Burn Corporate*, *Remote + Early Retirement*, *Active Family & Career*), a pinned baseline comparator (`+/- hours` and `+/- lifespan`), `localStorage` persistence, and JSON export.

## Getting Started

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
