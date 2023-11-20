export interface IVisualCrossingWeatherResponseDTO {
  queryCost: number;
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  address: string;
  timezone: string;
  tzoffset: number;
  description: string;
  days: IVisualCrossingDay[];
  alerts: any[];
  stations: { [key: string]: IVisualCrossingStation };
  currentConditions: IVisualCrossingCurrentConditions;
}

export interface IVisualCrossingDay {
  datetime: string;
  datetimeEpoch: number;
  tempmax: number;
  tempmin: number;
  temp: number;
  feelslikemax: number;
  feelslikemin: number;
  feelslike: number;
  dew: number;
  humidity: number;
  precip: number;
  precipprob: number;
  precipcover: number;
  preciptype: string[];
  snow: number;
  snowdepth: number;
  windgust: number;
  windspeed: number;
  winddir: number;
  pressure: number;
  cloudcover: number;
  visibility: number;
  solarradiation: number;
  solarenergy: number;
  uvindex: number;
  severerisk: number;
  sunrise: string;
  sunriseEpoch: number;
  sunset: string;
  sunsetEpoch: number;
  moonphase: number;
  conditions: string;
  description: string;
  icon: string;
  stations: string[];
  source: string;
  hours: IVisualCrossingHour[];
}

export interface IVisualCrossingHour {
  datetime: string;
  datetimeEpoch: number;
  temp: number | null;
  feelslike: number | null;
  humidity: number | null;
  dew: number | null;
  precip: number | null;
  precipprob: number | null;
  snow: number | null;
  snowdepth: number | null;
  preciptype: string[] | null;
  windgust: number | null;
  windspeed: number | null;
  winddir: number | null;
  pressure: number | null;
  visibility: number | null;
  cloudcover: number | null;
  solarradiation: number | null;
  solarenergy: number | null;
  uvindex: number | null;
  severerisk: number | null;
  conditions: string | null;
  icon: string | null;
  stations: string[] | null;
  source: string | null;
}

export interface IVisualCrossingStation {
  distance: number;
  latitude: number;
  longitude: number;
  useCount: number;
  id: string;
  name: string;
  quality: number;
  contribution: number;
}

export interface IVisualCrossingCurrentConditions extends Omit<IVisualCrossingHour, 'datetime' | 'datetimeEpoch'> {
  sunrise: string;
  sunriseEpoch: number;
  sunset: string;
  sunsetEpoch: number;
  moonphase: number;
}
