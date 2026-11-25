export type DrivingWindow = 'commute' | 'daytime' | 'all_day';

export interface LocationPoint {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'manual' | 'preset';
}

export interface HourlyPoint {
  time: string; // ISO string YYYY-MM-DDTHH:MM
  dateKey: string; // YYYY-MM-DD
  hour: number; // 0..23
  temperature: number;
  apparentTemperature: number;
  precipitation: number; // mm
  rain: number; // mm
  snowfall: number; // cm
  precipitationProbability: number | null; // %
  weatherCode: number;
  windSpeed: number; // km/h
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
}

export interface RawWeatherDataset {
  location: LocationPoint;
  timezone: string;
  fetchedAt: string;
  todayKey: string;
  current: CurrentWeather;
  hourly: HourlyPoint[];
}

export interface DailySummary {
  dateKey: string;
  shortLabel: string; // e.g. "25 lis"
  weekdayShort: string; // e.g. "Śr"
  fullDateLabel: string;
  segment: 'history' | 'today' | 'forecast';
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  drivingMinTemp: number;
  drivingAvgTemp: number;
  precipitationSum: number; // mm
  snowfallSum: number; // cm
  maxPrecipProb: number | null;
  dominantWeatherCode: number;
  hasFrostRisk: boolean; // min <= 0°C
  hasNearFrostRisk: boolean; // drivingMin <= 2°C
  hasBlackIceRisk: boolean; // precipitation or freezing weather code + temp <= 2.5°C
  hasSnowRisk: boolean; // snowfall >= 0.2 cm or snow weather code
  hasColdRainRisk: boolean; // rain >= 1.5 mm + avg/driving temp <= 7°C
}

export type VerdictStatus =
  | 'winter'
  | 'transition_to_winter'
  | 'transition_to_summer'
  | 'summer';

export type FactorLevel = 'winter' | 'caution' | 'summer';

export interface VerdictFactor {
  id: string;
  label: string;
  valueText: string;
  level: FactorLevel;
  levelLabel: string;
  detail: string;
}

export interface RoadHazard {
  id: string;
  type: 'snow' | 'black_ice' | 'frost' | 'cold_rain';
  title: string;
  description: string;
  severity: 'high' | 'medium';
}

export interface TireVerdict {
  status: VerdictStatus;
  recommendedTire: 'Opony zimowe' | 'Okres przejściowy' | 'Opony letnie';
  headline: string;
  summary: string;
  actionGuidance: string;
  past7Avg: number;
  forecast7Avg: number;
  forecastDrivingMin: number;
  forecastDrivingAvg: number;
  pastDaysBelow7: number;
  forecastDaysBelow7: number;
  forecastTotalDays: number;
  trendDelta: number; // forecast7Avg - past7Avg
  factors: VerdictFactor[];
  hazards: RoadHazard[];
}

export type SurfaceId = 'wet_snow_0' | 'wet_asphalt_5' | 'dry_asphalt_5' | 'dry_asphalt_20';

export interface BrakingScenario {
  id: SurfaceId;
  label: string;
  shortLabel: string;
  temperature: number;
  surfaceDescription: string;
  distances50: {
    winter: number; // meters
    summer: number; // meters
  };
  distances80: {
    winter: number; // meters
    summer: number; // meters
  };
  winner: 'winter' | 'summer';
  sourceNote: string;
  physicsExplanation: string;
}
