import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getConfigPath, loadConfig, type OmlConfig, writeAtomically } from "./config.ts";

interface ProfileConfig extends OmlConfig {
  profiles?: Record<string, Record<string, unknown>>;
  activeProfile?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isRecord(value)) {
    const cloned: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      cloned[key] = cloneValue(nested);
    }
    return cloned as T;
  }

  return value;
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) {
    return cloneValue(base);
  }

  if (Array.isArray(override)) {
    return override.map((item) => cloneValue(item));
  }

  if (!isRecord(override)) {
    return cloneValue(override);
  }

  const baseRecord = isRecord(base) ? base : {};
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(baseRecord)) {
    result[key] = cloneValue(value);
  }

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }

    const baseValue = baseRecord[key];
    if (isRecord(baseValue) && isRecord(value)) {
      result[key] = deepMerge(baseValue, value);
      continue;
    }

    result[key] = cloneValue(value);
  }

  return result;
}

function loadProfileConfig(): ProfileConfig {
  const configPath = getConfigPath();

  try {
    return loadConfig(configPath) as ProfileConfig;
  } catch {
    if (!existsSync(configPath)) {
      throw new Error("Failed to load config");
    }

    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as ProfileConfig;
  }
}

function writeProfileConfig(config: ProfileConfig): void {
  const configPath = getConfigPath();
  const configDir = dirname(configPath);
  mkdirSync(configDir, { recursive: true, mode: 0o700 });

  const content = `${JSON.stringify(config, null, 2)}\n`;

  try {
    writeAtomically(configPath, content);
  } catch {
    writeFileSync(configPath, content, { encoding: "utf-8", mode: 0o600 });
  }
}

export function listProfiles(config: OmlConfig): string[] {
  return Object.keys((config as ProfileConfig).profiles ?? {});
}

export function getProfile(config: OmlConfig, name: string): Record<string, unknown> | null {
  return ((config as ProfileConfig).profiles ?? {})[name] ?? null;
}

export function setActiveProfile(name: string): void {
  const config = loadProfileConfig();
  writeProfileConfig({ ...config, activeProfile: name });
}

export function getActiveProfile(config: OmlConfig): string | null {
  return (config as ProfileConfig).activeProfile ?? null;
}

export function applyProfile(config: OmlConfig, name: string): OmlConfig {
  const profile = getProfile(config, name);

  if (!profile) {
    return deepMerge(config, {}) as OmlConfig;
  }

  return deepMerge(config, profile) as OmlConfig;
}

export function createProfile(name: string, overrides: Record<string, unknown>): void {
  const config = loadProfileConfig();
  const profiles = config.profiles ?? {};

  writeProfileConfig({
    ...config,
    profiles: {
      ...profiles,
      [name]: cloneValue(overrides),
    },
  });
}

export function deleteProfile(name: string): void {
  const config = loadProfileConfig();
  const profiles = { ...(config.profiles ?? {}) };

  delete profiles[name];

  writeProfileConfig({
    ...config,
    profiles,
    activeProfile: config.activeProfile === name ? undefined : config.activeProfile,
  });
}
