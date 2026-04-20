export type WeightUnit = 'g' | 'oz'
export type DistanceUnit = 'm' | 'ft'
export type TemperatureUnit = 'c' | 'f'
export type PressureUnit = 'hPa' | 'inHg'
export type SpeedUnit = 'kmh' | 'mph'
export type PropLengthUnit = 'inch' | 'mm'
export type CoolingType = 'open' | 'closed'

export type WeightMode = 'inclDrive' | 'lessBattery' | 'withoutDrive'
export type RotorLayout = 'flat' | 'coaxial'
export type CellType = 'LiPo' | 'LiHV' | 'Li-Ion' | 'NiMH' | 'Custom'
export type ChargeState = 'full' | 'normal' | 'low'

export interface MotorPreset {
  id: string
  manufacturer: string
  series: string
  kv: number
  discontinued: boolean
  cooling: CoolingType
  poles: number
  Rm_mOhm: number
  I0_A: number
  I0_at_V: number
  limit_A: number
  limit_W: number
  weight_g: number
  case_length_mm: number
  stator_diameter_mm: number
  stator_height_mm: number
}

export interface BatteryPreset {
  id: string
  brand: string
  model: string
  chemistry: 'LiPo' | 'LiHV' | 'Li-Ion' | 'NiMH'
  capacity_mAh: number
  C_cont: number
  C_max: number
  Rm_mOhm: number
  V_nominal: number
  V_full: number
  weight_g: number
  S_default: number
  P_default: number
}

export interface ESCPreset {
  id: string
  manufacturer: string
  model: string
  A_cont: number
  A_burst: number
  Rm_mOhm: number
  voltage_max: number
  weight_g: number
  protocol: 'PWM' | 'DSHOT300' | 'DSHOT600' | 'BLHeli32'
}

export interface PropPreset {
  id: string
  brand: string
  model: string
  diameter_inch: number
  pitch_inch: number
  blades: number
  twist_deg: number
  TConst: number
  PConst: number
  weight_g: number
}

export interface UnitPrefs {
  weight: 'g' | 'oz'
  length: 'mm' | 'inch'
  temperature: 'C' | 'F'
  speed: 'km/h' | 'mph'
  pressure: 'hPa' | 'inHg'
  altitude: 'm' | 'ft'
  distance: 'km' | 'mi'
}

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
  presetId?: string
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
  presetId?: string
  escType: string
  continuousCurrentA: number
  burstCurrentA: number
  internalResistanceMOhm: number
  voltageMax: number
  protocol: 'PWM' | 'DSHOT300' | 'DSHOT600' | 'BLHeli32'
  weightG: number
}

export interface AccessoriesInput {
  currentDrainA: number
  weightG: number
}

export interface MotorInput {
  presetId?: string
  manufacturerModel: string
  kv: number
  noLoadCurrentA: number
  noLoadVoltage: number
  currentLimitA: number
  powerLimitW: number
  statorResistanceMOhm: number
  cooling: CoolingType
  caseLengthMm: number
  statorDiameterMm: number
  statorHeightMm: number
  poles: number
  weightG: number
}

export interface PropellerInput {
  presetId?: string
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
  electricPowerW: number
  mechanicalPowerW: number
  efficiencyPct: number
  heatW: number
  temperatureC: number
}

export interface RangeChartPoint {
  speedKmh: number
  speedMph: number
  rangeKm: number
  rangeMiles: number
}

export interface WattmeterData {
  currentA: number
  voltageV: number
  powerW: number
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
  wattmeter: WattmeterData
  motorChart: MotorChartPoint[]
  rangeChart: RangeChartPoint[]
  hoverSpeedKmh: number
  peakRangeSpeedKmh: number
  status: StatusFlags
  warnings: CalculationWarnings
  errorMessages: string[]
}
