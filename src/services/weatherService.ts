import { WeatherPeriodResponseDTO } from "../dtos/WeatherPeriodResponseDTO";
import { IVisualCrossingWeatherResponseDTO } from "../dtos/visualCrossingWeatherResponseDTO";
import { IWeatherPeriodParams } from "../dtos/weatherPeriodRequestDTO";
import { calculateDayPeriodRange } from "./sunPositionService";

const WEATHER_URI = process.env["WEATHER_URI"];
if (!WEATHER_URI) throw new Error("Missing Weather URI");
const WEATHER_API_KEY = process.env["WEATHER_API_KEY"];
if (!WEATHER_API_KEY) throw new Error("Missing Weather API Key");

export const getWeatherPeriod = async (request: IWeatherPeriodParams): Promise<WeatherPeriodResponseDTO> => {
  const weatherResponse = await getWeather(request);
  const weatherData = parseWeatherResponse(request, weatherResponse);
  return weatherData;
};

export const getWeather = async (request: IWeatherPeriodParams): Promise<IVisualCrossingWeatherResponseDTO> => {
  const nodeQueryString = require("node:querystring");
  const queryString = nodeQueryString.stringify({
    unitGroup: "metric",
    key: WEATHER_API_KEY,
    include: "obs,hours,current,days",
    iconSet: "icons2",
  });
  const url = `${WEATHER_URI}/${request.lat},${request.lon}/${request.dt}/${request.dtEnd}?${queryString}`;
  const response = await fetch(url, { method: "GET" });
  if (response.status === 200) {
    const weatherData = (await response.json()) as IVisualCrossingWeatherResponseDTO;
    return weatherData;
  } else {
    const error = await response.text();
    throw new Error(error);
  }
};

const parseWeatherResponse = (request: IWeatherPeriodParams, weatherResponse: IVisualCrossingWeatherResponseDTO) => {
  const startRange = adjustEpoch(request.dt, "start");
  const endRange = adjustEpoch(request.dtEnd, "end");

  const weatherDto = new WeatherPeriodResponseDTO();
  const conditions = new Set<string>();
  const precipTypes = new Set<string>();
  const icons = new Set<string>();

  const currentConditions = weatherResponse.currentConditions?.temp && weatherResponse.currentConditions;

  const hourlyBlocks = weatherResponse.days.flatMap((day) => {
    return day.hours.filter((h) => {
      return h.datetimeEpoch >= startRange && h.datetimeEpoch <= endRange && h.temp !== null;
    });
  });

  [...hourlyBlocks, currentConditions]
    .filter((b) => b)
    .forEach((block) => {
      (block.conditions ?? "")
        .split(",")
        .filter((c) => c)
        .forEach((c) => conditions.add(c.trim()));
      icons.add(block.icon);
      (block.preciptype ?? []).forEach((t) => precipTypes.add(t));
      weatherDto.cloudCover = toFixed(average(weatherDto.cloudCover, block.cloudcover ?? 0), 0);
      weatherDto.dewPoint = toFixed(average(weatherDto.dewPoint, block.dew), 1);
      weatherDto.heatIndex = block.temp > 27 ? toFixed(max(weatherDto.heatIndex, block.feelslike), 0) : undefined;
      weatherDto.humidity = toFixed(average(weatherDto.humidity, block.humidity), 0);
      weatherDto.maxTemp = toFixed(max(weatherDto.maxTemp, block.temp), 0);
      weatherDto.minTemp = toFixed(min(weatherDto.minTemp, block.temp), 0);
      weatherDto.maxPressure = toFixed(max(weatherDto.maxPressure, block.pressure), 0);
      weatherDto.minPressure = toFixed(min(weatherDto.minPressure, block.pressure), 0);
      weatherDto.uvi = toFixed(max(weatherDto.uvi, block.uvindex ?? 0), 0);

      weatherDto.visibility = toFixed(min(weatherDto.visibility, block.visibility ?? 16), 0);
      weatherDto.windChill = block.temp < 5 ? toFixed(min(weatherDto.windChill, block.feelslike), 0) : undefined;
      weatherDto.windDirection = toFixed(average(weatherDto.windDirection, block.winddir), 0);
      weatherDto.windGust = toFixed(max(weatherDto.windGust, block.windgust ?? 0), 0);
      weatherDto.windSpeed = toFixed(max(weatherDto.windSpeed, block.windspeed ?? 0), 0);
      weatherDto.precip = (block.precip ?? 0) + (weatherDto.precip ?? 0);
      weatherDto.snowdepth = toFixed(average(weatherDto.snowdepth, block.snowdepth ?? 0), 0);
      weatherDto.solarradiation = toFixed(max(weatherDto.solarradiation, block.solarradiation ?? 0), 0);
      weatherDto.solarenergy = toFixed(max(weatherDto.solarenergy, block.solarenergy ?? 0), 0);
    });

  weatherDto.dateTimeStart = request.dt;
  weatherDto.dateTimeEnd = request.dtEnd;
  weatherDto.conditions = Array.from(conditions);
  weatherDto.icons = Array.from(icons);
  weatherDto.preciptype = Array.from(precipTypes);
  weatherDto.periodOfDay = calculateDayPeriodRange(request.dt, request.dtEnd, request.lat, request.lon);

  return weatherDto;
};

function adjustEpoch(epoch: number, type: "start" | "end"): number {
  let date = new Date(epoch * 1000);
  if (type === "start") {
    date.getMinutes() < 30 && date.setMinutes(-1, 0);
  } else if (type === "end") {
    date.getMinutes() > 30 && date.setMinutes(59, 0);
  }
  return date.getTime() / 1000;
}

export const validateWeatherQueryParams = (request: IWeatherPeriodParams): string[] | void => {
  const errors = [];
  if (!isValidLatitude(request.lat)) errors.push("lat");
  if (!isValidLongitude(request.lon)) errors.push("lon");
  if (!isValidEpoch(request.dt)) errors.push("dt");
  if (!isValidEpoch(request.dtEnd)) errors.push("dtEnd");
  if (request.dt > request.dtEnd) errors.push("dtEnd");
  return errors.length > 0 ? errors : undefined;
};

function isValidLatitude(lat: number): boolean {
  return !Number.isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: number): boolean {
  return !Number.isNaN(lon) && lon >= -180 && lon <= 180;
}

function isValidEpoch(epoch: number): boolean {
  if (Number.isNaN(epoch)) return false;
  const date = new Date(1356998400000);
  const now = new Date();
  return epoch >= date.getTime() / 1000 && epoch <= now.getTime() / 1000;
}

function toFixed(num: number, places: number): number {
  return Number((num ?? 0).toFixed(places ?? 0));
}

function max(a?: number | null, b?: number | undefined): number | undefined {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return undefined;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return a < b ? b : a;
}

function min(a?: number | null, b?: number | undefined): number | undefined {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return undefined;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return a > b ? b : a;
}

function average(a?: number | null, b?: number | undefined): number | undefined {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return undefined;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return (a + b) / 2;
}
