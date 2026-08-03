import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

type IconType = ComponentType<LucideProps>;

export type WeatherKey =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm"
  | "unknown";

export function describeWeather(code: number): { key: WeatherKey; Icon: IconType } {
  if (code === 0) return { key: "clear", Icon: Sun };
  if ([1, 2].includes(code)) return { key: "partly_cloudy", Icon: CloudSun };
  if (code === 3) return { key: "cloudy", Icon: Cloud };
  if ([45, 48].includes(code)) return { key: "fog", Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { key: "drizzle", Icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { key: "rain", Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { key: "snow", Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { key: "storm", Icon: CloudLightning };
  return { key: "unknown", Icon: Cloud };
}
