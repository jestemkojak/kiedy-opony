import {
  isFreezingPrecipCode,
  isSnowWeatherCode,
  isWetWeatherCode,
} from '../services/weatherApi';
import type {
  DailySummary,
  DrivingWindow,
  HourlyPoint,
  RawWeatherDataset,
  RoadHazard,
  TireVerdict,
  VerdictFactor,
  VerdictStatus,
} from '../types/weather';

export const EXPERT_TEMP_THRESHOLD = 7;

export const DRIVING_WINDOW_OPTIONS: {
  id: DrivingWindow;
  label: string;
  shortLabel: string;
  hoursDescription: string;
}[] = [
  {
    id: 'commute',
    label: 'Poranki i wieczory',
    shortLabel: '5:00–8:00 / 18:00–22:00',
    hoursDescription: 'Dojazdy do pracy i powroty po zmroku (najwyższe ryzyko przymrozków)',
  },
  {
    id: 'daytime',
    label: 'Godziny dzienne',
    shortLabel: '9:00–17:00',
    hoursDescription: 'Jazda głównie w ciągu dnia, w najcieplejszych godzinach doby',
  },
  {
    id: 'all_day',
    label: 'Jazda całodobowa',
    shortLabel: '0:00–23:00',
    hoursDescription: 'Wyjazdy o dowolnej porze dnia i nocy, także poza miastem',
  },
];

export function isHourInDrivingWindow(hour: number, window: DrivingWindow): boolean {
  if (window === 'commute') {
    return (hour >= 5 && hour <= 8) || (hour >= 18 && hour <= 22);
  }
  if (window === 'daytime') {
    return hour >= 9 && hour <= 17;
  }
  return true;
}

const MONTHS_PL = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

const WEEKDAYS_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

