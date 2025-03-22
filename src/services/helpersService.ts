export function isValidLatitude(lat: number): boolean {
  return !Number.isNaN(lat) && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lon: number): boolean {
  return !Number.isNaN(lon) && lon >= -180 && lon <= 180;
}

export function isValidEpoch(epoch: number): boolean {
  if (Number.isNaN(epoch)) return false;
  const date = new Date(1356998400000);
  const now = new Date();
  return epoch >= date.getTime() / 1000 && epoch <= now.getTime() / 1000;
}

export function toFixed(num: number, places: number): number {
  return Number((num ?? 0).toFixed(places ?? 0));
}

export function max(a?: number | null, b?: number | undefined): number | undefined {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return undefined;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return a < b ? b : a;
}

export function min(a?: number | null, b?: number | undefined): number | undefined {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return undefined;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return a > b ? b : a;
}

export function average(a?: number | null, b?: number | undefined): number | undefined {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return undefined;
  if (a === null || a === undefined) return b;
  if (b === null || b === undefined) return a;
  return (a + b) / 2;
}

export function adjustEpoch(epoch: number, type: "start" | "end"): number {
  let date = new Date(epoch * 1000);
  if (type === "start") {
    date.getMinutes() < 30 && date.setMinutes(-1, 0);
  } else if (type === "end") {
    date.getMinutes() > 30 && date.setMinutes(59, 0);
  }
  return date.getTime() / 1000;
}
