export interface OpenRouterModel {
  id: string;
  name: string;
}

const FREE_MODEL_LIMIT = 25;

function isZeroPrice(value: unknown): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const price = Number(value);
  return Number.isFinite(price) && price === 0;
}

export function filterFreeOpenRouterModels(payload: unknown): OpenRouterModel[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { data?: unknown }).data)) {
    return [];
  }

  const models = (payload as { data: unknown[] }).data
    .filter((entry): entry is { id: string; name?: string; pricing?: { prompt?: unknown; completion?: unknown } } => {
      if (!entry || typeof entry !== 'object') return false;
      const model = entry as { id?: unknown; name?: unknown; pricing?: { prompt?: unknown; completion?: unknown } };
      return (
        typeof model.id === 'string' &&
        model.id.length > 0 &&
        model.id.length <= 180 &&
        model.pricing !== undefined &&
        isZeroPrice(model.pricing.prompt) &&
        isZeroPrice(model.pricing.completion)
      );
    })
    .map((model) => ({ id: model.id, name: typeof model.name === 'string' ? model.name : model.id }));

  return models.slice(0, FREE_MODEL_LIMIT);
}
