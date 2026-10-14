/** Translate model class names into stable Library IDs without changing label order. */
export function getPlantIdForModelLabel(label: string): string | null {
  const id = label.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!id || id.startsWith("unknown")) return null;
  return id === "tubang-bakod" ? "tuba-tuba" : id;
}
