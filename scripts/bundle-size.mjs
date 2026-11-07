import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

// Sum the entry's static import closure, not every emitted/lazy chunk.
const directory = resolve(process.argv[2] ?? "dist");
const manifest = JSON.parse(readFileSync(resolve(directory, ".vite/manifest.json"), "utf8"));
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports ?? []) visit(dependency);
}
visit("index.html");
function size(key) {
  const file = manifest[key].file;
  const data = readFileSync(resolve(directory, file));
  return { file, bytes: data.length, gzipBytes: gzipSync(data, { level: 9 }).length };
}
const files = [...initial].filter((key) => manifest[key].file.endsWith(".js")).map(size);
const routes = ["src/pages/Todo.tsx", "src/pages/Animation.tsx"];
if (process.argv.includes("--assert-lazy")) {
  for (const key of routes) {
    if (!manifest[key]?.isDynamicEntry || initial.has(key)) {
      throw new Error(`${key} must be a lazy entry outside the initial import closure`);
    }
  }
  if (manifest[routes[0]].file === manifest[routes[1]].file) {
    throw new Error("Todo and Animation must have separate chunks");
  }
}
console.log(
  JSON.stringify(
    {
      files,
      initialBytes: files.reduce((sum, file) => sum + file.bytes, 0),
      initialGzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
      lazyRoutes: routes.filter((key) => manifest[key]).map(size),
    },
    null,
    2,
  ),
);
