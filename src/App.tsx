import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RangeEstimatorChart } from './components/charts/RangeEstimatorChart'
import { MotorCharacteristicsChart } from './components/charts/MotorCharacteristicsChart'
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

interface SavedProfile {
  name: string
  savedAt: string
  inputs: InputState
}

const STORAGE_KEY = 'xcopter_profiles'

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
  const [input, setInput] = useState<InputState>(defaultInput)
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh')
  const [expertMode, setExpertMode] = useState(true)
  const [profileName, setProfileName] = useState('')
  const [profiles, setProfiles] = useState<SavedProfile[]>(() => listProfiles())

  const debouncedInput = useDebouncedInput(input, 150)
  const result = useMemo(() => runCalculator(debouncedInput), [debouncedInput])

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
    setInput(selected.inputs)
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
    const parsed = (JSON.parse(await file.text()) ?? null) as SavedProfile | null
    if (!parsed?.name || !parsed.inputs) return
    const all = listProfiles().filter((item) => item.name !== parsed.name)
    all.push(parsed)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    setProfiles(all)
    setInput(parsed.inputs)
    setProfileName(parsed.name)
  }

  return (
    <main className="app-shell">
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
            <RangeEstimatorChart
              data={result.rangeChart}
              speedUnit={speedUnit}
              peakSpeedKmh={result.peakRangeSpeedKmh}
            />
          )}

          {expertMode && (
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
          )}
        </section>
      </section>
    </main>
  )
}

export default App
