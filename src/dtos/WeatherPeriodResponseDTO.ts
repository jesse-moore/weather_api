import { PeriodOfDay } from "./periodOfDayDTO";

export class WeatherPeriodResponseDTO {
  dateTimeStart: number;
  dateTimeEnd: number;
  cloudCover: number;
  conditions: string[] = [];
  icons: string[] = [];
  dewPoint?: number | null;
  heatIndex?: number | null;
  windChill?: number | null;
  humidity: number | null;
  maxPressure: number | null;
  minPressure: number | null;
  maxTemp: number;
  minTemp: number;
  precip: number;
  preciptype: string[] | null;
  windDirection: number;
  windGust: number;
  windSpeed: number;
  uvi: number;
  visibility: number;
  snowdepth: number;
  solarradiation: number;
  solarenergy: number;
  periodOfDay: PeriodOfDay[];
}
