const fs = require("fs");
const path = require("path");
const siteConfigRaw = require("../site.config.js");
const siteConfig = siteConfigRaw?.default || siteConfigRaw || {};

const dir = path.resolve(__dirname, "..", siteConfig.contentDirectory || "posts");

if (!fs.existsSync(dir)) {
  console.log("Nenhum conteúdo publicado neste site ainda.");
  process.exit(0);
}

const files = fs.readdirSync(dir);

let errors = 0;

console.log(`🔍 Validando ${files.length} posts...\n`);

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), "utf8");

  const hasFrontmatter = content.includes("---");
  const hasDate = /date:\s*"/.test(content);
  const hasTitle = /title:\s*"/.test(content);

  if (!hasFrontmatter) {
    console.log("❌ SEM FRONTMATTER:", file);
    errors++;
  }

  if (!hasDate) {
    console.log("❌ SEM DATE:", file);
    errors++;
  }

  if (!hasTitle) {
    console.log("❌ SEM TITLE:", file);
    errors++;
  }
}

if (errors === 0) {
  console.log("\n✅ TODOS POSTS OK");
} else {
  console.log(`\n⚠️ ERROS ENCONTRADOS: ${errors}`);
}