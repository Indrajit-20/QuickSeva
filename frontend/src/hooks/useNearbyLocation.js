import { useEffect, useState } from "react";

const getShortAddress = (data) => {
  const address = data?.address || {};
  return [
    address.road,
    address.suburb || address.neighbourhood,
    address.city || address.town || address.village,
  ]
    .filter(Boolean)
    .join(", ");
};

const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lng)}&format=json&email=support@quickseva.com`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "QuickSeva/1.0",
    },
  });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  return getShortAddress(await res.json());
};

export function useNearbyLocation() {
  const [address, setAddress] = useState(() => {
    try {
      return sessionStorage.getItem("qs_cached_address") || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("qs_cached_address");
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let cancelled = false;

    try {
      const cached = sessionStorage.getItem("qs_cached_address");
      if (cached) {
        setAddress(cached);
        setLoading(false);
        return;
      }
    } catch { }

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const nextAddress = await reverseGeocode(lat, lng);
          if (!cancelled) {
            setAddress(nextAddress || "");
            try {
              sessionStorage.setItem("qs_cached_address", nextAddress || "");
            } catch { }
          }
        } catch {
          if (!cancelled) setAddress("");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setAddress("");
          setLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { address, loading };
}
