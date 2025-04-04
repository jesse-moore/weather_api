import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { LogLevel } from "../dtos/logDTO";
import { IWeatherPeriodParams } from "../dtos/weatherPeriodRequestDTO";
import { insertLog } from "../services/loggerService";
import { getWeatherPeriod, validateWeatherPeriodQueryParams } from "../services/weatherService";

export async function getWeatherPeriodTrigger(request: HttpRequest): Promise<HttpResponseInit> {
  const location = request.query.get("location");
  const dateStart = request.query.get("dateStart");
  const dateEnd = request.query.get("dateEnd");

  if (!location || !dateStart || !dateEnd) {
    const missingParams = Object.entries({ location, dateStart, dateEnd })
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
  const weatherParams: IWeatherPeriodParams = {
    lat: Number(lat),
    lon: Number(lon),
    dt: Number(dateStart),
    dtEnd: Number(dateEnd),
  };

  const validateParamsResult = validateWeatherPeriodQueryParams(weatherParams);
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
    const weatherResult = await getWeatherPeriod(weatherParams);
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
