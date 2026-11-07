# Production route-splitting comparison

Task: `boilerplates#839`. Measurements use Node 22.23.4, npm 11.16.0,
macOS arm64, production mode, target ES2022, no custom VITE environment, the
same final lockfile and Vite+ 1.5.0. Bytes are decimal bytes, not rounded kB.
Gzip uses Node's `gzipSync` with level 9, separately per JavaScript file.

The initial checkout (`9ea3fb5`) with Vite+ 1.1.0 emitted **561,691 initial JS
bytes**. Its dependency audit reported five moderate advisories. Vite+, its Vite
core alias and override were upgraded together to 1.5.0; the regenerated lockfile
passes the full audit. To avoid attributing toolchain changes to lazy loading,
the controlled comparison below uses the **same upgraded toolchain/lockfile on
both sides**. Baseline source is `9ea3fb5`; only package.json/package-lock.json
are replaced by the delivered versions before that baseline build.

| Metric                   | Static-route baseline | Lazy routes |          Reduction |
| ------------------------ | --------------------: | ----------: | -----------------: |
| Initial JavaScript       |             560,007 B |   438,305 B | 121,702 B (21.73%) |
| Initial JavaScript, gzip |             180,407 B |   141,235 B |  39,172 B (21.71%) |
| Initial JavaScript files |                     6 |           5 |                  1 |

“Initial” is the recursive static `imports` closure of `index.html` in Vite's
manifest, excluding dynamic imports, CSS and assets. It is not just the small
entry file and not the sum of all emitted chunks. This measures transferred-code
size, not browser timings, memory, HTTP compression settings or user latency.

## Emitted route chunks

- Todos: separate dynamic entry, **2,117 B** raw (903 B gzip in the measured build).
- Animation: separate dynamic entry, **30,329 B** raw (10,440 B gzip).
- Motion vendor chunk: **92,887 B** raw; outside the initial static import closure,
  loaded with Animation instead. Shared React/Query/i18n dependencies stay eager.

Hashes and compressed sizes can change with source/formatting or Node's zlib
version. The repeatable initial closure and disjoint route entries, rather than
specific hashed filenames, are the CI assertions.

## Reproduce

In the delivered checkout, with the documented Node/npm versions:

```sh
npm ci
npm run build
node scripts/bundle-size.mjs dist --assert-lazy
```

For the controlled baseline, make a disposable copy (never overwrite live source):

```sh
baseline=$(mktemp -d)
git archive 9ea3fb5 | tar -x -C "$baseline"
cp package.json package-lock.json "$baseline/"
mkdir -p "$baseline/scripts"
cp scripts/bundle-size.mjs "$baseline/scripts/"
(cd "$baseline" && npm ci && npm run build -- --manifest && node scripts/bundle-size.mjs)
# Remove only this disposable directory when finished.
rm -rf "$baseline"
```

Use the same environment for both builds, without a local `.env` override. The
route tests cover real Todo/Animation module imports, direct entry, home → todos
→ animation → back → home navigation, pending chunks and rejected imports. Both
lazy children have a hydration fallback so rejected lazy imports retain their
own recovery boundary. Recovery copy is translated in EN/UZ/RU and never exposes
internal error details. Tests use the real memory router and server rendering;
visual/browser timing validation is not claimed. Static hosts must serve the
SPA entry for frontend deep links as documented in the README.
