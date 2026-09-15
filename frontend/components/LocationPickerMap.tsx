"use client";

import { useEffect, useRef } from "react";

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number, label: string) => void;
}

// Default center — Bengaluru city center
const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

export default function LocationPickerMap({ onLocationSelect }: LocationPickerMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icon (webpack issue with Leaflet)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (mapRef.current) return; // Prevent double-init

      // Try to get user GPS
      let lat = DEFAULT_LAT;
      let lng = DEFAULT_LNG;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Use default Bengaluru center
      }

      if (!isMounted) return;

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      mapRef.current = map;

      // Reverse geocode helper
      const updateLabel = async (mlat: number, mlng: number) => {
        let label = `${mlat.toFixed(4)}, ${mlng.toFixed(4)}`;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${mlat}&lon=${mlng}&format=json`
          );
          const data = await r.json();
          const addr = data.address;
          label = [addr.road, addr.suburb, addr.city_district, addr.city]
            .filter(Boolean)
            .join(", ")
            .slice(0, 80) || label;
        } catch {}
        onLocationSelect(mlat, mlng, label);
      };

      // Set initial location
      await updateLabel(lat, lng);

      // Drag end
      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        await updateLabel(pos.lat, pos.lng);
      });

      // Click to move
      map.on("click", async (e: any) => {
        marker.setLatLng(e.latlng);
        await updateLabel(e.latlng.lat, e.latlng.lng);
      });
    };

    initMap().catch(console.error);

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "280px" }}
      role="application"
      aria-label="Location picker map. Click or drag the marker to select a location."
      tabIndex={0}
    />
  );
}
