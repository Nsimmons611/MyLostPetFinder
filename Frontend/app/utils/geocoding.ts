/**
 * Geocoding Utility
 * 
 * Handles conversion of location strings to GPS coordinates.
 * Uses the backend /api/geocode/ endpoint powered by Nominatim (OpenStreetMap).
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Convert a single location string to coordinates
 * @param location - Address or location description (e.g., "Downtown Atlanta")
 * @returns Promise<Coordinates | null> - GPS coordinates or null if not found
 */
export async function geocodeLocation(location: string): Promise<Coordinates | null> {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/geocode/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { lat: data.lat, lng: data.lng };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Convert multiple location strings to coordinates
 * @param locations - Array of location strings
 * @returns Promise<Map<string, Coordinates | null>> - Map of locations to coordinates
 */
export async function geocodeMultipleLocations(
  locations: string[]
): Promise<Map<string, Coordinates | null>> {
  const results = new Map<string, Coordinates | null>();
  
  for (const location of locations) {
    const coords = await geocodeLocation(location);
    results.set(location, coords);
  }
  
  return results;
}
