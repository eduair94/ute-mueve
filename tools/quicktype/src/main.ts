import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quicktype, InputData, jsonInputForTargetLanguage } from 'quicktype-core';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const FIXTURE_DIR = resolve(REPO_ROOT, 'packages/openapi/fixtures');
const OUT_DIR = resolve(REPO_ROOT, 'packages/types/src/generated');

function toPascalCase(name: string): string {
  return name
    .replace(/\.example\.json$/, '')
    .replace(/[-_.]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

async function generateForFixture(file: string) {
  const raw = await readFile(resolve(FIXTURE_DIR, file), 'utf8');
  const typeName = `${toPascalCase(file)}Fixture`;
  const input = jsonInputForTargetLanguage('typescript');
  await input.addSource({ name: typeName, samples: [raw] });
  const inputData = new InputData();
  inputData.addInput(input);
  const result = await quicktype({
    inputData,
    lang: 'typescript',
    rendererOptions: {
      'just-types': 'true',
      'runtime-typecheck': 'false',
      'prefer-unions': 'true',
      'acronym-style': 'pascal',
    },
  });
  const outName = file.replace('.example.json', '.ts');
  const outPath = resolve(OUT_DIR, outName);
  const body = `// AUTO-GENERATED from packages/openapi/fixtures/${file}
// Do NOT edit by hand. Run \`pnpm types:generate\` to refresh.

${result.lines.join('\n')}
`;
  await writeFile(outPath, body, 'utf8');
  console.log(`wrote ${outPath}`);
  return outName.replace('.ts', '');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(FIXTURE_DIR))
    .filter((f) => f.endsWith('.example.json'))
    .sort();
  const moduleNames: string[] = [];
  for (const f of files) {
    moduleNames.push(await generateForFixture(f));
  }
  // Each module gets its own namespace alias to avoid name collisions across fixtures
  // (quicktype names inner array element types `Datum` by default, which collide).
  const indexBody = `// AUTO-GENERATED. Aggregates quicktype-derived types under per-fixture namespaces.
${moduleNames
  .map((m) => {
    const alias = toPascalCase(`${m}.example.json`);
    return `export type * as ${alias} from './${m}.js';`;
  })
  .join('\n')}
`;
  await writeFile(resolve(OUT_DIR, 'index.ts'), indexBody, 'utf8');
  console.log(`wrote ${OUT_DIR}/index.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
