import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { LogLevel } from "../dtos/logDTO";
import { ICurrentWeatherParams } from "../interfaces";
import { insertLog } from "../services/loggerService";
import { getCurrentWeather, validateCurrentWeatherQueryParams } from "../services/weatherService";

export async function getCurrentWeatherTrigger(request: HttpRequest): Promise<HttpResponseInit> {
  const location = request.query.get("location");

  if (!location) {
    const missingParams = Object.entries({ location })
      .filter((p) => !p[1])
      .map((p) => p[0])
      .join(", ");

    await insertLog({
      level: LogLevel.WARN,
      message: `Missing query params: ${missingParams}`,
      category: "weather",
    });

    return {
      status: 400,
      body: `Missing query params: ${missingParams}`,
    };
  }

  const [lat, lon] = location.split(",");
  const weatherParams: ICurrentWeatherParams = {
    lat: Number(lat),
    lon: Number(lon),
  };

  const validateParamsResult = validateCurrentWeatherQueryParams(weatherParams);
  if (validateParamsResult) {
    await insertLog({
      level: LogLevel.WARN,
      message: `Invalid query params: ${JSON.stringify(weatherParams)}`,
      category: "weather",
    });

    return {
      status: 400,
      body: `Invalid query params: ${validateParamsResult.join(", ")}`,
    };
  }

  try {
    const weatherResult = await getCurrentWeather(weatherParams);
    return { jsonBody: weatherResult };
  } catch (error) {
    await insertLog({
      level: LogLevel.ERROR,
      message: error,
      category: "weather",
    });
    return { status: 400, body: error };
  }
}