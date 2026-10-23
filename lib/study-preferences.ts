export const settingsStorageKey = "studysync-demo-settings-v1";
export type ResponseLength = "Concise" | "Detailed";

/** Read saved preferences when sending, so Save/Cancel keep their existing meaning. */
export function readResponseLength(storage: Pick<Storage, "getItem">): ResponseLength {
  try {
    const saved = JSON.parse(storage.getItem(settingsStorageKey) || "null");
    return saved?.response === "Detailed" ? "Detailed" : "Concise";
  } catch {
    return "Concise";
  }
}
