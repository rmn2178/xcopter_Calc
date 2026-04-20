# xcopterCalc

Open multicopter powertrain calculator with a production-hardened React UI and a deterministic TypeScript engine.

This README is a full technical specification of the app: feature coverage, architecture, complete calculation pipeline, equations, warning logic, data trust policy, and operational workflows.

## 1. Product Scope

xcopterCalc estimates multicopter drive-system behavior from motor, ESC, battery, propeller, geometry, and atmosphere inputs.

It is designed for:
- rapid pre-build comparison of component combinations
- hover/maximum operating point estimation
- speed/range trend exploration
- safety envelope checks (current, voltage, overspin, lift-off feasibility)

It is not a flight controller or a hardware certification tool.

## 2. Feature Inventory (Complete)

### 2.1 Input System

- General inputs
  - model weight and weight mode
  - number of rotors and rotor layout (flat/coaxial)
  - frame size and FCU tilt limit
  - elevation, ambient temperature, pressure

- Battery inputs
  - chemistry and charge state (full/normal/low)
  - S/P configuration
  - cell capacity, C rating, internal resistance
  - nominal/full voltages and cell weight

- ESC inputs
  - continuous/burst current
  - internal resistance
  - max voltage
  - protocol and weight

- Motor inputs
  - Kv, no-load current, no-load reference voltage
  - current and power limits
  - winding resistance
  - cooling mode
  - case/stator dimensions, poles, weight

- Propeller inputs
  - diameter, pitch, blade count, yoke twist
  - thrust/power constants (manual or derived)
  - gear ratio and prop weight

- Accessories
  - external current drain and weight

### 2.2 Presets and Data UX

- search + select workflows for battery, ESC, motor, propeller presets
- custom override mode from any preset
- grouped and sorted display names

### 2.3 Core Outputs

- Battery card
  - load C
  - voltage under load
  - rated voltage
  - energy
  - capacity totals/usage
  - hover/min/mixed endurance

- Motor cards
  - optimum efficiency point
  - maximum point
  - hover point

- Total drive card
  - combined hover/max electrical and mechanical power
  - system efficiencies
  - thrust-to-weight ratio

- Multicopter card
  - all-up weight and payload margin
  - max tilt, speed, climb
  - estimated range
  - disc area and engine-failure note

- Wattmeter card
  - current, voltage, power at hover load

- Warning card
  - cannot lift off
  - overspin risk
  - battery overloaded
  - hover over current limit
  - voltage limited

### 2.4 Charts

- Motor characteristics chart
  - thrust
  - electric power
  - mechanical power
  - efficiency
  - waste heat
  - estimated temperature
  - reference points for hover/max

- Range estimator chart
  - speed vs range curve
  - peak range marker
  - km/h+km and mph+miles modes

### 2.5 Productivity Features

- expert/simple view toggle
- profile save/load/export/import
- reset-to-default input state
- language switch (en/de)
- print stylesheet (A4 landscape)
- shareable setup URL using hash payload
- statement acceptance modal

### 2.6 Production Hardening

- global error boundary fallback page
- input sanitization and clamping before compute
- profile import shape validation
- lazy chart loading with suspense fallback
- chunk-splitting build configuration
- source maps in production build
- standardized `npm run check` release gate

## 3. Architecture

### 3.1 Directory Map

- `src/engine` 
  deterministic physics/estimation core

- `src/components/inputs`
  input sections and primitive controls

- `src/components/outputs`
  metric cards, warnings, summary

- `src/components/charts`
  chart renderers

- `src/data`
  JSON preset datasets + filtering/export layer

- `src/utils`
  unit conversions, display helpers, status colors, input sanitizer

- `src/i18n`
  translation resources and i18n setup

### 3.2 Execution Flow

1. UI state changes from user input.
2. Input is debounced.
3. Input is sanitized and clamped.
4. `runCalculator` computes deterministic result object.
5. UI renders cards, warnings, and charts from result.

