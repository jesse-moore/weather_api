import { IOpenWeatherResponse } from "../interfaces/openWeatherInterfaces";
import { calculateDayPeriod, calculateDayPeriodRange } from "../services/sunPositionService";
import { PeriodOfDay } from "./periodOfDayDTO";

export class CurrentWeatherResponseDTO {
  dateTime: number;
  cloudCover: number;
  condition: string;
  conditionDescription: string;
  icon: string;
  iconConditionCode: number;
  dewPoint?: number | null;
  feelsLike?: number | null;
  humidity: number | null;
  pressure: number | null;
  temp: number;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  precipitationType: "Rain" | "Snow";
  windDirection: number;
  windGust: number;
  windSpeed: number;
  uvi: number;
  visibility: number;
  periodOfDay: PeriodOfDay;

  constructor(weatherData: IOpenWeatherResponse) {
    this.dateTime = weatherData.current.dt;
    this.cloudCover = weatherData.current.clouds;
    this.condition = weatherData.current.weather[0].main;
    this.condition = weatherData.current.weather[0].description;
    this.icon = weatherData.current.weather[0].icon;
    this.iconConditionCode = weatherData.current.weather[0].id;
    this.dewPoint = weatherData.current.dew_point;
    this.feelsLike = weatherData.current.feels_like;
    this.humidity = weatherData.current.humidity;
    this.pressure = weatherData.current.pressure;
    this.temp = weatherData.current.temp;
    this.maxTemp = weatherData.daily[0].temp.max;
    this.minTemp = weatherData.daily[0].temp.min;
    this.precipitation = weatherData.daily[0].pop;
    this.precipitationType = weatherData.daily[0].rain ? "Rain" : weatherData.daily[0].snow ? "Snow" : null;
    this.windDirection = weatherData.current.wind_deg;
    this.windGust = weatherData.current.wind_gust;
    this.windSpeed = weatherData.current.wind_speed;
    this.uvi = weatherData.current.uvi;
    this.visibility = weatherData.current.visibility;
    this.periodOfDay = calculateDayPeriod(weatherData.current.dt, weatherData.lat, weatherData.lon);
  }
}
