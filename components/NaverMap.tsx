"use client";

import { useEffect, useRef } from "react";

export interface Restaurant {
  title: string;
  address: string;
  roadAddress: string;
  category: string;
  description: string;
  link: string;
  lat: number;
  lng: number;
}

interface Props {
  restaurants: Restaurant[];
  onMarkerClick?: (r: Restaurant) => void;
  userLocation?: { lat: number; lng: number };
  categoryColors?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { naver: any; }
}

const DEFAULT_COLORS = ["#FF6B35", "#2ECC71", "#8B5CF6"];

export default function NaverMap({ restaurants, onMarkerClick, userLocation, categoryColors = DEFAULT_COLORS }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const S = useRef({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markers: [] as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver: null as any,
  });

  const restaurantsRef = useRef(restaurants);
  const onMarkerClickRef = useRef(onMarkerClick);
  const userLocationRef = useRef(userLocation);
  useEffect(() => { restaurantsRef.current = restaurants; }, [restaurants]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  useEffect(() => {
    let alive = true;

    function loadScript(): Promise<void> {
      return new Promise((resolve) => {
        if (window.naver?.maps) { resolve(); return; }
        const existing = document.getElementById("naver-map-script");
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.id = "naver-map-script";
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
        script.async = true;
        script.addEventListener("load", () => resolve(), { once: true });
        document.head.appendChild(script);
      });
    }

    loadScript().then(() => {
      if (!alive || !containerRef.current || S.current.map) return;
      S.current.naver = window.naver;
      const loc = userLocationRef.current;
      S.current.map = new window.naver.maps.Map(containerRef.current, {
        center: new window.naver.maps.LatLng(loc ? loc.lat : 36.5, loc ? loc.lng : 127.5),
        zoom: loc ? 14 : 7,
        mapTypeControl: false,
        scaleControl: false,
        logoControlOptions: { position: window.naver.maps.Position.BOTTOM_LEFT },
      });
      renderAll(restaurantsRef.current);
    });

    return () => {
      alive = false;
      S.current.markers.forEach((m) => m.setMap(null));
      S.current.markers = [];
      if (S.current.map) { S.current.map.destroy(); S.current.map = null; }
      S.current.naver = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (S.current.map && S.current.naver) renderAll(restaurants);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants]);

  useEffect(() => {
    if (!userLocation || !S.current.map || !S.current.naver) return;
    S.current.map.setCenter(new S.current.naver.maps.LatLng(userLocation.lat, userLocation.lng));
  }, [userLocation]);

  function renderAll(list: Restaurant[]) {
    const { map, naver, markers } = S.current;
    if (!map || !naver) return;

    markers.forEach((m) => m.setMap(null));
    S.current.markers = [];

    // 사용자 위치 마커 (파란 점)
    if (userLocationRef.current) {
      const { lat, lng } = userLocationRef.current;
      new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map,
        icon: {
          content: '<div style="width:14px;height:14px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          anchor: new naver.maps.Point(7, 7),
        },
        zIndex: 10,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let openIW: any = null;

    list.forEach((r, i) => {
      if (!r.lat || !r.lng) return;
      const color = categoryColors[i] ?? DEFAULT_COLORS[0];

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(r.lat, r.lng),
        map,
        icon: {
          content: `<div style="background:${color};color:white;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.25);white-space:nowrap;font-family:sans-serif;">${i + 1}. ${r.title}</div>`,
          anchor: new naver.maps.Point(0, 28),
        },
      });

      const iw = new naver.maps.InfoWindow({
        content: `
          <div style="padding:12px 14px;min-width:200px;font-family:-apple-system,sans-serif;">
            <strong style="font-size:13px;color:#111;">${r.title}</strong>
            ${r.category ? `<p style="margin:4px 0 0;font-size:11px;color:${color};font-weight:600;">${r.category}</p>` : ""}
            <p style="margin:6px 0 0;font-size:11px;color:#666;">${r.roadAddress || r.address}</p>
            <a href="${r.link || `https://map.naver.com/p/search/${encodeURIComponent(r.title)}`}" target="_blank" style="display:inline-block;margin-top:8px;font-size:11px;color:#03C75A;font-weight:600;text-decoration:none;">네이버 플레이스 보기 →</a>
          </div>`,
        maxWidth: 280,
        borderRadius: "12px",
      });

      naver.maps.Event.addListener(marker, "click", () => {
        if (openIW) openIW.close();
        iw.open(map, marker);
        openIW = iw;
        onMarkerClickRef.current?.(r);
      });

      S.current.markers.push(marker);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    const validRestaurants = list.filter((r) => r.lat && r.lng);
    if (validRestaurants.length > 0 && userLocationRef.current) {
      const bounds = new naver.maps.LatLngBounds(
        new naver.maps.LatLng(userLocationRef.current.lat, userLocationRef.current.lng),
        new naver.maps.LatLng(userLocationRef.current.lat, userLocationRef.current.lng)
      );
      validRestaurants.forEach((r) => bounds.extend(new naver.maps.LatLng(r.lat, r.lng)));
      map.fitBounds(bounds, { padding: 60 });
    }
  }

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
