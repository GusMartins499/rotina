"use client";

import { useEffect, useState } from "react";

function localIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function useNow(): string | null {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(localIso(new Date()));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  return now;
}
