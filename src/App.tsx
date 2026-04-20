import { useMemo, useState } from 'react'
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
import { TotalDriveCard } from './components/outputs/TotalDriveCard'
import { WarningsCard } from './components/outputs/WarningsCard'
import { defaultInput } from './defaults'
import { runCalculator } from './engine'
import { statusClass } from './utils/colors'
import type { InputState, SpeedUnit } from './types'

function App() {
  const [input, setInput] = useState<InputState>(defaultInput)
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh')

  const result = useMemo(() => runCalculator(input), [input])

  return (
    <main className="app-shell">
      <header className="top-header">
        <div>
          <h1>xcopterCalc</h1>
          <p className="subtitle">Open multicopter drive-system calculator</p>
        </div>
        <div className="inline-control">
          <label>Range Axis</label>
          <select value={speedUnit} onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}>
            <option value="kmh">km/h + km</option>
            <option value="mph">mph + miles</option>
          </select>
        </div>
      </header>

      <section className="grid-layout">
        <aside className="left-panel">
          <GeneralSection
            value={input.general}
            onChange={(patch) => setInput((prev) => ({ ...prev, general: { ...prev.general, ...patch } }))}
          />
          <BatterySection
            value={input.battery}
            onChange={(patch) => setInput((prev) => ({ ...prev, battery: { ...prev.battery, ...patch } }))}
          />
          <ControllerSection
            value={input.esc}
            onChange={(patch) => setInput((prev) => ({ ...prev, esc: { ...prev.esc, ...patch } }))}
          />
          <AccessoriesSection
            value={input.accessories}
            onChange={(patch) =>
              setInput((prev) => ({ ...prev, accessories: { ...prev.accessories, ...patch } }))
            }
          />
          <MotorSection
            value={input.motor}
            onChange={(patch) => setInput((prev) => ({ ...prev, motor: { ...prev.motor, ...patch } }))}
          />
          <PropellerSection
            value={input.propeller}
            onChange={(patch) => setInput((prev) => ({ ...prev, propeller: { ...prev.propeller, ...patch } }))}
          />
        </aside>

        <section className="right-panel">
          <BatteryCard data={result.batteryCard} batteryCClass={statusClass(result.status.batteryC)} />

          <MotorCard
            title="Motor @ Optimum Efficiency"
            data={result.motorOptimum}
            efficiencyClass={statusClass(result.status.hoverEfficiency)}
          />

          <MotorCard
            title="Motor @ Maximum"
            data={result.motorMax}
            efficiencyClass={statusClass(result.status.hoverEfficiency)}
            tempClass={statusClass(result.status.motorTemp)}
          />

          <MotorCard
            title="Motor @ Hover"
            data={result.motorHover}
            efficiencyClass={statusClass(result.status.hoverEfficiency)}
            throttleClass={statusClass(result.status.hoverThrottle)}
            showHoverFields
          />

          <TotalDriveCard data={result.totalDrive} twrClass={statusClass(result.status.twr)} />
          <MulticopterCard data={result.multicopter} />
          <WarningsCard warnings={result.warnings} />

          <RangeEstimatorChart
            data={result.rangeChart}
            speedUnit={speedUnit}
            peakSpeedKmh={result.peakRangeSpeedKmh}
          />

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
        </section>
      </section>
    </main>
  )
}

export default App
