// The requirements.type check in the migration must list the same values as CATEGORIES.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const list = (s) => [...s.matchAll(/"([a-z]+)"|'([a-z]+)'/g)].map((m) => m[1] ?? m[2]).sort();

test("migration requirement types match CATEGORIES", () => {
  const schema = readFileSync("utils/schema.ts", "utf8");
  const sql = readdirSync("supabase/migrations").map((f) => readFileSync(`supabase/migrations/${f}`, "utf8")).join("\n");
  const categories = list(schema.match(/CATEGORIES = \[([^\]]+)\]/)[1]);
  const checks = [...sql.matchAll(/type in \(([^)]+)\)/g)];
  assert.deepEqual(list(checks.at(-1)[1]), categories);
});
