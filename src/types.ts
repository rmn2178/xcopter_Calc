export type WeightUnit = 'g' | 'oz'
export type DistanceUnit = 'm' | 'ft'
export type TemperatureUnit = 'c' | 'f'
export type PressureUnit = 'hPa' | 'inHg'
export type SpeedUnit = 'kmh' | 'mph'
export type PropLengthUnit = 'inch' | 'mm'

export type WeightMode = 'inclDrive' | 'lessBattery' | 'withoutDrive'
export type RotorLayout = 'flat' | 'coaxial'
export type CellType = 'LiPo' | 'LiHV' | 'Li-Ion' | 'NiMH' | 'Custom'
export type ChargeState = 'full' | 'normal' | 'low'

export interface GeneralInput {
  modelWeight: number
  modelWeightUnit: WeightUnit
  weightMode: WeightMode
  rotors: number
  rotorLayout: RotorLayout
  frameSizeMm: number
  fcuTiltLimitDeg: number
  noTiltLimit: boolean
  elevation: number
  elevationUnit: DistanceUnit
  airTemp: number
  airTempUnit: TemperatureUnit
  pressure: number
  pressureUnit: PressureUnit
}

export interface BatteryInput {
  cellType: CellType
  chargeState: ChargeState
  seriesCells: number
  parallelCells: number
  cellCapacityMah: number
  maxDischargeC: number
  internalResistanceMOhm: number
  nominalVoltage: number
  fullChargeVoltage: number
  cellWeightG: number
}

export interface EscInput {
  escType: string
  continuousCurrentA: number
  burstCurrentA: number
  internalResistanceMOhm: number
  weightG: number
}

export interface AccessoriesInput {
  currentDrainA: number
  weightG: number
}

export interface MotorInput {
  manufacturerModel: string
  kv: number
  noLoadCurrentA: number
  noLoadVoltage: number
  currentLimitA: number
  powerLimitW: number
  statorResistanceMOhm: number
  caseLengthMm: number
  poles: number
  weightG: number
}

export interface PropellerInput {
  propType: string
  yokeTwistDeg: number
  diameter: number
  diameterUnit: PropLengthUnit
  pitch: number
  pitchUnit: PropLengthUnit
  blades: number
  tConst: number
  pConst: number
  gearRatio: number
  propWeightG: number
}

export interface InputState {
  general: GeneralInput
  battery: BatteryInput
  esc: EscInput
  accessories: AccessoriesInput
  motor: MotorInput
  propeller: PropellerInput
}

export interface StatusFlags {
  motorTemp: 'green' | 'yellow' | 'red'
  batteryC: 'green' | 'yellow' | 'red'
  twr: 'green' | 'yellow' | 'red'
  hoverEfficiency: 'green' | 'yellow' | 'red'
  hoverThrottle: 'green' | 'yellow' | 'red'
  escMargin: 'green' | 'yellow' | 'red'
}

export interface OperatingPoint {
  currentA: number
  backEmfV: number
  rpm: number
  electricPowerW: number
  mechanicalPowerW: number
  efficiencyPct: number
  thrustG: number
  motorTempC: number
  throttleLogPct: number
  throttleLinearPct: number
  specificThrustGW: number
  powerWeightWkg: number
  controllerEpm: number
}

export interface BatteryCardData {
  loadC: number
  voltageUnderLoadV: number
  ratedVoltageV: number
  energyWh: number
  capacityTotalMah: number
  capacityUsedMah: number
  minFlightMin: number
  mixedFlightMin: number
  hoverFlightMin: number
  weightG: number
}

export interface TotalDriveData {
  driveWeightG: number
  thrustWeightRatio: number
  currentHoverA: number
  pinHoverW: number
  poutHoverW: number
  efficiencyHoverPct: number
  currentMaxA: number
  pinMaxW: number
  poutMaxW: number
  efficiencyMaxPct: number
}

export interface MulticopterData {
  allUpWeightG: number
  addPayloadG: number
  maxTiltDeg: number
  maxSpeedKmh: number
  estimatedRangeKm: number
  maxClimbMs: number
  maxClimbFtMin: number
  totalDiscAreaDm2: number
  totalDiscAreaIn2: number
  engineFailureStatus: string
}

export interface MotorChartPoint {
  currentA: number
  thrustG: number
  powerW: number
  efficiencyPct: number
}

export interface RangeChartPoint {
  speedKmh: number
  speedMph: number
  rangeKm: number
  rangeMiles: number
}

export interface CalculationWarnings {
  cannotLiftOff: boolean
  overspin: boolean
  batteryOverloaded: boolean
  hoverOverCurrent: boolean
  voltageLimited: boolean
}

export interface CalculationResult {
  airDensity: number
  batteryCard: BatteryCardData
  motorOptimum: OperatingPoint
  motorMax: OperatingPoint
  motorHover: OperatingPoint
  totalDrive: TotalDriveData
  multicopter: MulticopterData
  motorChart: MotorChartPoint[]
  rangeChart: RangeChartPoint[]
  hoverSpeedKmh: number
  peakRangeSpeedKmh: number
  status: StatusFlags
  warnings: CalculationWarnings
}
