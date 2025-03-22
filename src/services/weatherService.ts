import { WeatherPeriodResponseDTO } from "../dtos/weatherPeriodResponseDTO";
import { IVisualCrossingWeatherResponseDTO } from "../dtos/visualCrossingWeatherResponseDTO";
import { IWeatherPeriodParams } from "../dtos/weatherPeriodRequestDTO";
import {
  adjustEpoch,
  average,
  isValidEpoch,
  isValidLatitude,
  isValidLongitude,
  max,
  min,
  toFixed,
} from "./helpersService";
import { calculateDayPeriodRange } from "./sunPositionService";
import { CurrentWeatherResponseDTO } from "../dtos/currentWeatherResponseDTO";
import { ICurrentWeatherParams } from "../interfaces";
import { IOpenWeatherResponse } from "../interfaces/openWeatherInterfaces";

const VISUAL_CROSSING_WEATHER_URI = process.env["VISUAL_CROSSING_WEATHER_URI"];
if (!VISUAL_CROSSING_WEATHER_URI) throw new Error("Missing Visual Crossing Weather URI");
const VISUAL_CROSSING_WEATHER_API_KEY = process.env["VISUAL_CROSSING_WEATHER_API_KEY"];
if (!VISUAL_CROSSING_WEATHER_API_KEY) throw new Error("Missing Visual Crossing Weather API Key");
const OPEN_WEATHER_URI = process.env["OPEN_WEATHER_URI"];
if (!OPEN_WEATHER_URI) throw new Error("Missing Open Weather URI");
const OPEN_WEATHER_API_KEY = process.env["OPEN_WEATHER_API_KEY"];
if (!OPEN_WEATHER_API_KEY) throw new Error("Missing Open Weather API Key");

export const getWeatherPeriod = async (request: IWeatherPeriodParams): Promise<WeatherPeriodResponseDTO> => {
  const nodeQueryString = require("node:querystring");
  const queryString = nodeQueryString.stringify({
    unitGroup: "metric",
    key: VISUAL_CROSSING_WEATHER_API_KEY,
    include: "obs,hours,current,days",
    iconSet: "icons2",
  });
  const url = `${VISUAL_CROSSING_WEATHER_URI}/${request.lat},${request.lon}/${request.dt}/${request.dtEnd}?${queryString}`;
  const response = await fetch(url, { method: "GET" });
  if (response.status !== 200) {
    const error = await response.text();
    throw new Error(error);
  }

  const weatherResponse = (await response.json()) as IVisualCrossingWeatherResponseDTO;
  const weatherData = parseWeatherPeriodResponse(request, weatherResponse);
  return weatherData;
};

export const getCurrentWeather = async (request: ICurrentWeatherParams): Promise<CurrentWeatherResponseDTO> => {
  const nodeQueryString = require("node:querystring");
  const queryString = nodeQueryString.stringify({
    lat: request.lat,
    lon: request.lon,
    appid: OPEN_WEATHER_API_KEY,
    units: "metric",
    exclude: "minutely,hourly",
  });
  const url = `${OPEN_WEATHER_URI}?${queryString}`;
  const response = await fetch(url, { method: "GET" });
  if (response.status !== 200) {
    const error = await response.text();
    throw new Error(error);
  }

  const weatherResponse = (await response.json()) as IOpenWeatherResponse;
  return new CurrentWeatherResponseDTO(weatherResponse);
};

const parseWeatherPeriodResponse = (request: IWeatherPeriodParams, weatherResponse: IVisualCrossingWeatherResponseDTO) => {
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

export const validateWeatherPeriodQueryParams = (request: IWeatherPeriodParams): string[] | void => {
  const errors = [];
  if (!isValidLatitude(request.lat)) errors.push("lat");
  if (!isValidLongitude(request.lon)) errors.push("lon");
  if (!isValidEpoch(request.dt)) errors.push("dt");
  if (!isValidEpoch(request.dtEnd)) errors.push("dtEnd");
  if (request.dt > request.dtEnd) errors.push("dtEnd");
  return errors.length > 0 ? errors : undefined;
};

export const validateCurrentWeatherQueryParams = (request: ICurrentWeatherParams): string[] | void => {
  const errors = [];
  if (!isValidLatitude(request.lat)) errors.push("lat");
  if (!isValidLongitude(request.lon)) errors.push("lon");
  if (!isValidEpoch(request.dt)) errors.push("dt");
  return errors.length > 0 ? errors : undefined;
};