## 4. Full Calculation Logic

This section documents the actual logic sequence in engine code.

### 4.1 Unit Normalization

The engine first normalizes user input units into compute units.

- mass -> grams
- elevation -> meters
- temperature -> Celsius
- pressure -> hPa
- prop geometry -> inches

### 4.2 Atmosphere Model

Density uses ideal gas relation:

$$\rho = \frac{p}{R T}$$

where:
- $R = 287.058$ (dry air)
- $p$ from QNH input
- $T$ in Kelvin

ISA density reference is also computed for context.

### 4.3 Battery Model

The battery state computes:
- cell voltage from chemistry + charge state
- open-circuit voltage: $V_{oc} = V_{cell} \cdot S$
- rated voltage: $V_{rated} = V_{nominal} \cdot S$
- capacity: $C_{Ah} = (mAh \cdot P)/1000$
- pack resistance: $R_{pack} = (R_{cell}/P) \cdot S$
- max battery current: $I_{max,batt} = C_{discharge} \cdot C_{Ah}$

### 4.4 Motor Electrical Model

With pack sag and resistive drops:

- $I_{total} = N_{rotor} \cdot I_{motor} + I_{accessory}$
- $V_{pack} = V_{oc} - I_{total} \cdot R_{pack}$
- back-EMF: $V_{bemf} = V_{pack} - I_{motor}(R_m + R_{esc})$
- effective Kv: $Kv_{eff} = Kv/gearRatio$
- RPM: $RPM = V_{bemf} \cdot Kv_{eff}$

Power:

- electrical power: $P_e = V_{pack} \cdot I_{motor}$
- mechanical power: $P_m = V_{bemf} \cdot \max(0, I_{motor} - I_0)$
- efficiency: $\eta = P_m/P_e$

### 4.5 Propeller Model

Derived constants from geometry (if not user-specified):
- pitch ratio
- blade factor
- twist factor

Thrust relation:

$$T \propto C_T \cdot \left(\frac{\rho}{\rho_0}\right) \cdot n^2 \cdot D^4$$

with $n = RPM/60$.

### 4.6 Hover Solver

Hover target thrust per motor:

$$T_{hover,motor} = \frac{W_{AUW}}{N_{rotor}}$$

`solveHoverPoint` uses bounded bisection on RPM until thrust error interval is under tolerance or iterations are exhausted.

Then it solves required current for that RPM with sag-aware model.

### 4.7 Current Limits

Maximum feasible current per motor is the minimum of:
- motor current limit
- ESC continuous current
- battery current limit per motor (after accessory load)
- motor power-derived current ceiling

This gives `iMax`.

### 4.8 Operating Points

Three points are built:
- hover
- max
- optimum-efficiency estimate

For hover display, current is clamped to feasible range.

### 4.9 Thermal Estimation

Thermal coefficient is derived from exposed motor geometry and cooling mode, then bounded.

Temperature estimate:

$$T_{motor} = T_{ambient} + \theta_{th} \cdot I^2 R_m$$

This prevents unrealistic thermal runaway values from earlier overly aggressive scaling.

### 4.10 Endurance Model

Usable capacity = 80% of total mAh.

- hover endurance from hover current
- minimum endurance from max current
- mixed endurance from weighted current blend

If hover point is infeasible (required hover current > max allowed), hover time is forced to 0 and mixed time falls back to max-current behavior.

### 4.11 Multicopter Performance

- total max thrust from max motor thrust
- thrust-to-weight ratio
- max tilt from TWR and FCU tilt limit
- horizontal force from tilt
- max speed from drag balance
- climb from excess thrust

Range curve combines induced + parasitic + profile power terms across speed sweep.

### 4.12 Output Assembly

Engine returns a normalized `CalculationResult` object containing:
- cards data
- chart arrays
- warning flags
- status colors
- human-readable error messages

## 5. Warning and Status Logic

### 5.1 Warning Flags

