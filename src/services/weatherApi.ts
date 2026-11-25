import type { HourlyPoint, LocationPoint, RawWeatherDataset } from '../types/weather';

export const PRESET_CITIES: LocationPoint[] = [
  { name: 'Poznań', region: 'Wielkopolskie', country: 'Polska', latitude: 52.4064, longitude: 16.9252, source: 'preset' },
  { name: 'Warszawa', region: 'Mazowieckie', country: 'Polska', latitude: 52.2297, longitude: 21.0122, source: 'preset' },
  { name: 'Kraków', region: 'Małopolskie', country: 'Polska', latitude: 50.0647, longitude: 19.945, source: 'preset' },
  { name: 'Gdańsk', region: 'Pomorskie', country: 'Polska', latitude: 54.352, longitude: 18.6466, source: 'preset' },
  { name: 'Wrocław', region: 'Dolnośląskie', country: 'Polska', latitude: 51.1079, longitude: 17.0385, source: 'preset' },
  { name: 'Zakopane', region: 'Małopolskie', country: 'Polska', latitude: 49.2992, longitude: 19.9496, source: 'preset' },
  { name: 'Białystok', region: 'Podlaskie', country: 'Polska', latitude: 53.1325, longitude: 23.1688, source: 'preset' },
];

export const DEFAULT_LOCATION: LocationPoint = PRESET_CITIES[0];

export function describeWmoCode(code: number): string {
  if (code === 0) return 'Bezchmurnie';
  if (code === 1) return 'Przeważnie pogodnie';
  if (code === 2) return 'Częściowe zachmurzenie';
  if (code === 3) return 'Pochmurno';
  if (code === 45 || code === 48) return 'Mgła lub szadź';
  if (code >= 51 && code <= 55) return 'Mżawka';
  if (code === 56 || code === 57) return 'Marznąca mżawka (gołoledź)';
  if (code >= 61 && code <= 65) return 'Opady deszczu';
  if (code === 66 || code === 67) return 'Marznący deszcz (gołoledź)';
  if (code >= 71 && code <= 75) return 'Opady śniegu';
  if (code === 77) return 'Ziarna śnieżne';
  if (code >= 80 && code <= 82) return 'Przelotny deszcz';
  if (code === 85 || code === 86) return 'Przelotne opady śniegu';
  if (code === 95) return 'Burza';
  if (code === 96 || code === 99) return 'Burza z gradem';
  return 'Zmienne zachmurzenie';
}

export function isFreezingPrecipCode(code: number): boolean {
  return code === 56 || code === 57 || code === 66 || code === 67 || code === 48;
}

export function isSnowWeatherCode(code: number): boolean {
  return (code >= 71 && code <= 77) || code === 85 || code === 86;
}

export function isWetWeatherCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  );
}

interface OpenMeteoForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    snowfall: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    rain: number[];
    snowfall: number[];
    precipitation_probability?: (number | null)[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
}

export async function fetchWeatherDataset(
  location: LocationPoint,
  signal?: AbortSignal
): Promise<RawWeatherDataset> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current:
      'temperature_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,wind_speed_10m,is_day',
    hourly:
      'temperature_2m,apparent_temperature,precipitation,rain,snowfall,precipitation_probability,weather_code,wind_speed_10m',
    past_days: '7',
    forecast_days: '8',
    timezone: 'auto',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać danych pogodowych (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  if (!data.current || !data.hourly || !data.hourly.time?.length) {
    throw new Error('Otrzymano niekompletne dane z serwisu pogodowego.');
  }

  const todayKey = data.current.time.slice(0, 10);

  const hourly: HourlyPoint[] = data.hourly.time.map((iso, idx) => {
    const dateKey = iso.slice(0, 10);
    const hour = Number(iso.slice(11, 13)) || 0;
    return {
      time: iso,
      dateKey,
      hour,
      temperature: Number(data.hourly.temperature_2m[idx] ?? 0),
      apparentTemperature: Number(data.hourly.apparent_temperature[idx] ?? 0),
      precipitation: Number(data.hourly.precipitation[idx] ?? 0),
      rain: Number(data.hourly.rain[idx] ?? 0),
      snowfall: Number(data.hourly.snowfall[idx] ?? 0),
      precipitationProbability:
        data.hourly.precipitation_probability?.[idx] ?? null,
      weatherCode: Number(data.hourly.weather_code[idx] ?? 0),
      windSpeed: Number(data.hourly.wind_speed_10m[idx] ?? 0),
    };
  });

  return {
    location,
    timezone: data.timezone || 'Europe/Warsaw',
    fetchedAt: new Date().toISOString(),
    todayKey,
    current: {
      time: data.current.time,
      temperature: Number(data.current.temperature_2m),
      apparentTemperature: Number(data.current.apparent_temperature),
      precipitation: Number(data.current.precipitation ?? 0),
      rain: Number(data.current.rain ?? 0),
      snowfall: Number(data.current.snowfall ?? 0),
      weatherCode: Number(data.current.weather_code ?? 0),
      windSpeed: Number(data.current.wind_speed_10m ?? 0),
      isDay: data.current.is_day === 1,
    },
    hourly,
  };
}

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<LocationPoint[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: '6',
    language: 'pl',
    format: 'json',
  });

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error('Nie udało się wyszukać miejscowości.');
  }

  const data = (await response.json()) as { results?: OpenMeteoGeocodingResult[] };
  if (!data.results?.length) return [];

  return data.results.map((item) => ({
    name: item.name,
    region: item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
    source: 'manual',
  }));
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationPoint> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude.toFixed(
      4
    )}&longitude=${longitude.toFixed(4)}&localityLanguage=pl`;
    const response = await fetch(url);
    if (response.ok) {
      const data = (await response.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      const name = data.city || data.locality || data.principalSubdivision;
      if (name) {
        return {
          name,
          region: data.principalSubdivision,
          country: data.countryName,
          latitude,
          longitude,
          source: 'gps',
        };
      }
    }
  } catch {
    // Graceful fallback to coordinates label
  }

  return {
    name: `Twoja lokalizacja (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`,
    latitude,
    longitude,
    source: 'gps',
  };
}
