import { useCallback, useEffect, useRef, useState } from "react";
import { resolveApiBase } from "@/lib/runtime";

type LocationPermissionState = "idle" | "prompt" | "granted" | "denied" | "unsupported";

interface MobileContextPayload {
  coords?: {
    latitude?: number;
    longitude?: number;
  };
  weather?: {
    temperature?: number | null;
    weatherCode?: number | null;
    isDay?: boolean;
  };
  location?: {
    city?: string | null;
    region?: string | null;
    label?: string | null;
  };
  resolvedAt?: string;
}

interface MobileLiveContextState {
  permission: LocationPermissionState;
  isLoading: boolean;
  temperature: number | null;
  weatherCode: number | null;
  isDay: boolean;
  city: string | null;
  region: string | null;
  locationLabel: string | null;
  error: string | null;
}

interface CoordinatesSnapshot {
  latitude: number;
  longitude: number;
}

const WEATHER_REFRESH_MS = 10 * 60 * 1000;
const MOVEMENT_THRESHOLD_KM = 1;

const initialState: MobileLiveContextState = {
  permission: "idle",
  isLoading: true,
  temperature: null,
  weatherCode: null,
  isDay: true,
  city: null,
  region: null,
  locationLabel: null,
  error: null,
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (from: CoordinatesSnapshot, to: CoordinatesSnapshot) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return "Permita a localização no navegador para exibir clima e cidade.";
  }
  if (error.code === error.TIMEOUT) {
    return "Não foi possível obter a localização dentro do tempo esperado.";
  }
  return "Não foi possível atualizar a localização do aparelho.";
};

export const useMobileLiveContext = (enabled: boolean) => {
  const [state, setState] = useState<MobileLiveContextState>(initialState);
  const apiBase = resolveApiBase();
  const watchIdRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastCoordsRef = useRef<CoordinatesSnapshot | null>(null);
  const lastResolvedRef = useRef<{ coords: CoordinatesSnapshot; timestamp: number } | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const loadContext = useCallback(async (coords: CoordinatesSnapshot, force = false) => {
    const lastResolved = lastResolvedRef.current;
    if (!force && lastResolved) {
      const movedKm = getDistanceKm(lastResolved.coords, coords);
      const ageMs = Date.now() - lastResolved.timestamp;
      if (movedKm < MOVEMENT_THRESHOLD_KM && ageMs < WEATHER_REFRESH_MS) {
        return;
      }
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    try {
      const query = new URLSearchParams({
        lat: coords.latitude.toString(),
        lon: coords.longitude.toString(),
      });

      const response = await fetch(`${apiBase}/mobile-context.php?${query.toString()}`, {
        signal: controller.signal,
        credentials: "include",
      });

      const payload = (await response.json()) as MobileContextPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      lastResolvedRef.current = {
        coords,
        timestamp: Date.now(),
      };

      setState({
        permission: "granted",
        isLoading: false,
        temperature:
          typeof payload.weather?.temperature === "number" ? payload.weather.temperature : null,
        weatherCode:
          typeof payload.weather?.weatherCode === "number" ? payload.weather.weatherCode : null,
        isDay: payload.weather?.isDay ?? true,
        city: payload.location?.city ?? null,
        region: payload.location?.region ?? null,
        locationLabel: payload.location?.label ?? null,
        error: null,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Não foi possível carregar clima e localização.";

      setState((current) => ({
        ...current,
        isLoading: false,
        error: message,
      }));
    }
  }, [apiBase]);

  const startWatching = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (typeof window === "undefined" || typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState((current) => ({
        ...current,
        permission: "unsupported",
        isLoading: false,
        error: "Geolocalização não suportada neste dispositivo.",
      }));
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setState((current) => ({
        ...current,
        permission: "unsupported",
        isLoading: false,
        error: "A localização em tempo real requer HTTPS no celular.",
      }));
      return;
    }

    stopWatching();
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        lastCoordsRef.current = coords;
        setState((current) => ({
          ...current,
          permission: "granted",
        }));
        void loadContext(coords);
      },
      (error) => {
        setState((current) => ({
          ...current,
          permission: error.code === error.PERMISSION_DENIED ? "denied" : current.permission,
          isLoading: false,
          error: getGeolocationErrorMessage(error),
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 15_000,
      },
    );
  }, [enabled, loadContext, stopWatching]);

  useEffect(() => {
    if (!enabled) {
      stopWatching();
      abortRef.current?.abort();
      setState(initialState);
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const setup = async () => {
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        try {
          permissionStatus = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });

          if (!cancelled) {
            setState((current) => ({
              ...current,
              permission: permissionStatus?.state || "prompt",
            }));
          }

          permissionStatus.onchange = () => {
            if (cancelled) {
              return;
            }

            setState((current) => ({
              ...current,
              permission: permissionStatus?.state || current.permission,
            }));
          };
        } catch {
          // Alguns navegadores moveis nao expõem a Permissions API.
        }
      }

      if (!cancelled) {
        startWatching();
      }
    };

    void setup();

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
      abortRef.current?.abort();
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  const refresh = () => {
    if (!enabled) {
      return;
    }

    if (lastCoordsRef.current) {
      void loadContext(lastCoordsRef.current, true);
      return;
    }

    startWatching();
  };

  return {
    ...state,
    refresh,
  };
};
