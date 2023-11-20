import { PeriodOfDay } from "../dtos/WeatherPeriodResponseDTO";

const PI = Math.PI;
const rad = PI / 180;
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;
const J0 = 0.0009;
const e = rad * 23.4397; // Obliquity of the Earth

// Helper Functions
const toJulian = (date: Date): number => date.valueOf() / dayMs - 0.5 + J1970;

const fromJulian = (j: number): Date => new Date((j + 0.5 - J1970) * dayMs);

const toDays = (date: Date): number => toJulian(date) - J2000;

const isWithinRange = (date1Start: number, date1End: number, date2Start: number, date2End: number): boolean => {
  if (date1Start > date1End) {
    [date1Start, date1End] = [date1End, date1Start];
  }
  if (date2Start > date2End) {
    [date2Start, date2End] = [date2End, date2Start];
  }

  return date1Start <= date2End && date1End >= date2Start;
};

const rightAscension = (l: number, b: number): number => {
  return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
};

const declination = (l: number, b: number): number => {
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
};

const azimuth = (H: number, phi: number, dec: number): number => {
  return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
};

const altitude = (H: number, phi: number, dec: number): number => {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
};

const siderealTime = (d: number, lw: number): number => {
  return rad * (280.16 + 360.9856235 * d) - lw;
};

const solarMeanAnomaly = (d: number): number => {
  return rad * (357.5291 + 0.98560028 * d);
};

const eclipticLongitude = (M: number): number => {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + PI;
};

const sunCoords = (d: number): { dec: number; ra: number } => {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
};

const observerAngle = (height: number): number => {
  return (-2.076 * Math.sqrt(height)) / 60;
};

const julianCycle = (d: number, lw: number): number => {
  return Math.round(d - J0 - lw / (2 * PI));
};

const approxTransit = (Ht: number, lw: number, n: number): number => {
  return J0 + (Ht + lw) / (2 * PI) + n;
};

const calculateJulianNoon = (ds: number, M: number, L: number): number => {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
};

const hourAngle = (h: number, phi: number, d: number): number => {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
};

const calculateJulianDate = (
  h: number,
  lw: number,
  phi: number,
  dec: number,
  n: number,
  M: number,
  L: number
): number => {
  const w = hourAngle(h, phi, dec),
    a = approxTransit(w, lw, n);
  return calculateJulianNoon(a, M, L);
};

const getPosition = (date: Date, lat: number, lng: number): { azimuth: number; altitude: number } => {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);

  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;

  return {
    azimuth: azimuth(H, phi, c.dec),
    altitude: altitude(H, phi, c.dec),
  };
};

const periods: [number, PeriodOfDay, PeriodOfDay][] = [
  [-0.833, PeriodOfDay.Sunrise, PeriodOfDay.Sunset],
  [-6, PeriodOfDay.CivilTwilightDawn, PeriodOfDay.CivilTwilightDusk],
  [-12, PeriodOfDay.NauticalTwilightDawn, PeriodOfDay.NauticalTwilightDusk],
  [6, PeriodOfDay.GoldenHourDawn, PeriodOfDay.GoldenHourDusk],
];

export const calculateDayPeriods = (
  date: Date,
  lat: number,
  lng: number,
  height = 0
): Partial<Record<PeriodOfDay, { date: Date; epoch: number }>> => {
  const lw = rad * -lng,
    phi = rad * lat,
    dh = observerAngle(height),
    d = toDays(date),
    n = julianCycle(d, lw),
    ds = approxTransit(0, lw, n),
    M = solarMeanAnomaly(ds),
    L = eclipticLongitude(M),
    dec = declination(L, 0),
    JulianNoon = calculateJulianNoon(ds, M, L);
  const dayPeriods: Partial<Record<PeriodOfDay, { date: Date; epoch: number }>> = {};

  periods.forEach(([degrees, dawn, dusk]) => {
    const h0 = (degrees + dh) * rad;
    const Jset = calculateJulianDate(h0, lw, phi, dec, n, M, L);
    const Jrise = JulianNoon - (Jset - JulianNoon);

    const dayPeriodDawn = fromJulian(Jrise);
    const dayPeriodDusk = fromJulian(Jset);
    dayPeriods[dawn] = { date: dayPeriodDawn, epoch: dayPeriodDawn.valueOf() / 1000 };
    dayPeriods[dusk] = { date: dayPeriodDusk, epoch: dayPeriodDusk.valueOf() / 1000 };
  });

  return dayPeriods;
};

