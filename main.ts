// R29 entrypoint — "The Glassline Run": hands the fresh three.js game in game/
// and its four rendered screenshots to the grader. It mirrors both folders from
// beside this file into the output directory, then writes dossier.json through
// the vendored make.fun library. Local check: MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Mirror the game and its screenshots into the output directory.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
const shotSource = join(repoRoot, 'screenshots');
const shotTarget = join(outputDir, 'screenshots');
mkdirSync(shotTarget, { recursive: true });
if (existsSync(shotSource)) {
  cpSync(shotSource, shotTarget, { recursive: true });
}

// Caps from the scorer's reference gate: at most 4 screenshots of 256 KiB
// each, at most 993 game files totalling 48 MiB, no game path over 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
