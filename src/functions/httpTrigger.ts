import { app } from "@azure/functions";
import { getCurrentWeatherTrigger } from "./getCurrentWeatherTrigger";
import { getWeatherPeriodTrigger } from "./getWeatherPeriodTrigger";

app.http("getWeatherPeriod", {
  methods: ["GET"],
  authLevel: "function",
  handler: getWeatherPeriodTrigger,
});

app.http("getCurrentWeather", {
  methods: ["GET"],
  authLevel: "function",
  handler: getCurrentWeatherTrigger,
});
