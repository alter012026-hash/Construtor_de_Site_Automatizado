const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSlugEntries } = require("../lib/post-slugs.cjs");

test("o artigo mais antigo mantém o slug e os repetidos ganham a data", () => {
  const e = buildSlugEntries([
    "2026-08-06-cuidados-com-plantas.md",
    "2026-08-01-cuidados-com-plantas.md",
    "2026-08-11-cuidados-com-plantas.md",
  ]);
  const by = Object.fromEntries(e.map((x) => [x.fileName, x.slug]));
  assert.equal(by["2026-08-01-cuidados-com-plantas.md"], "cuidados-com-plantas");
  assert.equal(by["2026-08-06-cuidados-com-plantas.md"], "cuidados-com-plantas-2026-08-06");
  assert.equal(by["2026-08-11-cuidados-com-plantas.md"], "cuidados-com-plantas-2026-08-11");
});

test("todos os slugs são únicos e a ordem de entrada é preservada", () => {
  const files = ["2026-01-01-a.md", "2026-01-02-a.md", "2026-01-02-b.md"];
  const e = buildSlugEntries(files);
  assert.deepEqual(e.map((x) => x.fileName), files);
  assert.equal(new Set(e.map((x) => x.slug)).size, files.length);
});

test("slug curto não colide por substring", () => {
  const e = buildSlugEntries(["2026-01-01-guia.md", "2026-01-02-guia-de-jardinagem.md"]);
  assert.deepEqual(e.map((x) => x.slug), ["guia", "guia-de-jardinagem"]);
});
