const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const resolveAppBasePath = (): string => {
  const configuredBase = import.meta.env.VITE_ROUTER_BASENAME?.trim();
  if (configuredBase) {
    return configuredBase === "/" ? "" : trimTrailingSlash(configuredBase);
  }

  if (typeof window !== "undefined" && window.location.pathname.startsWith("/juliano-agenda")) {
    return "/juliano-agenda";
  }

  return "";
};

export const resolveRouterBasename = (): string => resolveAppBasePath() || "/";

export const resolveApiBase = (): string => {
  const configuredApiBase = import.meta.env.VITE_API_BASE?.trim();
  if (configuredApiBase) {
    return trimTrailingSlash(configuredApiBase);
  }

  return `${resolveAppBasePath()}/api`;
};
