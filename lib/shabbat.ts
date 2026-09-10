import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import SunCalc from 'suncalc';

// Candle-lighting is a fixed number of minutes before Friday sunset (lock time).
const CANDLE_LIGHTING_OFFSET_MINUTES = 18;
// Nightfall (tzeit) is a fixed number of minutes after Saturday sunset (release time).
const TZEIT_MINUTES_DEFAULT = 42;
const LOCATION_CACHE_KEY = 'shabbat.location.v1';
const TICK_INTERVAL_MS = 60 * 1000;

export type Coords = { latitude: number; longitude: number };

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// SunCalc is off-by-one day when given local midnight: it returns the previous
// civil day's sunset. Always query at local noon for the intended calendar day.
function sunsetOn(date: Date, coords: Coords): Date {
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  return SunCalc.getTimes(noon, coords.latitude, coords.longitude).sunset;
}

// Candle-lighting: CANDLE_LIGHTING_OFFSET_MINUTES before Friday's sunset.
function candleLightingOn(friday: Date, coords: Coords): Date {
  return new Date(sunsetOn(friday, coords).getTime() - CANDLE_LIGHTING_OFFSET_MINUTES * 60_000);
}

// Nightfall (tzeit): tzeitMinutes after Saturday's sunset.
function nightfallOn(saturday: Date, coords: Coords, tzeitMinutes: number): Date {
  return new Date(sunsetOn(saturday, coords).getTime() + tzeitMinutes * 60_000);
}

function shabbatWindow(
  coords: Coords,
  ref: Date,
  tzeitMinutes: number,
): { start: Date; end: Date } {
  // Most recent Friday on or before `ref` (today if today is Friday).
  const daysBackToFriday = (ref.getDay() - 5 + 7) % 7;
  let friday = addDays(startOfLocalDay(ref), -daysBackToFriday);
  // Lock at Friday candle-lighting; release at Saturday nightfall.
  let start = candleLightingOn(friday, coords);
  let end = nightfallOn(addDays(friday, 1), coords, tzeitMinutes);

  // If that window already ended, advance to next week's Shabbat.
  if (ref >= end) {
    friday = addDays(friday, 7);
    start = candleLightingOn(friday, coords);
    end = nightfallOn(addDays(friday, 1), coords, tzeitMinutes);
  }
  return { start, end };
}

async function loadCachedCoords(): Promise<Coords | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchAndCacheCoords(): Promise<Coords | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const last = await Location.getLastKnownPositionAsync();
  const pos = last ?? (await Location.getCurrentPositionAsync({}));
  const coords: Coords = {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };

  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coords));
  } catch {
    // Cache write failures shouldn't break the read path.
  }
  return coords;
}

export async function getUserCoords(): Promise<Coords | null> {
  const cached = await loadCachedCoords();
  if (cached) return cached;
  return fetchAndCacheCoords();
}

export function isShabbatAt(
  coords: Coords,
  when: Date,
  tzeitMinutes: number = TZEIT_MINUTES_DEFAULT,
): boolean {
  const { start, end } = shabbatWindow(coords, when, tzeitMinutes);
  return when >= start && when < end;
}

export async function isShabbat(now: Date = new Date()): Promise<boolean> {
  const coords = await getUserCoords();
  if (!coords) return false;
  return isShabbatAt(coords, now, TZEIT_MINUTES_DEFAULT);
}

export async function getShabbatStart(now: Date = new Date()): Promise<Date | null> {
  const coords = await getUserCoords();
  if (!coords) return null;
  return shabbatWindow(coords, now, TZEIT_MINUTES_DEFAULT).start;
}

export async function getShabbatEnd(
  now: Date = new Date(),
  tzeitMinutes: number = TZEIT_MINUTES_DEFAULT,
): Promise<Date | null> {
  const coords = await getUserCoords();
  if (!coords) return null;
  return shabbatWindow(coords, now, tzeitMinutes).end;
}

export type UseShabbatResult = {
  isShabbat: boolean;
  shabbatStart: Date | null;
  shabbatEnd: Date | null;
};

export function useShabbat(
  tzeitMinutes: number = TZEIT_MINUTES_DEFAULT,
): UseShabbatResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let cancelled = false;
    getUserCoords().then((result) => {
      if (!cancelled) setCoords(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (!coords) {
    return { isShabbat: false, shabbatStart: null, shabbatEnd: null };
  }

  const { start, end } = shabbatWindow(coords, now, tzeitMinutes);
  return {
    isShabbat: now >= start && now < end,
    shabbatStart: start,
    shabbatEnd: end,
  };
}
