export interface IOpenWeatherResponse {
    lat: number;
    lon: number;
    timezone: string;
    timezone_offset: number;
    current: ICurrentWeather;
    minutely: IMinutelyWeather[];
    hourly: IHourlyWeather[];
    daily: IDailyWeather[];
    alerts?: IWeatherAlert[];
  }
  
  export interface ICurrentWeather {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: IWeatherCondition[];
  }
  
  export interface IMinutelyWeather {
    dt: number;
    precipitation: number;
  }
  
  export interface IHourlyWeather {
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: IWeatherCondition[];
    pop: number; // Probability of precipitation
  }
  
  export interface IDailyWeather {
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    summary: string;
    temp: ITemperature;
    feels_like: IFeelsLike;
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: IWeatherCondition[];
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
  }
  
  export interface ITemperature {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  }
  
  export interface IFeelsLike {
    day: number;
    night: number;
    eve: number;
    morn: number;
  }
  
  export interface IWeatherCondition {
    id: number;
    main: string;
    description: string;
    icon: string;
  }
  
  export interface IWeatherAlert {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
  }
  