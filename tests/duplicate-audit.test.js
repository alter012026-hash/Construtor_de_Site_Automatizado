const test = require("node:test");
const assert = require("node:assert/strict");
const { auditPosts } = require("../scripts/detect-topic-overlap");

function post({ file, title, slug, signature, entities = [] }) {
  return {
    file,
    title,
    slug,
    date: "2026-10-19",
    wordCount: signature.length,
    topicKey: slug,
    signature,
    entities: new Set(entities),
  };
}

test("finds same-topic candidates and provides scores and reasons", () => {
  const candidates = auditPosts([
    post({
      file: "2026-10-01-escolher-plantas-interior.md",
      title: "Como escolher plantas para ambientes internos",
      slug: "escolher-plantas-interior",
      signature: ["escolher", "plantas", "ambientes", "internos"],
    }),
    post({
      file: "2026-10-05-melhores-plantas-para-casa.md",
      title: "As melhores plantas para cultivar dentro de casa",
      slug: "escolher-plantas-interior",
      signature: ["escolher", "plantas", "ambientes", "casa"],
    }),
  ]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].score > 0, true);
  assert.equal(candidates[0].decision, "pending");
  assert.ok(candidates[0].reasons.length > 0);
  assert.equal(candidates[0].articles.length, 2);
});

test("retains reviewer false-positive decisions across audit runs", () => {
  const entries = [
    post({
      file: "2026-10-01-rega-de-suculentas.md",
      title: "Como regar suculentas sem exagerar",
      slug: "rega-suculentas",
      signature: ["regar", "suculentas", "agua", "solo"],
      entities: ["suculentas"],
    }),
    post({
      file: "2026-10-02-frequencia-rega-suculentas.md",
      title: "Qual é a frequência ideal para regar suculentas",
      slug: "frequencia-rega-suculentas",
      signature: ["regar", "suculentas", "agua", "frequencia"],
      entities: ["suculentas"],
    }),
  ];
  const firstRun = auditPosts(entries);
  const secondRun = auditPosts(entries, [{
    id: firstRun[0].id,
    decision: "false_positive",
    reviewReason: "Conteúdos relacionados, mas intenções diferentes.",
    reviewedAt: "2026-10-19T12:00:00.000Z",
  }]);

  assert.equal(secondRun[0].decision, "false_positive");
  assert.equal(secondRun[0].reviewReason, "Conteúdos relacionados, mas intenções diferentes.");
});

test("does not report unrelated article pairs", () => {
  const candidates = auditPosts([
    post({
      file: "2026-10-01-escolher-plantas.md",
      title: "Como escolher plantas para a varanda",
      slug: "escolher-plantas",
      signature: ["plantas", "varanda", "luz", "vasos"],
    }),
    post({
      file: "2026-10-02-ferramentas-de-jardinagem.md",
      title: "Ferramentas básicas para começar a jardinagem",
      slug: "ferramentas-jardinagem",
      signature: ["ferramentas", "jardinagem", "tesoura", "vasos"],
    }),
  ]);

  assert.deepEqual(candidates, []);
});
