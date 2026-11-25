import type { BrakingScenario } from '../types/weather';

export const BRAKING_SCENARIOS: BrakingScenario[] = [
  {
    id: 'wet_snow_0',
    label: 'Mokry śnieg i błoto pośniegowe (0°C)',
    shortLabel: 'Mokry śnieg · 0°C',
    temperature: 0,
    surfaceDescription: 'Ubity mokry śnieg lub błoto pośniegowe na asfalcie',
    // Grounded in PZPO / TÜV SÜD / Politechnika Rzeszowska tests (50 km/h: ~51m winter vs ~108m summer)
    distances50: { winter: 51, summer: 108 },
    distances80: { winter: 124, summer: 248 },
    winner: 'winter',
    sourceNote: 'Na podstawie testów PZPO i TÜV SÜD (hamowanie z 50 km/h na mokrym śniegu)',
    physicsExplanation:
      'Opona zimowa posiada gęstą sieć nacięć (lameli) i mieszankę bogatą w krzemionkę, która wgryza się w śnieg. Sztywna opona letnia ślizga się po warstwie błota jak narta — różnica przy 50 km/h przekracza 57 metrów.',
  },
  {
    id: 'wet_asphalt_5',
    label: 'Mokry asfalt w chłodny dzień (5°C)',
    shortLabel: 'Mokry asfalt · 5°C',
    temperature: 5,
    surfaceDescription: 'Jesienny lub wczesnowiosenny deszcz, temperatura nawierzchni ok. 4–5°C',
    distances50: { winter: 16.5, summer: 19.8 },
    distances80: { winter: 38.0, summer: 46.5 },
    winner: 'winter',
    sourceNote: 'Zestawienie testów ADAC i PZPO dla mokrej nawierzchni poniżej progu 7°C',
    physicsExplanation:
      'Poniżej 7°C mieszanka letnia zaczyna wyraźnie twardnieć i gorzej dopasowuje się do mikronierówności mokrego asfaltu. Na zimówkach zatrzymasz się przy 80 km/h średnio o ok. 8,5 m wcześniej (długość niemal dwóch aut).',
  },
  {
    id: 'dry_asphalt_5',
    label: 'Suchy asfalt w chłodny poranek (5°C)',
    shortLabel: 'Suchy asfalt · 5°C',
    temperature: 5,
    surfaceDescription: 'Czysty, całkowicie suchy asfalt przy porannej temperaturze 5°C',
    distances50: { winter: 13.8, summer: 13.4 },
    distances80: { winter: 33.2, summer: 32.1 },
    winner: 'summer',
    sourceNote: 'Niuans techniczny wskazywany przez testy ADAC na całkowicie suchej nawierzchni',
    physicsExplanation:
      'Na idealnie suchym asfalcie przy +5°C nowoczesna opona letnia wciąż hamuje bardzo dobrze — granica 7°C nie jest „magicznym wyłącznikiem”. Przewaga zimówki staje się krytyczna, gdy pojawi się wilgoć, szron lub opad.',
  },
  {
    id: 'dry_asphalt_20',
    label: 'Suchy, nagrzany asfalt latem (20°C)',
    shortLabel: 'Suchy asfalt · 20°C',
    temperature: 20,
    surfaceDescription: 'Ciepły dzień wiosenny lub letni, temperatura powietrza 20°C',
    distances50: { winter: 14.9, summer: 11.4 },
    distances80: { winter: 37.4, summer: 28.5 },
    winner: 'summer',
    sourceNote: 'Testy ADAC porównujące jazdę na oponach zimowych w wysokich temperaturach',
    physicsExplanation:
      'Miękka mieszanka zimowa w cieple staje się zbyt plastyczna, lamele uginają się podczas gwałtownego hamowania, a bieżnik zużywa się znacznie szybciej. Przy 80 km/h droga hamowania wydłuża się o blisko 9 metrów.',
  },
];

export interface CompoundCurvePoint {
  temp: number;
  label: string;
  winterGrip: number; // 0..100 relative optimal grip index
  summerGrip: number; // 0..100 relative optimal grip index
}

export const COMPOUND_CURVE_DATA: CompoundCurvePoint[] = [
  { temp: -15, label: '-15°C', winterGrip: 90, summerGrip: 18 },
  { temp: -10, label: '-10°C', winterGrip: 93, summerGrip: 24 },
  { temp: -5, label: '-5°C', winterGrip: 95, summerGrip: 33 },
  { temp: 0, label: '0°C', winterGrip: 94, summerGrip: 47 },
  { temp: 4, label: '4°C', winterGrip: 89, summerGrip: 68 },
  { temp: 7, label: '7°C', winterGrip: 83, summerGrip: 83 },
  { temp: 10, label: '10°C', winterGrip: 77, summerGrip: 90 },
  { temp: 15, label: '15°C', winterGrip: 69, summerGrip: 96 },
  { temp: 20, label: '20°C', winterGrip: 62, summerGrip: 98 },
  { temp: 25, label: '25°C', winterGrip: 56, summerGrip: 97 },
  { temp: 30, label: '30°C', winterGrip: 49, summerGrip: 94 },
];

