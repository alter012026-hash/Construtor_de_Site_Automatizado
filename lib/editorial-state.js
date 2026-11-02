const path = require("path");

const STATE_FILES = new Set([
  "content-signatures.json",
  "editorial-drafts.json",
  "manual-drafts.json",
  "quality-log.json",
  "topic-overlap.json",
  "used-topics.json",
]);

function getEditorialStatePath(fileName, contentDirectory) {
  if (!STATE_FILES.has(fileName)) {
    throw new Error("Arquivo de estado editorial inválido.");
  }

  if (!/^posts\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(contentDirectory || "")) {
    throw new Error("A pasta de conteúdo do site é inválida.");
  }

  return `.editorial-state/${contentDirectory.slice("posts/".length)}/${fileName}`;
}

function getLocalEditorialStatePath(fileName, contentDirectory, root = process.cwd()) {
  return path.join(root, ...getEditorialStatePath(fileName, contentDirectory).split("/"));
}

module.exports = {
  getEditorialStatePath,
  getLocalEditorialStatePath,
};
