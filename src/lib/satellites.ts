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

// Well-known satellite descriptions with origin/purpose
// Format: "Description | Origin · Purpose"
function getDescription(name: string): string {
  const upper = name.toUpperCase();

  // === ISS - distinguish the station from debris/modules ===
  if (upper === "ISS (ZARYA)") return "International Space Station - crewed since 2000, largest structure in orbit | 🇺🇸🇷🇺🇪🇺🇯🇵🇨🇦 · Crewed research";
  if (upper === "ISS (NAUKA)") return "Russian multipurpose lab module, docked to ISS 2021 | 🇷🇺 Roscosmos · Research module";
  if (upper.includes("ISS OBJECT") || upper.includes("ISS DEB")) return "Debris or released object from the ISS | 🌍 International · Space debris";
  if (upper.startsWith("ISS") && !upper.includes("ISIS")) return "Component or object associated with the ISS | 🌍 International · Station hardware";

  // === Chinese Space Station ===
  if (upper === "CSS (TIANHE)") return "Core module of China's Tiangong space station, launched 2021 | 🇨🇳 CNSA · Crewed station core";
  if (upper === "CSS (WENTIAN)") return "Experiment module of China's space station, launched 2022 | 🇨🇳 CNSA · Research lab";
  if (upper === "CSS (MENGTIAN)") return "Experiment module of China's space station, launched 2022 | 🇨🇳 CNSA · Research lab";
  if (upper.includes("TIANZHOU")) return "Chinese cargo spacecraft supplying Tiangong station | 🇨🇳 CNSA · Cargo resupply";
  if (upper.includes("SHENZHOU")) return "Chinese crewed spacecraft | 🇨🇳 CNSA · Crew transport";
  if (upper.includes("TIANGONG")) return "China's space station | 🇨🇳 CNSA · Crewed station";

  // === Telescopes ===
  if (upper === "HST" || upper.includes("HUBBLE")) return "Hubble Space Telescope - imaging the universe since 1990 | 🇺🇸 NASA/ESA · Space telescope";
  if (upper.includes("JAMES WEBB") || upper.includes("JWST")) return "James Webb Space Telescope - infrared observatory at L2 | 🇺🇸🇪🇺🇨🇦 NASA/ESA/CSA · Deep space telescope";
  if (upper.includes("XRISM")) return "X-ray Imaging and Spectroscopy Mission | 🇯🇵 JAXA/NASA · X-ray astronomy";
  if (upper.includes("ASTRO-H") || upper.includes("HITOMI")) return "Japanese X-ray astronomy satellite (lost contact 2016) | 🇯🇵 JAXA · X-ray telescope";

  // === Russian crewed vehicles ===
  if (upper.includes("SOYUZ")) return "Russian crewed spacecraft docked at ISS | 🇷🇺 Roscosmos · Crew transport";
  if (upper.includes("PROGRESS")) return "Russian cargo spacecraft supplying the ISS | 🇷🇺 Roscosmos · Cargo resupply";

  // === US crewed vehicles ===
  if (upper.includes("CREW DRAGON")) return "SpaceX Crew Dragon spacecraft docked at ISS | 🇺🇸 SpaceX · Crew transport";
  if (upper.includes("STARLINER")) return "Boeing Starliner crew capsule | 🇺🇸 Boeing · Crew transport";

  // === Starlink ===
  if (upper.includes("STARLINK")) return "SpaceX internet satellite, part of 6,000+ constellation | 🇺🇸 SpaceX · Broadband internet";

  // === OneWeb ===
  if (upper.includes("ONEWEB")) return "Low Earth orbit broadband satellite | 🇬🇧 OneWeb · Internet constellation";

  // === Iridium ===
  if (upper.includes("IRIDIUM")) return "Global satellite phone and data network | 🇺🇸 Iridium · Communications";

  // === Navigation ===
  if (upper.includes("GPS")) return "US Global Positioning System satellite | 🇺🇸 US Space Force · Navigation";
  if (upper.includes("BEIDOU")) return "Chinese navigation system satellite | 🇨🇳 CNSA · Navigation";
  if (upper.includes("GALILEO")) return "European navigation system satellite | 🇪🇺 ESA · Navigation";
  if (upper.includes("GLONASS")) return "Russian navigation system satellite | 🇷🇺 Roscosmos · Navigation";

  // === Weather ===
  if (upper.includes("NOAA")) return "US weather and environmental monitoring satellite | 🇺🇸 NOAA · Weather observation";
  if (upper.includes("GOES")) return "Geostationary weather satellite, real-time storm tracking | 🇺🇸 NOAA/NASA · Weather";
  if (upper.includes("METEOSAT")) return "European geostationary weather satellite | 🇪🇺 EUMETSAT · Weather";
  if (upper.includes("METOP")) return "European polar-orbiting weather satellite | 🇪🇺 EUMETSAT · Weather";

  // === Earth observation ===
  if (upper.includes("TERRA")) return "Earth-observing satellite, monitoring climate since 1999 | 🇺🇸 NASA · Earth science";
  if (upper.includes("AQUA")) return "Water cycle and Earth science research satellite | 🇺🇸 NASA · Earth science";
  if (upper.includes("LANDSAT")) return "Longest-running Earth observation programme | 🇺🇸 NASA/USGS · Earth imaging";
  if (upper.includes("SENTINEL")) return "Copernicus Earth observation satellite | 🇪🇺 ESA · Environmental monitoring";
  if (upper.includes("ENVISAT")) return "European environmental satellite (inactive since 2012) | 🇪🇺 ESA · Earth observation";
  if (upper.includes("ALOS")) return "Japanese Earth observation satellite | 🇯🇵 JAXA · Earth observation";
  if (upper.includes("ERS-")) return "European Remote Sensing satellite | 🇪🇺 ESA · Earth observation";
  if (upper.includes("COSMO-SKYMED")) return "Italian radar Earth observation satellite | 🇮🇹 ASI · Radar imaging";
  if (upper.includes("SAOCOM")) return "Argentine radar observation satellite | 🇦🇷 CONAE · Radar imaging";

  // === Russian satellites ===
  if (upper.includes("COSMOS") || upper.includes("KOSMOS")) return "Russian military or civilian satellite | 🇷🇺 Russia · Various missions";
  if (upper.includes("OKEAN")) return "Russian ocean observation satellite | 🇷🇺 Roscosmos · Ocean monitoring";
  if (upper.includes("RESURS")) return "Russian Earth resources satellite | 🇷🇺 Roscosmos · Earth observation";
  if (upper.includes("INTERCOSMOS")) return "Soviet international cooperation satellite | 🇷🇺 Soviet/International · Science";

  // === Chinese satellites ===
  if (upper.includes("YAOGAN")) return "Chinese remote sensing satellite | 🇨🇳 CNSA · Earth observation";
  if (upper.includes("SHIJIAN") || upper.includes("SJ-")) return "Chinese experimental satellite | 🇨🇳 CNSA · Technology testing";
  if (upper.includes("CHUANGXIN") || upper.includes("CX-")) return "Chinese small technology satellite | 🇨🇳 CNSA · Technology";
  if (upper.includes("HXMT") || upper.includes("HUIYAN")) return "Chinese X-ray telescope satellite | 🇨🇳 CNSA · X-ray astronomy";

  // === Rocket bodies (debris by origin) ===
  if (upper.includes("SL-")) return "Russian rocket upper stage (debris) | 🇷🇺 Russia · Spent rocket body";
  if (upper.includes("CZ-")) return "Chinese Long March rocket stage (debris) | 🇨🇳 China · Spent rocket body";
  if (upper.includes("H-2A R/B")) return "Japanese H-IIA rocket stage | 🇯🇵 JAXA · Spent rocket body";
  if (upper.includes("ARIANE")) return "European Ariane rocket stage | 🇪🇺 Arianespace · Spent rocket body";
  if (upper.includes("DELTA")) return "US Delta rocket stage | 🇺🇸 ULA · Spent rocket body";
  if (upper.includes("ATLAS")) return "US Atlas rocket stage | 🇺🇸 ULA · Spent rocket body";
  if (upper.includes("TITAN")) return "US Titan rocket stage | 🇺🇸 USAF · Spent rocket body";
  if (upper.includes("FALCON")) return "SpaceX Falcon rocket stage | 🇺🇸 SpaceX · Spent rocket body";
  if (upper.includes("GSLV R/B")) return "Indian GSLV rocket stage | 🇮🇳 ISRO · Spent rocket body";
  if (upper.includes("PSLV R/B")) return "Indian PSLV rocket stage | 🇮🇳 ISRO · Spent rocket body";
  if (upper.includes("FREGAT")) return "Russian Fregat upper stage (debris) | 🇷🇺 Roscosmos · Spent rocket body";

  // === Other notable ===
  if (upper.includes("USA ")) return "US military satellite (classified) | 🇺🇸 US DoD · Classified";
  if (upper.includes("AJISAI")) return "Japanese geodetic satellite, covered in mirrors | 🇯🇵 JAXA · Geodesy";
  if (upper.includes("ACS3")) return "NASA Advanced Composite Solar Sail System | 🇺🇸 NASA · Solar sail tech demo";
  if (upper.includes("HTV")) return "Japanese cargo transfer vehicle for ISS | 🇯🇵 JAXA · Cargo resupply";

  // === Generic R/B (rocket body) ===
  if (upper.includes("R/B")) return "Spent rocket body - orbital debris";
  if (upper.includes("DEB")) return "Tracked space debris";

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
