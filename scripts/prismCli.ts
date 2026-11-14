import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { synchronizePrismArtifacts } from './prismMechanizer.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cmd = process.argv[2] ?? 'sync';

async function main() {
  if (cmd === 'sync') {
    const summary = synchronizePrismArtifacts(projectRoot, { checkOnly: false });
    console.log(
      `[prism:mechanize] Synchronized ${summary.modulesCount} LexLean modules (${summary.definitionsCount} definitions, ${summary.theoremsCount} theorems) | specHash=${summary.specCodeHash}`,
    );
    return;
  }

  if (cmd === 'check' || cmd === 'drift' || cmd === 'status') {
    const summary = synchronizePrismArtifacts(projectRoot, { checkOnly: true });
    if (summary.driftedFiles.length > 0) {
      console.error(
        `[prism:drift] FAILED — mechanized artifacts are out of sync with /prism:\n${summary.driftedFiles
          .map((f) => `  - ${path.relative(projectRoot, f)}`)
          .join('\n')}\nRun "npm run prism:mechanize" and commit the updated files.`,
      );
      process.exit(1);
    }

    const { verifyAllPrismInvariants } = await import('../src/game/prismEngine.ts');
    const report = verifyAllPrismInvariants();
    if (!report.allPassed) {
      const failed = report.facetResults.filter((f) => !f.passed);
      console.error('[prism:drift] FAILED — mechanized facet contract violation:', failed);
      process.exit(1);
    }

    console.log(
      `[prism:drift] OK — zero drift across ${summary.modulesCount} LexLean modules (${summary.definitionsCount} defs, ${summary.theoremsCount} theorems) | ${report.acceptancePassed}/${report.acceptanceTotal} acceptance vectors | ${report.hostedAttestationCount} Lean 4.32 receipt(s)`,
    );
    return;
  }

  console.error(`Unknown prismCli command: ${cmd}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
