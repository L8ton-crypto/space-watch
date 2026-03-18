import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  eciToEcf,
  degreesLong,
  degreesLat,
} from "satellite.js";

export interface SatelliteData {
  name: string;
  id: string;
  tle1: string;
  tle2: string;
  category: string;
  description?: string;
}

export interface SatellitePosition {
  name: string;
  id: string;
  lat: number;
  lng: number;
  alt: number; // km
  category: string;
  description?: string;
  velocity?: number; // km/s
}

// Well-known satellite descriptions
const DESCRIPTIONS: Record<string, string> = {
  "ISS (ZARYA)": "International Space Station - 7 crew members, orbiting at 17,500 mph since 1998",
  "ISS": "International Space Station - 7 crew members, orbiting at 17,500 mph since 1998",
  "HST": "Hubble Space Telescope - capturing the universe since 1990",
  "HUBBLE": "Hubble Space Telescope - capturing the universe since 1990",
  "TIANGONG": "China's space station - 3 crew members aboard",
  "CSS (TIANHE)": "China's Tianhe core module - the backbone of their space station",
  "TERRA": "NASA Earth-observing satellite - monitoring climate since 1999",
  "AQUA": "NASA water cycle research satellite - studying Earth's water systems",
  "NOAA 19": "Weather satellite - powering your weather forecasts",
  "GOES 16": "Geostationary weather sat - watches half the Earth at once",
  "GOES 17": "Geostationary weather sat - US West Coast coverage",
  "JAMES WEBB": "James Webb Space Telescope - peering at the dawn of the universe",
  "JWST": "James Webb Space Telescope - peering at the dawn of the universe",
};

function getDescription(name: string): string {
  const upper = name.toUpperCase();
  for (const [key, desc] of Object.entries(DESCRIPTIONS)) {
    if (upper.includes(key)) return desc;
  }
  if (upper.includes("STARLINK")) return "SpaceX Starlink - part of the 6,000+ satellite internet constellation";
  if (upper.includes("ONEWEB")) return "OneWeb broadband satellite - global internet constellation";
  if (upper.includes("IRIDIUM")) return "Iridium communications satellite - global voice and data network";
  if (upper.includes("GPS")) return "GPS navigation satellite - helping billions find their way";
  if (upper.includes("COSMOS") || upper.includes("KOSMOS")) return "Russian military/civilian satellite";
  if (upper.includes("BEIDOU")) return "Chinese navigation satellite - China's GPS equivalent";
  if (upper.includes("GALILEO")) return "European navigation satellite - EU's GPS system";
  return "";
}

// Categories for TLE sources
const TLE_SOURCES = [
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle", category: "Space Stations" },
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle", category: "Brightest" },
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle", category: "Active" },
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle", category: "Starlink" },
];

export function parseTLE(text: string, category: string): SatelliteData[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const sats: SatelliteData[] = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const tle1 = lines[i + 1];
    const tle2 = lines[i + 2];

    if (!tle1?.startsWith("1 ") || !tle2?.startsWith("2 ")) continue;

    const id = tle1.substring(2, 7).trim();
    sats.push({
      name: name.trim(),
      id,
      tle1,
      tle2,
      category,
      description: getDescription(name),
    });
  }

  return sats;
}

export function getSatellitePosition(sat: SatelliteData, date: Date): SatellitePosition | null {
  try {
    const satrec = twoline2satrec(sat.tle1, sat.tle2);
    const posVel = propagate(satrec, date);

    if (!posVel.position || typeof posVel.position === "boolean") return null;

    const gmst = gstime(date);
    const geo = eciToGeodetic(posVel.position, gmst);

    let velocity: number | undefined;
    if (posVel.velocity && typeof posVel.velocity !== "boolean") {
      const v = posVel.velocity;
      velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    return {
      name: sat.name,
      id: sat.id,
      lat: degreesLat(geo.latitude),
      lng: degreesLong(geo.longitude),
      alt: geo.height,
      category: sat.category,
      description: sat.description,
      velocity,
    };
  } catch {
    return null;
  }
}

export function latLngToVector3(lat: number, lng: number, alt: number, earthRadius: number = 1): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = earthRadius + alt / 6371; // Scale altitude

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

export async function fetchTLEData(): Promise<SatelliteData[]> {
  // Fetch space stations and bright objects for MVP
  const sources = TLE_SOURCES; // all categories including Starlink
  const allSats: SatelliteData[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    try {
      const res = await fetch(source.url);
      if (!res.ok) continue;
      const text = await res.text();
      let sats = parseTLE(text, source.category);

      // Cap Starlink to 200 to keep performance sane
      // (full constellation is 6000+)
      if (source.category === "Starlink") {
        sats = sats.slice(0, 200);
      }

      // Cap Active to 300 (it's a huge list)
      if (source.category === "Active") {
        sats = sats.slice(0, 300);
      }

      for (const sat of sats) {
        if (!seen.has(sat.id)) {
          seen.add(sat.id);
          allSats.push(sat);
        }
      }
    } catch {
      console.warn(`Failed to fetch ${source.category}`);
    }
  }

  return allSats;
}

// Calculate if satellite is visible from a location
export function isVisibleFrom(
  satPos: SatellitePosition,
  observerLat: number,
  observerLng: number,
  maxDistance: number = 2000 // km
): boolean {
  const R = 6371;
  const dLat = (satPos.lat - observerLat) * Math.PI / 180;
  const dLng = (satPos.lng - observerLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(observerLat * Math.PI / 180) * Math.cos(satPos.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= maxDistance;
}