- `cannotLiftOff`: total max thrust < all-up weight
- `overspin`: max RPM above Kv-based threshold
- `batteryOverloaded`: total max current exceeds battery max current
- `hoverOverCurrent`: required hover current exceeds feasible limit
- `voltageLimited`: loaded max voltage drops below configured sag threshold

### 5.2 Status Colors

Status colors are derived for:
- motor temperature
- battery load C
- TWR
- hover efficiency
- hover throttle
- ESC margin

## 6. Data Trust Policy

Preset exports enforce trust filters before records are shown in UI.

Current policy:
- exclude custom placeholder records
- enforce basic numeric plausibility constraints
- exclude synthetic ESC naming patterns (`LITE`, `PRO`, `V2`, `HV HV`)
- enforce row-level provenance manifest (`src/data/provenance.json`)
- support strict verified-only mode via `VITE_ENFORCE_VERIFIED_PRESETS=true`

Important:
- each row now has a provenance entry with:
  - `status` (`verified`, `pending`, `rejected`)
  - `sourceName`
  - `sourceUrl`
  - `verifiedAt`
- CI includes a provenance verifier (`npm run verify:provenance`) that fails on missing/invalid entries

## 7. Input Safety and Validation

`sanitizeInputState` clamps all numeric domains to bounded ranges before compute.

Examples:
- rotors: 1..16
- motor Kv: 50..10000
- gear ratio: 0.05..20
- battery voltage per cell: 0.5..5

This guarantees stable runtime behavior against malformed imports and share payloads.

## 8. UI Behavior Details

- debounced recomputation to avoid jitter
- chart modules load lazily to reduce initial payload
- statement gate blocks operation until accepted
- profile import only accepts likely input state shape
- rolling profile backups are saved to local storage
- one-click recovery restores the latest backup snapshot
- share link encodes full input in URL hash
- optional Sentry-based observability captures boundary errors and global unhandled errors

## 9. Build and Operations

### 9.1 Scripts

- `npm run dev` -> start local dev server
- `npm run typecheck` -> TypeScript build graph check
- `npm run lint` -> static lint pass
- `npm run test` -> watch mode unit tests
- `npm run test:ci` -> non-interactive test run for CI
- `npm run build` -> typecheck + production bundle
- `npm run verify:provenance` -> row-level data provenance integrity check
- `npm run audit:deps` -> dependency vulnerability audit
- `npm run check` -> lint + build release gate
- `npm run check:full` -> lint + tests + build + provenance + dependency audit
- `npm run preview` -> serve built artifacts

### 9.2 Production Bundle Strategy

- manual chunk separation for React, i18n, and charts
- source maps enabled for diagnostics
- lazy chart chunks reduce initial app payload

## 10. Quality Verification

Verified workflows include:
- full lint/test/build release gate
- broad engine scenario sweeps
- monotonic charge-state checks
- dataset schema/range/duplicate checks
- row-level provenance manifest validation
- CI enforcement via GitHub Actions (`.github/workflows/ci.yml`)

Validation outcomes:
- no non-finite outputs in tested matrix
- no efficiency bound violations in tested matrix
- warning consistency checks passed

## 11. Known Constraints

- model is deterministic and practical, but simplified relative to high-fidelity simulation
- many rows are still `pending` provenance status and require source verification before strict trusted releases
- environmental and aerodynamic assumptions are generalized
- real hardware validation is always required before flight

## 12. Development Notes

Recommended workflow for changes:

1. Implement feature or model change.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `npm run check:full` before merge/release.
5. For engine changes, run scenario sweeps and monotonic sanity checks.

## 13. Policy and Governance Docs

- Safety disclaimer: `docs/SAFETY_DISCLAIMER.md`
- Release policy: `docs/RELEASE_POLICY.md`
- Security and reliability operations: `docs/SECURITY_RELIABILITY.md`

## 14. Legal and Safety Reminder

All outputs are estimates.
Do not treat this application as a substitute for bench testing, datasheet verification, and safe flight procedures.