export const calculateDayPeriod = (epoch: number, lat: number, lng: number, height = 0): PeriodOfDay => {
  const dayPeriods = calculateDayPeriods(new Date(epoch * 1000), lat, lng, height);
  const epochNTDawn = dayPeriods[PeriodOfDay.NauticalTwilightDawn].epoch,
    epochCTDawn = dayPeriods[PeriodOfDay.CivilTwilightDawn].epoch,
    epochDawn = dayPeriods[PeriodOfDay.Sunrise].epoch,
    epochGHDawn = dayPeriods[PeriodOfDay.GoldenHourDawn].epoch,
    epochGHDusk = dayPeriods[PeriodOfDay.GoldenHourDusk].epoch,
    epochDusk = dayPeriods[PeriodOfDay.Sunset].epoch,
    epochCTDusk = dayPeriods[PeriodOfDay.CivilTwilightDusk].epoch,
    epochNTDusk = dayPeriods[PeriodOfDay.NauticalTwilightDusk].epoch;

  if (epoch < epochNTDawn || epoch > epochNTDusk) return PeriodOfDay.Night;

  if (epoch > epochNTDawn && epoch < epochCTDawn) return PeriodOfDay.NauticalTwilightDawn;

  if (epoch > epochCTDawn && epoch < epochDawn) return PeriodOfDay.CivilTwilightDawn;

  if (epoch > epochDawn && epoch < epochGHDawn) return PeriodOfDay.GoldenHourDawn;

  if (epoch > epochGHDawn && epoch < epochGHDusk) return PeriodOfDay.Day;

  if (epoch > epochGHDusk && epoch < epochDusk) return PeriodOfDay.GoldenHourDusk;

  if (epoch > epochDusk && epoch < epochCTDusk) return PeriodOfDay.CivilTwilightDusk;

  if (epoch > epochCTDusk && epoch < epochNTDusk) return PeriodOfDay.NauticalTwilightDusk;
};

export const calculateDayPeriodRange = (
  epochStart: number,
  epochEnd: number,
  lat: number,
  lng: number,
  height = 0
): PeriodOfDay[] => {
  const dateStart = new Date(epochStart * 1000);
  dateStart.setHours(0, 0, 0);
  const dateEnd = new Date(epochEnd * 1000);
  dateEnd.setHours(23, 59, 59);
  const dates: Date[] = [];
  let currentDate = new Date(dateStart);
  currentDate.setHours(12);
  while (currentDate <= dateEnd) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const periodsSet = new Set<PeriodOfDay>();
  dates.forEach((date) => {
    const dayPeriods = calculateDayPeriods(date, lat, lng, height);
    const epochNTDawn = dayPeriods[PeriodOfDay.NauticalTwilightDawn].epoch,
      epochCTDawn = dayPeriods[PeriodOfDay.CivilTwilightDawn].epoch,
      epochDawn = dayPeriods[PeriodOfDay.Sunrise].epoch,
      epochGHDawn = dayPeriods[PeriodOfDay.GoldenHourDawn].epoch,
      epochGHDusk = dayPeriods[PeriodOfDay.GoldenHourDusk].epoch,
      epochDusk = dayPeriods[PeriodOfDay.Sunset].epoch,
      epochCTDusk = dayPeriods[PeriodOfDay.CivilTwilightDusk].epoch,
      epochNTDusk = dayPeriods[PeriodOfDay.NauticalTwilightDusk].epoch;

    const dayStart = date;
    dayStart.setHours(0, 0, 0);
    const dayEnd = date;
    dayEnd.setHours(23, 59, 59);
    if (isWithinRange(dayStart.valueOf(), epochNTDawn, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.Night);

    if (isWithinRange(epochNTDawn, epochCTDawn, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.NauticalTwilightDawn);

    if (isWithinRange(epochCTDawn, epochDawn, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.CivilTwilightDawn);
    if (isWithinRange(epochDawn, epochGHDawn, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.GoldenHourDawn);
    if (isWithinRange(epochGHDawn, epochGHDusk, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.Day);
    if (isWithinRange(epochGHDusk, epochDusk, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.GoldenHourDusk);
    if (isWithinRange(epochDusk, epochCTDusk, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.CivilTwilightDusk);
    if (isWithinRange(epochCTDusk, epochNTDusk, epochStart, epochEnd)) periodsSet.add(PeriodOfDay.NauticalTwilightDusk);
    if (isWithinRange(epochNTDusk, dayEnd.valueOf(), epochStart, epochEnd))
      periodsSet.add(PeriodOfDay.CivilTwilightDawn);
  });

  return Array.from(periodsSet);
};
