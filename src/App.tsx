import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessoriesSection } from './components/inputs/AccessoriesSection'
import { BatterySection } from './components/inputs/BatterySection'
import { ControllerSection } from './components/inputs/ControllerSection'
import { GeneralSection } from './components/inputs/GeneralSection'
import { MotorSection } from './components/inputs/MotorSection'
import { PropellerSection } from './components/inputs/PropellerSection'
import { BatteryCard } from './components/outputs/BatteryCard'
import { MotorCard } from './components/outputs/MotorCard'
import { MulticopterCard } from './components/outputs/MulticopterCard'
import { SimpleSummaryCard } from './components/outputs/SimpleSummaryCard'
import { TotalDriveCard } from './components/outputs/TotalDriveCard'
import { WattmeterCard } from './components/outputs/WattmeterCard'
import { WarningsCard } from './components/outputs/WarningsCard'
import { defaultInput } from './defaults'
import { runCalculator } from './engine'
import { statusClass } from './utils/colors'
import type { InputState, SpeedUnit } from './types'
import { isLikelyInputState, sanitizeInputState } from './utils/inputSanitizer'

const RangeEstimatorChart = lazy(() => import('./components/charts/RangeEstimatorChart').then((m) => ({ default: m.RangeEstimatorChart })))
const MotorCharacteristicsChart = lazy(() =>
  import('./components/charts/MotorCharacteristicsChart').then((m) => ({ default: m.MotorCharacteristicsChart })),
)

interface SavedProfile {
  name: string
  savedAt: string
  inputs: InputState
}

const STORAGE_KEY = 'xcopter_profiles'
const STATEMENT_KEY = 'xcopter_statement_ok'

function parseSharedInputFromHash(): InputState | null {
  const rawHash = window.location.hash
  if (!rawHash.startsWith('#cfg=')) return null

  try {
    const encoded = rawHash.slice(5)
    const json = decodeURIComponent(window.atob(encoded))
    const parsed: unknown = JSON.parse(json)
    if (!isLikelyInputState(parsed)) return null
    return sanitizeInputState(parsed)
  } catch {
    return null
  }
}

function toSharedHash(input: InputState): string {
  const json = JSON.stringify(input)
  return `#cfg=${window.btoa(encodeURIComponent(json))}`
}

function listProfiles(): SavedProfile[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SavedProfile[]
  } catch {
    return []
  }
}

function useDebouncedInput(input: InputState, delayMs: number): InputState {
  const [debounced, setDebounced] = useState(input)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(input), delayMs)
    return () => window.clearTimeout(id)
  }, [input, delayMs])

  return debounced
}

