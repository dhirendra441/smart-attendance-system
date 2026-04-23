export const normalizeText = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ");

export const normalizeIdentity = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export const toIsoString = (value) => new Date(value).toISOString();
