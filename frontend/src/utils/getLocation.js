// QuickSeva - Map Performance Feature

/**
 * Retrieves the user's location.
 * Tries GPS first, then IP geolocation, and finally falls back to Ahmedabad.
 * @returns {Promise<{lat: number, lng: number, city: string, source: 'gps' | 'ip' | 'default'}>}
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      getIpFallback().then(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: "", // Not available from GPS directly
          source: "gps",
        });
      },
      (error) => {
        getIpFallback().then(resolve);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

/**
 * Fallback to IP geolocation API
 * @returns {Promise<{lat: number, lng: number, city: string, source: 'ip' | 'default'}>}
 */
export async function getIpFallback() {
  try {
    const response = await fetch("http://ip-api.com/json/");
    if (!response.ok) {
      throw new Error("IP API failed");
    }
    const data = await response.json();
    if (typeof data.lat === "number" && typeof data.lon === "number") {
      return {
        lat: data.lat,
        lng: data.lon,
        city: data.city || "",
        source: "ip",
      };
    }
    throw new Error("Invalid response format");
  } catch (err) {
    return {
      lat: 23.0225,
      lng: 72.5714,
      city: "Ahmedabad",
      source: "default",
    };
  }
}