function App() {
  const { t, i18n } = useTranslation()
  const sharedInput = parseSharedInputFromHash()
  const [input, setInput] = useState<InputState>(sharedInput ?? defaultInput)
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh')
  const [expertMode, setExpertMode] = useState(true)
  const [profileName, setProfileName] = useState(sharedInput ? 'Shared Setup' : '')
  const [profiles, setProfiles] = useState<SavedProfile[]>(() => listProfiles())
  const [statementAccepted, setStatementAccepted] = useState(() => localStorage.getItem(STATEMENT_KEY) === '1')
  const [copiedShare, setCopiedShare] = useState(false)

  const debouncedInput = useDebouncedInput(input, 150)
  const safeDebouncedInput = useMemo(() => sanitizeInputState(debouncedInput), [debouncedInput])
  const result = useMemo(() => runCalculator(safeDebouncedInput), [safeDebouncedInput])

  const triggerCalculate = () => {
    setInput((prev) => ({ ...prev }))
  }

  const shareCurrentSetup = async () => {
    const url = `${window.location.origin}${window.location.pathname}${toSharedHash(input)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedShare(true)
      window.setTimeout(() => setCopiedShare(false), 1300)
    } catch {
      window.prompt('Copy this share URL:', url)
    }
  }

  const acceptStatement = () => {
    localStorage.setItem(STATEMENT_KEY, '1')
    setStatementAccepted(true)
  }

  const saveProfile = () => {
    const name = profileName.trim()
    if (!name) return
    const all = listProfiles()
    const profile: SavedProfile = { name, savedAt: new Date().toISOString(), inputs: input }
    const idx = all.findIndex((item) => item.name === name)
    if (idx >= 0) all[idx] = profile
    else all.push(profile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    setProfiles(all)
  }

  const loadProfile = (name: string) => {
    const selected = listProfiles().find((item) => item.name === name)
    if (!selected) return
    setInput(sanitizeInputState(selected.inputs))
    setProfileName(selected.name)
  }

  const exportProfile = (name: string) => {
    const selected = listProfiles().find((item) => item.name === name)
    if (!selected) return
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${selected.name.replace(/\s+/g, '-')}.json`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  const importProfile = async (file: File) => {
    const parsedUnknown: unknown = JSON.parse(await file.text())
    if (!parsedUnknown || typeof parsedUnknown !== 'object') return
    const parsed = parsedUnknown as SavedProfile
    if (!parsed.name || !isLikelyInputState(parsed.inputs)) return
    const sanitizedInputs = sanitizeInputState(parsed.inputs)
    const all = listProfiles().filter((item) => item.name !== parsed.name)
    all.push({ ...parsed, inputs: sanitizedInputs })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    setProfiles(all)
    setInput(sanitizedInputs)
    setProfileName(parsed.name)
  }

  return (
    <main className="app-shell">
      {!statementAccepted && (
        <section className="statement-overlay" role="dialog" aria-modal>
          <div className="statement-modal">
            <h3>Statement for using this calculator</h3>
            <p>All values are calculated estimates and may deviate from real measurements.</p>
            <p>Before flight, recheck actual max values and ensure all limits stay within manufacturer specs.</p>
            <p>Do you accept this statement?</p>
            <div className="statement-actions">
              <button onClick={acceptStatement}>Ok</button>
              <button onClick={() => window.location.reload()}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      <header className="top-header">
        <div>
          <h1>xcopterCalc</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
        </div>
        <div className="inline-control">
          <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <button className="toggle-view" onClick={() => setExpertMode((v) => !v)}>
            {expertMode ? '◀ Simple view' : 'Expert view ▶'}
          </button>
          <button className="toggle-view" onClick={triggerCalculate}>calculate</button>
          <button className="toggle-view" onClick={() => void shareCurrentSetup()}>{copiedShare ? 'copied' : 'share'}</button>
          <label>Range Axis</label>
          <select value={speedUnit} onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}>
            <option value="kmh">km/h + km</option>
            <option value="mph">mph + miles</option>
          </select>
        </div>
      </header>

      <section className="panel-section profile-bar">
        <h3>{t('profiles.title')}</h3>
        <div className="profile-controls">
          <input placeholder="Profile name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          <button onClick={saveProfile}>{t('profiles.save')}</button>
          <select value="" onChange={(e) => loadProfile(e.target.value)}>
            <option value="">{t('profiles.load')}</option>
            {profiles.map((profile) => (
              <option key={profile.name} value={profile.name}>
                {profile.name} ({new Date(profile.savedAt).toLocaleString()})
              </option>
            ))}
          </select>
          <button onClick={() => exportProfile(profileName)}>{t('profiles.export')}</button>
          <label className="import-label">
            {t('profiles.import')}
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importProfile(file)
              }}
            />
          </label>
          <button onClick={() => setInput(defaultInput)}>{t('profiles.reset')}</button>
        </div>
      </section>

      <section className="print-header" aria-hidden>
        <strong>xcopterCalc</strong> - {new Date().toLocaleDateString()} | Motors: {input.general.rotors}x{' '}
        {input.motor.manufacturerModel} {input.motor.kv}Kv | Prop: {input.propeller.diameter.toFixed(1)}x
        {input.propeller.pitch.toFixed(1)} {input.propeller.blades}B | Battery: {input.battery.seriesCells}S
        {input.battery.parallelCells}P {input.battery.cellCapacityMah}mAh | AUW: {result.multicopter.allUpWeightG.toFixed(0)}g | Hover:{' '}
        {result.batteryCard.hoverFlightMin.toFixed(1)}min | TWR: {result.totalDrive.thrustWeightRatio.toFixed(2)}:1
      </section>

      <section className="grid-layout">
        <aside className="left-panel">
          <GeneralSection
            value={input.general}
            expertMode={expertMode}
            onChange={(patch) => setInput((prev) => ({ ...prev, general: { ...prev.general, ...patch } }))}
          />
          <BatterySection
            value={input.battery}
            expertMode={expertMode}
            onChange={(patch) => setInput((prev) => ({ ...prev, battery: { ...prev.battery, ...patch } }))}
          />
          <ControllerSection
            value={input.esc}
            expertMode={expertMode}
            onChange={(patch) => setInput((prev) => ({ ...prev, esc: { ...prev.esc, ...patch } }))}
          />
          {expertMode && (
            <AccessoriesSection
              value={input.accessories}
              onChange={(patch) =>
                setInput((prev) => ({ ...prev, accessories: { ...prev.accessories, ...patch } }))
              }
            />
          )}
          <MotorSection
            value={input.motor}
            expertMode={expertMode}
            onChange={(patch) => setInput((prev) => ({ ...prev, motor: { ...prev.motor, ...patch } }))}
          />
          <PropellerSection
            value={input.propeller}
            expertMode={expertMode}
            onChange={(patch) => setInput((prev) => ({ ...prev, propeller: { ...prev.propeller, ...patch } }))}
          />
        </aside>

        <section className="right-panel">
          {result.errorMessages.length > 0 && (
            <section className="error-banner" role="alert">
              {result.errorMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </section>
          )}

          {expertMode ? <BatteryCard data={result.batteryCard} batteryCClass={statusClass(result.status.batteryC)} /> : <SimpleSummaryCard result={result} />}

          <MotorCard
            title="Motor @ Optimum Efficiency"
            data={result.motorOptimum}
            efficiencyClass={statusClass(result.status.hoverEfficiency)}
          />

          {expertMode && <WattmeterCard data={result.wattmeter} />}

          {expertMode && (
            <MotorCard
              title="Motor @ Maximum"
              data={result.motorMax}
              efficiencyClass={statusClass(result.status.hoverEfficiency)}
              tempClass={statusClass(result.status.motorTemp)}
            />
          )}

          <MotorCard
            title="Motor @ Hover"
            data={result.motorHover}
            efficiencyClass={statusClass(result.status.hoverEfficiency)}
            throttleClass={statusClass(result.status.hoverThrottle)}
            showHoverFields
          />

          {expertMode && <TotalDriveCard data={result.totalDrive} twrClass={statusClass(result.status.twr)} />}
          {expertMode && <MulticopterCard data={result.multicopter} />}
          <WarningsCard warnings={result.warnings} />

          {expertMode && (
            <Suspense fallback={<section className="chart-card"><h3>Range Estimator</h3><p>Loading chart...</p></section>}>
              <RangeEstimatorChart
                data={result.rangeChart}
                speedUnit={speedUnit}
                peakSpeedKmh={result.peakRangeSpeedKmh}
              />
            </Suspense>
          )}

          {expertMode && (
            <Suspense fallback={<section className="chart-card"><h3>Motor Characteristics</h3><p>Loading chart...</p></section>}>
              <MotorCharacteristicsChart
                data={result.motorChart}
                hoverPoint={{
                  currentA: result.motorHover.currentA,
                  thrustG: result.motorHover.thrustG,
                }}
                maxPoint={{
                  currentA: result.motorMax.currentA,
                  thrustG: result.motorMax.thrustG,
                }}
              />
            </Suspense>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