export interface ExpertGuidelineItem {
  number: string;
  title: string;
  source: string;
  summary: string;
  keyMetric: string;
  details: string[];
}

export const EXPERT_GUIDELINES: ExpertGuidelineItem[] = [
  {
    number: '01',
    title: 'Zasada 7°C — liczy się trend, nie pojedynczy odczyt',
    source: 'PZPO · ADAC',
    summary:
      'Kluczowym sygnałem do zmiany ogumienia nie jest jednorazowy chłodny dzień ani dopiero pierwszy śnieg, lecz trwałe utrzymywanie się średniej temperatury dobowej lub temperatur porannych poniżej 7°C przez ok. 5–7 kolejnych dni.',
    keyMetric: '< 7°C przez 5–7 dni',
    details: [
      'Jesienią zwróć szczególną uwagę na temperatury między 5:00 a 8:00 rano oraz po zmroku — to wtedy asfalt wychładza się najszybciej.',
      'Wiosną warto poczekać z powrotem na opony letnie, aż średnia dobowa ustabilizuje się powyżej 7–8°C, a prognoza nie zapowiada nocnych przymrozków.',
    ],
  },
  {
    number: '02',
    title: 'Fizyka mieszanki i niuans suchej vs. mokrej jezdni',
    source: 'TÜV SÜD · ADAC',
    summary:
      'Próg 7°C jest praktycznym punktem orientacyjnym wynikającym z chemii polimerów. Opona zimowa zawiera więcej kauczuku naturalnego i krzemionki, dzięki czemu nie twardnieje na mrozie.',
    keyMetric: 'Krzemionka + gęste lamele',
    details: [
      'Na idealnie suchym asfalcie przy +5°C dobra opona letnia wciąż zachowuje przyzwoitą przyczepność, lecz w deszczu, błocie i szronie gwałtownie przegrywa z zimówką.',
      'Jazda na oponach zimowych latem (20–30°C) wydłuża hamowanie na sucho i przyspiesza zużycie bieżnika nawet o kilkadziesiąt procent.',
    ],
  },
  {
    number: '03',
    title: 'Głębokość bieżnika: bezpieczne 4 mm zamiast ustawowego 1,6 mm',
    source: 'ADAC · PZPO',
    summary:
      'Choć polskie przepisy dopuszczają minimalną głębokość bieżnika 1,6 mm, testy hamowania wykazują, że opona zimowa poniżej 4 mm traci zdolność odprowadzania błota pośniegowego i wgryzania się w śnieg.',
    keyMetric: '4 mm (zima) · 3 mm (lato)',
    details: [
      'Dla opon zimowych eksperci ADAC i PZPO zalecają wymianę na nowe już przy głębokości bieżnika 4 mm.',
      'Dla opon letnich bezpieczną granicą zachowania odporności na aquaplaning podczas ulewy są 3 mm bieżnika.',
    ],
  },
  {
    number: '04',
    title: 'Oznaczenie alpejskie 3PMSF oraz kwestia opon całorocznych',
    source: 'Regulamin EKG ONZ nr 117 · PZPO',
    summary:
      'Prawdziwa opona zimowa (lub pełnowartościowa całoroczna) musi posiadać symbol alpejski 3PMSF (trzy szczyty górskie ze śnieżynką), który potwierdza zaliczenie znormalizowanych testów przyczepności na śniegu.',
    keyMetric: 'Symbol 3PMSF (obowiązkowy test)',
    details: [
      'Samo oznaczenie M+S (Mud + Snow) jest wyłącznie deklaracją producenta bez certyfikowanych testów zimowych — w krajach takich jak Niemcy nie spełnia wymogów opony zimowej.',
      'Opony całoroczne z 3PMSF sprawdzają się przy umiarkowanych przebiegach miejskich, lecz w górach i na długich trasach autostradowych dwa komplety sezonowe nadal zapewniają najwyższy margines bezpieczeństwa.',
    ],
  },
];

export function calculateResidualSpeedKmh(
  initialSpeedKmh: number,
  shorterDistM: number,
  longerDistM: number
): number {
  if (longerDistM <= shorterDistM) return 0;
  // Kinematic approximation: v_rem = v0 * sqrt(1 - d_short / d_long)
  const ratio = Math.max(0, 1 - shorterDistM / longerDistM);
  return Math.round(initialSpeedKmh * Math.sqrt(ratio));
}
