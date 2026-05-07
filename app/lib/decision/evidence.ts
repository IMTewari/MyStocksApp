// app/lib/decision/evidence.ts

import { Evidence } from "./deriveTechnicalEvidence";

export function known<T>(value: T): Evidence<T> {
  return {
    status: "KNOWN",
    value,
  };
}

export function unknown<T>(reason: string): Evidence<T> {
  return {
    status: "UNKNOWN",
    reason,
  };
}
