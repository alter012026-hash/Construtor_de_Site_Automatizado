const CATEGORY_META = {
  "Geral": {
    hue: 195, code: "GE",
    description: "Conteúdo informativo desta categoria.",
  },
};

function codeFromName(name) {
  const letters = name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(" ").filter(Boolean);
  if (letters.length === 0) return "GE";
  if (letters.length === 1) return letters[0].slice(0, 2).toUpperCase();
  return (letters[0][0] + letters[1][0]).toUpperCase();
}

function hueFromName(name) {
  let hue = 0;
  for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return hue;
}

function withLegacyColors(meta) {
  const hue = meta.hue;
  return {
    ...meta,
    bg: `hsla(${hue}, 80%, 50%, 0.12)`,
    color: `hsl(${hue}, 70%, 32%)`,
    border: `hsla(${hue}, 80%, 50%, 0.28)`,
  };
}

function getCategoryMeta(name) {
  const key = name || "Geral";
  if (CATEGORY_META[key]) return withLegacyColors(CATEGORY_META[key]);
  return withLegacyColors({
    hue: hueFromName(key),
    code: codeFromName(key),
    description: CATEGORY_META.Geral.description,
  });
}

module.exports = { CATEGORY_META, getCategoryMeta };
