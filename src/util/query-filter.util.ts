import { FilterQuery } from 'mongoose';

const SUPPORTED_OPERATORS: Record<string, string> = {
  eq: '$eq',
  ne: '$ne',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
  in: '$in',
  nin: '$nin',
  regex: '$regex',
};

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

const coerceScalar = (value: string): unknown => {
  const trimmed = value.trim();

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (NUMBER_PATTERN.test(trimmed)) return Number(trimmed);

  return trimmed;
};

const coerceUnknown = (value: unknown): unknown => {
  if (typeof value === 'string') return coerceScalar(value);
  if (Array.isArray(value)) return value.map(coerceUnknown);
  return value;
};

const toFlatArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value.map(coerceUnknown).flat();
  if (typeof value === 'string' && value.includes(',')) {
    return value
      .split(',')
      .map((part) => coerceScalar(part))
      .filter((part) => part !== '');
  }
  return [coerceUnknown(value)];
};

const applyFieldOperator = (
  query: FilterQuery<Record<string, unknown>>,
  field: string,
  mongoOperator: string,
  value: unknown,
) => {
  const existing = (query[field] ?? {}) as Record<string, unknown>;

  if (mongoOperator === '$regex') {
    existing.$regex = String(value);
    existing.$options = 'i';
  } else if (mongoOperator === '$in' || mongoOperator === '$nin') {
    existing[mongoOperator] = toFlatArray(value);
  } else {
    existing[mongoOperator] = coerceUnknown(value);
  }

  query[field] = existing;
};

/**
 * Transforme des critères dynamiques en query Mongo.
 * Syntaxes supportées:
 * - champ=valeur
 * - champ__op=valeur (op: eq, ne, gt, gte, lt, lte, in, nin, regex)
 * - valeur CSV -> $in (si pas d'opérateur explicite)
 */
export const buildMongoQueryFromDynamicCriteria = (
  criteria: Record<string, unknown>,
): FilterQuery<Record<string, unknown>> => {
  const query: FilterQuery<Record<string, unknown>> = {};

  for (const [rawKey, rawValue] of Object.entries(criteria)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    const [field, operator] = rawKey.split('__');
    if (!field) continue;

    if (operator && SUPPORTED_OPERATORS[operator]) {
      applyFieldOperator(query, field, SUPPORTED_OPERATORS[operator], rawValue);
      continue;
    }

    if (Array.isArray(rawValue)) {
      query[field] = { $in: rawValue.map(coerceUnknown) };
      continue;
    }

    if (typeof rawValue === 'string' && rawValue.includes(',')) {
      query[field] = { $in: toFlatArray(rawValue) };
      continue;
    }

    query[field] = coerceUnknown(rawValue);
  }

  return query;
};

export const parseJsonCriteria = (raw: unknown): Record<string, unknown> => {
  if (raw === undefined) return {};

  if (typeof raw !== 'string' || !raw.trim()) {
    const error = new Error('Le paramètre "criteria" doit être un JSON string valide.');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      const error = new Error('Le paramètre "criteria" doit représenter un objet JSON.');
      (error as Error & { status?: number }).status = 400;
      throw error;
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    const error = new Error('Le paramètre "criteria" est invalide (JSON mal formé).');
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
};

