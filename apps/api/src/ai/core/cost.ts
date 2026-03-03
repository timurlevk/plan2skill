interface ModelCostRate {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_COSTS: Record<string, ModelCostRate> = {
  'claude-opus-4-6': { inputPer1M: 15.0, outputPer1M: 75.0 },
  'claude-sonnet-4-6': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.8, outputPer1M: 4.0 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = MODEL_COSTS[model];
  if (!rate) return 0;
  const cost =
    (inputTokens / 1_000_000) * rate.inputPer1M +
    (outputTokens / 1_000_000) * rate.outputPer1M;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
