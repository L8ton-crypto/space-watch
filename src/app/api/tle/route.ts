import { NextResponse } from "next/server";

const TLE_SOURCES = [
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle", category: "Space Stations" },
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle", category: "Brightest" },
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle", category: "Active" },
  { url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle", category: "Starlink" },
];

// Cache TLE data for 2 hours
let cache: { data: { category: string; tle: string }[]; timestamp: number } | null = null;
const CACHE_DURATION = 2 * 60 * 60 * 1000;

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
  }

  const results: { category: string; tle: string }[] = [];

  for (const source of TLE_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: {
          "User-Agent": "SpaceWatch/1.0",
        },
        next: { revalidate: 7200 },
      });
      if (!res.ok) continue;
      const text = await res.text();
      results.push({ category: source.category, tle: text });
    } catch {
      console.warn(`Failed to fetch ${source.category}`);
    }
  }

  cache = { data: results, timestamp: Date.now() };

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, max-age=7200",
    },
  });
}
