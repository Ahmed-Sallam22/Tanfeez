// utils/formatNumber.ts
export const formatNumber = (
  value?: number | string,
  options: Intl.NumberFormatOptions = {}
) => {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (!isFinite(n)) return String(value);
  // tweak options if you want fixed decimals, etc.
  return new Intl.NumberFormat("en-US", options).format(n);
};