function formatDateLabels(dateKey: string): {
  shortLabel: string;
  weekdayShort: string;
  fullDateLabel: string;
} {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekdayShort = WEEKDAYS_PL[dateObj.getUTCDay()];
  const monthLabel = MONTHS_PL[(m - 1) % 12];
  return {
    shortLabel: `${d} ${monthLabel}`,
    weekdayShort,
    fullDateLabel: `${weekdayShort}, ${d} ${monthLabel} ${y}`,
  };
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

function pickDominantWeatherCode(points: HourlyPoint[]): number {
  // Prioritize hazardous conditions (freezing precip > snow > rain > fog > clouds)
  let worst = 0;
  let worstScore = -1;
  for (const p of points) {
    let score = 0;
    if (isFreezingPrecipCode(p.weatherCode)) score = 100;
    else if (isSnowWeatherCode(p.weatherCode)) score = 85;
    else if (p.weatherCode >= 95) score = 75;
    else if (isWetWeatherCode(p.weatherCode)) score = 60;
    else if (p.weatherCode === 45 || p.weatherCode === 48) score = 40;
    else score = p.weatherCode;

    if (score > worstScore) {
      worstScore = score;
      worst = p.weatherCode;
    }
  }
  return worst;
}

export function buildDailySummaries(
  dataset: RawWeatherDataset,
  drivingWindow: DrivingWindow
): DailySummary[] {
  const grouped = new Map<string, HourlyPoint[]>();
  for (const point of dataset.hourly) {
    const arr = grouped.get(point.dateKey);
    if (arr) {
      arr.push(point);
    } else {
      grouped.set(point.dateKey, [point]);
    }
  }

  const sortedDates = Array.from(grouped.keys()).sort();
  const summaries: DailySummary[] = sortedDates.map((dateKey) => {
    const pts = grouped.get(dateKey)!;
    const temps = pts.map((p) => p.temperature);
    const windowPts = pts.filter((p) => isHourInDrivingWindow(p.hour, drivingWindow));
    const activeWindowPts = windowPts.length ? windowPts : pts;
    const windowTemps = activeWindowPts.map((p) => p.temperature);

    const minTemp = round1(Math.min(...temps));
    const maxTemp = round1(Math.max(...temps));
    const avgTemp = round1(average(temps));
    const drivingMinTemp = round1(Math.min(...windowTemps));
    const drivingAvgTemp = round1(average(windowTemps));
    const precipitationSum = round1(pts.reduce((s, p) => s + p.precipitation, 0));
    const snowfallSum = round1(pts.reduce((s, p) => s + p.snowfall, 0));
    const probs = pts
      .map((p) => p.precipitationProbability)
      .filter((v): v is number => v !== null);
    const maxPrecipProb = probs.length ? Math.max(...probs) : null;

    const hasFrostRisk = minTemp <= 0 || drivingMinTemp <= 0;
    const hasNearFrostRisk = drivingMinTemp <= 2;

    const hasSnowRisk =
      snowfallSum >= 0.2 || pts.some((p) => isSnowWeatherCode(p.weatherCode));

    const hasBlackIceRisk = pts.some((p) => {
      if (isFreezingPrecipCode(p.weatherCode)) return true;
      const wetAndCold = (p.precipitation >= 0.2 || isWetWeatherCode(p.weatherCode)) && p.temperature <= 2.5;
      return wetAndCold;
    }) || (precipitationSum >= 1 && minTemp <= 1);

    const hasColdRainRisk =
      precipitationSum >= 1.5 &&
      !hasSnowRisk &&
      (drivingAvgTemp <= EXPERT_TEMP_THRESHOLD || avgTemp <= EXPERT_TEMP_THRESHOLD);

    let segment: 'history' | 'today' | 'forecast' = 'forecast';
    if (dateKey < dataset.todayKey) segment = 'history';
    else if (dateKey === dataset.todayKey) segment = 'today';

    const { shortLabel, weekdayShort, fullDateLabel } = formatDateLabels(dateKey);

    return {
      dateKey,
      shortLabel,
      weekdayShort,
      fullDateLabel,
      segment,
      minTemp,
      maxTemp,
      avgTemp,
      drivingMinTemp,
      drivingAvgTemp,
      precipitationSum,
      snowfallSum,
      maxPrecipProb,
      dominantWeatherCode: pickDominantWeatherCode(pts),
      hasFrostRisk,
      hasNearFrostRisk,
      hasBlackIceRisk,
      hasSnowRisk,
      hasColdRainRisk,
    };
  });

  // Keep up to 7 past days + today + 7 forecast days (15 days max)
  const todayIdx = summaries.findIndex((d) => d.segment === 'today');
  if (todayIdx === -1) return summaries.slice(0, 15);
  const start = Math.max(0, todayIdx - 7);
  const end = Math.min(summaries.length, todayIdx + 8);
  return summaries.slice(start, end);
}

export function evaluateTireVerdict(
  dataset: RawWeatherDataset,
  dailySummaries: DailySummary[],
  drivingWindow: DrivingWindow
): TireVerdict {
  const historyDays = dailySummaries.filter((d) => d.segment === 'history');
  const upcomingDays = dailySummaries.filter(
    (d) => d.segment === 'today' || d.segment === 'forecast'
  );

  const past7Avg = round1(
    average((historyDays.length ? historyDays : upcomingDays).map((d) => d.avgTemp))
  );
  const forecast7Avg = round1(average(upcomingDays.map((d) => d.avgTemp)));
  const forecastDrivingAvg = round1(
    average(upcomingDays.map((d) => d.drivingAvgTemp))
  );
  const forecastDrivingMin = round1(
    Math.min(...upcomingDays.map((d) => d.drivingMinTemp))
  );

  const pastDaysBelow7 = historyDays.filter(
    (d) => d.avgTemp < EXPERT_TEMP_THRESHOLD
  ).length;
  const forecastDaysBelow7 = upcomingDays.filter(
    (d) => d.avgTemp < EXPERT_TEMP_THRESHOLD
  ).length;
  const forecastDaysWindowBelow7 = upcomingDays.filter(
    (d) => d.drivingAvgTemp < EXPERT_TEMP_THRESHOLD
  ).length;

  const snowDays = upcomingDays.filter((d) => d.hasSnowRisk);
  const blackIceDays = upcomingDays.filter((d) => d.hasBlackIceRisk);
  const frostDays = upcomingDays.filter((d) => d.drivingMinTemp <= 0);
  const nearFrostDays = upcomingDays.filter((d) => d.drivingMinTemp <= 2);
  const coldRainDays = upcomingDays.filter((d) => d.hasColdRainRisk);

  const trendDelta = round1(forecast7Avg - past7Avg);

  // Build road hazards list
  const hazards: RoadHazard[] = [];
  if (snowDays.length > 0) {
    hazards.push({
      id: 'snow',
      type: 'snow',
      severity: 'high',
      title: `Prognozowane opady śniegu (${snowDays.length} ${snowDays.length === 1 ? 'dzień' : 'dni'})`,
      description: `Śnieg lub deszcz ze śniegiem pojawia się w prognozie (najbliżej: ${snowDays[0].fullDateLabel}). Na śniegu droga hamowania opon letnich wydłuża się ponad dwukrotnie.`,
    });
  }
  if (blackIceDays.length > 0) {
    hazards.push({
      id: 'black_ice',
      type: 'black_ice',
      severity: 'high',
      title: `Ryzyko gołoledzi i oblodzenia (${blackIceDays.length} ${blackIceDays.length === 1 ? 'dzień' : 'dni'})`,
      description: `Prognoza wskazuje opady lub wilgoć przy temperaturze ≤ 2,5°C (m.in. ${blackIceDays[0].fullDateLabel}). Szczególne ryzyko na mostach, wiaduktach i odcinkach leśnych.`,
    });
  }
  if (frostDays.length > 0) {
    hazards.push({
      id: 'frost',
      type: 'frost',
      severity: frostDays.length >= 2 ? 'high' : 'medium',
      title: `Przymrozki w wybranej porze jazdy (min. ${forecastDrivingMin.toFixed(1)}°C)`,
      description: `W ${frostDays.length} z najbliższych ${upcomingDays.length} dni temperatura w Twoich godzinach jazdy spadnie do 0°C lub poniżej.`,
    });
  } else if (nearFrostDays.length > 0) {
    hazards.push({
      id: 'near_frost',
      type: 'frost',
      severity: 'medium',
      title: `Temperatura przy gruncie bliska zera (min. ${forecastDrivingMin.toFixed(1)}°C)`,
      description: `Przy temperaturze powietrza ≤ 2°C nawierzchnia asfaltowa często wychładza się poniżej 0°C, powodując lokalny szron.`,
    });
  }
  if (coldRainDays.length > 0) {
    hazards.push({
      id: 'cold_rain',
      type: 'cold_rain',
      severity: 'medium',
      title: `Deszcz w niskiej temperaturze (${coldRainDays.length} ${coldRainDays.length === 1 ? 'dzień' : 'dni'})`,
      description: `Mokra jezdnia przy temperaturze ≤ 7°C to warunki, w których stwardniała mieszanka opon letnich wyraźnie traci przyczepność.`,
    });
  }

  // Evaluate 4 transparent expert factors
  const windowOption = DRIVING_WINDOW_OPTIONS.find((w) => w.id === drivingWindow)!;

  // Factor 1: 7°C Multi-day threshold
  const f1Level: VerdictFactor['level'] =
    forecastDaysBelow7 >= Math.ceil(upcomingDays.length * 0.6) ||
    forecast7Avg < EXPERT_TEMP_THRESHOLD
      ? 'winter'
      : forecastDaysBelow7 >= 2 || forecast7Avg <= 9.5
      ? 'caution'
      : 'summer';

  const factorThreshold: VerdictFactor = {
    id: 'threshold_7c',
    label: 'Zasada 7°C (średnia dobowa)',
    valueText: `${forecast7Avg.toFixed(1)}°C (${forecastDaysBelow7}/${upcomingDays.length} dni < 7°C)`,
    level: f1Level,
    levelLabel:
      f1Level === 'winter'
        ? 'Poniżej progu'
        : f1Level === 'caution'
        ? 'Strefa graniczna'
        : 'Powyżej progu',
    detail:
      f1Level === 'winter'
        ? `Średnia z najbliższych ${upcomingDays.length} dni utrzymuje się poniżej 7°C — guma letnia twardnieje i traci elastyczność.`
        : f1Level === 'caution'
        ? 'Temperatury oscylują w strefie przejściowej 7–10°C. Obserwuj trend kolejnych dni.'
        : 'Średnia dobowa stabilnie przekracza 7°C, zapewniając optymalne warunki pracy dla opon letnich.',
  };

  // Factor 2: Driving window & morning frost
  const f2Level: VerdictFactor['level'] =
    forecastDrivingMin <= 1 || forecastDrivingAvg < 6.5
      ? 'winter'
      : forecastDrivingMin <= 4 || forecastDaysWindowBelow7 >= 2
      ? 'caution'
      : 'summer';

  const factorDrivingWindow: VerdictFactor = {
    id: 'driving_window',
    label: `Pora jazdy (${windowOption.label})`,
    valueText: `min. ${forecastDrivingMin.toFixed(1)}°C · śr. ${forecastDrivingAvg.toFixed(1)}°C`,
    level: f2Level,
    levelLabel:
      f2Level === 'winter'
        ? 'Wymaga zimówek'
        : f2Level === 'caution'
        ? 'Chłodne dojazdy'
        : 'Komfort cieplny',
    detail:
      f2Level === 'winter'
        ? `W przedziale ${windowOption.shortLabel} występują temperatury z ryzykiem przymrozków lub wyraźnie poniżej 7°C.`
        : f2Level === 'caution'
        ? `W godzinach ${windowOption.shortLabel} zdarzają się chłodne odcinki poniżej 5°C mimo cieplejszego popołudnia.`
        : `W wybranych godzinach (${windowOption.shortLabel}) nawierzchnia pozostaje bezpiecznie ciepła.`,
  };

  // Factor 3: Precipitation, snow & black ice
  const f3Level: VerdictFactor['level'] =
    snowDays.length > 0 || blackIceDays.length > 0
      ? 'winter'
      : coldRainDays.length > 0
      ? 'caution'
      : 'summer';

  const precipText =
    snowDays.length > 0
      ? `Śnieg (${snowDays.length} d.)`
      : blackIceDays.length > 0
      ? `Ryzyko gołoledzi (${blackIceDays.length} d.)`
      : coldRainDays.length > 0
      ? `Zimny deszcz (${coldRainDays.length} d.)`
      : 'Brak zagrożeń zimowych';

  const factorPrecip: VerdictFactor = {
    id: 'precip_ice',
    label: 'Opady, śnieg i gołoledź',
    valueText: precipText,
    level: f3Level,
    levelLabel:
      f3Level === 'winter'
        ? 'Wysokie ryzyko'
        : f3Level === 'caution'
        ? 'Mokra i zimna'
        : 'Warunki stabilne',
    detail:
      f3Level === 'winter'
        ? 'Wykryto opady śniegu lub ryzyko gołoledzi. Eksperci PZPO i ADAC bezwzględnie zalecają opony zimowe (3PMSF).'
        : f3Level === 'caution'
        ? 'Deszcz przy temperaturze poniżej 7°C znacząco wydłuża drogę hamowania na oponach letnich.'
        : 'W 7-dniowej prognozie brak opadów śniegu, marznącego deszczu oraz ryzyka gołoledzi.',
  };

  // Factor 4: 15-day thermal trend (history vs forecast)
  const f4Level: VerdictFactor['level'] =
    past7Avg < EXPERT_TEMP_THRESHOLD && forecast7Avg < EXPERT_TEMP_THRESHOLD
      ? 'winter'
      : past7Avg >= 9 && forecast7Avg >= 9
      ? 'summer'
      : 'caution';

  const trendSign = trendDelta > 0 ? '+' : '';
  const trendLabel =
    trendDelta <= -2
      ? 'Wyraźne ochłodzenie'
      : trendDelta >= 2
      ? 'Wyraźne ocieplenie'
      : 'Trend stabilny';

  const factorTrend: VerdictFactor = {
    id: 'history_trend',
    label: 'Trend 7 dni wstecz vs prognoza',
    valueText: `${past7Avg.toFixed(1)}°C → ${forecast7Avg.toFixed(1)}°C (${trendSign}${trendDelta.toFixed(1)}°C)`,
    level: f4Level,
    levelLabel: trendLabel,
    detail:
      f4Level === 'winter'
        ? `Chłód utrzymuje się trwale (${pastDaysBelow7}/7 dni wstecz poniżej 7°C) — to nie chwilowe załamanie pogody.`
        : f4Level === 'summer'
        ? 'Zarówno ostatni tydzień, jak i prognoza potwierdzają stabilne warunki letnie.'
        : trendDelta < 0
        ? 'Temperatura systematycznie spada w kierunku progu 7°C — dobry moment na rezerwację terminu bez kolejek.'
        : 'Temperatura rośnie, ale przed zmianą na letnie upewnij się, że minęło ryzyko porannych przymrozków.',
  };

  const factors = [factorThreshold, factorDrivingWindow, factorPrecip, factorTrend];

  // Determine overall verdict status
  const severeWinterTrigger =
    snowDays.length > 0 ||
    blackIceDays.length > 0 ||
    frostDays.length >= 2 ||
    (forecast7Avg < EXPERT_TEMP_THRESHOLD && forecastDaysBelow7 >= 4) ||
    (forecastDrivingAvg < 5.5 && forecastDrivingMin <= 1);

  const solidSummerTrigger =
    snowDays.length === 0 &&
    blackIceDays.length === 0 &&
    frostDays.length === 0 &&
    nearFrostDays.length === 0 &&
    forecast7Avg >= 9.5 &&
    forecastDrivingAvg >= 8 &&
    forecastDaysBelow7 === 0 &&
    past7Avg >= 7.5;

  let status: VerdictStatus;
  let recommendedTire: TireVerdict['recommendedTire'];
  let headline: string;
  let summary: string;
  let actionGuidance: string;

  if (severeWinterTrigger) {
    status = 'winter';
    recommendedTire = 'Opony zimowe';
    headline = 'Czas na opony zimowe';
    summary =
      snowDays.length > 0 || blackIceDays.length > 0
        ? `Prognoza dla lokalizacji ${dataset.location.name} wskazuje opady śniegu lub ryzyko gołoledzi przy temperaturach spadających do ${forecastDrivingMin.toFixed(1)}°C w porze jazdy.`
        : `Średnia temperatura prognozy (${forecast7Avg.toFixed(1)}°C) oraz chłód w wybranych godzinach jazdy (min. ${forecastDrivingMin.toFixed(1)}°C) spełniają kryteria PZPO i ADAC dla ogumienia zimowego.`;
    actionGuidance =
      'Jeśli nadal jeździsz na oponach letnich, umów wymianę jak najszybciej. Na oponach zimowych zachowasz pełną elastyczność mieszanki i krótszą drogę hamowania.';
  } else if (solidSummerTrigger) {
    status = 'summer';
    recommendedTire = 'Opony letnie';
    headline = 'Bezpieczne warunki dla opon letnich';
    summary = `Średnia temperatura w ostatnich 7 dniach (${past7Avg.toFixed(1)}°C) i prognozie (${forecast7Avg.toFixed(1)}°C) stabilnie przekracza 7°C, bez nocnych przymrozków i zagrożeń zimowych.`;
    actionGuidance =
      'Jeśli wciąż masz założone opony zimowe, pora przejść na letnie — w wyższych temperaturach zimówki mają dłuższą drogę hamowania i szybciej ścierają bieżnik.';
  } else {
    // Transition period — distinguish cooling (autumn) vs warming (spring)
    const isCoolingTowardWinter =
      trendDelta <= -0.5 ||
      forecast7Avg < 8.5 ||
      forecastDrivingMin <= 3 ||
      (past7Avg >= EXPERT_TEMP_THRESHOLD && forecast7Avg < past7Avg);

    if (isCoolingTowardWinter) {
      status = 'transition_to_winter';
      recommendedTire = 'Okres przejściowy';
      headline = 'Okres przejściowy — zaplanuj wymianę na zimowe';
      summary = `Temperatury dla lokalizacji ${dataset.location.name} zbliżają się do granicy 7°C (prognoza śr. ${forecast7Avg.toFixed(1)}°C, min. w porze jazdy ${forecastDrivingMin.toFixed(1)}°C).`;
      actionGuidance =
        'To najlepszy moment na spokojne umówienie wizyty u wulkanizatora, zanim pojawią się przymrozki i kolejki. Jeśli jeździsz wczesnym rankiem lub w góry, zmień opony już teraz.';
    } else {
      status = 'transition_to_summer';
      recommendedTire = 'Okres przejściowy';
      headline = 'Okres przejściowy — obserwuj przed zmianą na letnie';
      summary = `Widać ocieplenie (${past7Avg.toFixed(1)}°C → ${forecast7Avg.toFixed(1)}°C), jednak poranki w profilu jazdy nadal spadają do ${forecastDrivingMin.toFixed(1)}°C lub trend nie ustabilizował się jeszcze powyżej 7°C.`;
      actionGuidance =
        'Wstrzymaj się jeszcze kilka dni ze zmianą na letnie lub zarezerwuj termin na przyszły tydzień, gdy minie ryzyko nocnych przymrozków.';
    }
  }

  return {
    status,
    recommendedTire,
    headline,
    summary,
    actionGuidance,
    past7Avg,
    forecast7Avg,
    forecastDrivingMin,
    forecastDrivingAvg,
    pastDaysBelow7,
    forecastDaysBelow7,
    forecastTotalDays: upcomingDays.length,
    trendDelta,
    factors,
    hazards,
  };
}

export function getNext48Hours(dataset: RawWeatherDataset): HourlyPoint[] {
  const currentTimePrefix = dataset.current.time.slice(0, 13); // YYYY-MM-DDTHH
  let startIdx = dataset.hourly.findIndex((p) => p.time.slice(0, 13) >= currentTimePrefix);
  if (startIdx < 0) startIdx = Math.max(0, dataset.hourly.length - 48);
  return dataset.hourly.slice(startIdx, startIdx + 48);
}
