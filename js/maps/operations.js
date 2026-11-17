import { rows } from "./simulation.js";
import { snapshot } from "./store.js";
export const operations = [];
export function refreshOperations() {
  operations.splice(0, operations.length, ...rows(snapshot()));
}
refreshOperations();
