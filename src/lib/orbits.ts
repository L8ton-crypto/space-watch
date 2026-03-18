import { twoline2satrec, propagate, gstime, eciToGeodetic, degreesLat, degreesLong } from "satellite.js";
import { SatelliteData, latLngToVector3 } from "./satellites";

export interface OrbitPoint {
  position: [number, number, number];
  time: Date;
}

// Generate orbit trail points for a satellite
// Calculates positions over one full orbit period
export function getOrbitTrail(sat: SatelliteData, now: Date, points: number = 120): OrbitPoint[] {
  try {
    const satrec = twoline2satrec(sat.tle1, sat.tle2);

    // Get orbital period from mean motion (rev/day)
    const meanMotion = parseFloat(sat.tle2.substring(52, 63));
    const periodMinutes = (24 * 60) / meanMotion;

    const trail: OrbitPoint[] = [];
    const stepMs = (periodMinutes * 60 * 1000) / points;

    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() + i * stepMs);
      const posVel = propagate(satrec, time);

      if (!posVel.position || typeof posVel.position === "boolean") continue;

      const gmst = gstime(time);
      const geo = eciToGeodetic(posVel.position, gmst);

      const lat = degreesLat(geo.latitude);
      const lng = degreesLong(geo.longitude);
      const alt = geo.height;

      trail.push({
        position: latLngToVector3(lat, lng, alt),
        time,
      });
    }

    return trail;
  } catch {
    return [];
  }
}
