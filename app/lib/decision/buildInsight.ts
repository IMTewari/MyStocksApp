// app/lib/decision/buildInsight.ts

import { deriveTechnicalEvidence } from "./deriveTechnicalEvidence";
import { technicalLens } from "./marketLens";import { technicalLens } from "./technicalLens";
import { aggregateDecision } from "./decisionEngine";
import { ContextualEvidence } from "./contextualEvidence";
import { getBusinessArchetype } from "./businessArchetype";

export async function buildInsight(
  symbol: string,
  data: {
    candles: number[];            // stock close prices
    indexCandles: number[];       // benchmark close prices (e.g. NIFTY)
    fundamental: any;
    market: any;
    contextualEvidence: ContextualEvidence[];
  }
) {
  // Canonical business identity
  const archetype = getBusinessArchetype(symbol);

  // ✅ FIX: pass BOTH required arguments
  const technicalEvidence = deriveTechnicalEvidence(

import { fundamentalLens } from "./fundamentalLens";
