import { assert } from 'deps';

// AC4: Centralized dependencies policy test for view/service
// Ensures external imports in targeted files go through deps.ts

interface ImportIssue {
  file: string;
  line: number;
  source: string;
}

async function collectImportIssues(file: string): Promise<ImportIssue[]> {
  const text = await Deno.readTextFile(file);
  const lines = text.split(/\r?\n/);
  const issues: ImportIssue[] = [];
  const importRe = /^\s*import\s+(?:[^'";]+?from\s+)?['"]([^'"]+)['"];?\s*$/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const m = line.match(importRe);
    if (!m) continue;
    if (m[1] === undefined) continue;
    const spec = m[1];
    const isRelative = spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/');
    const isDeps = spec === 'deps' || spec.endsWith('/deps.ts');
    const isExternal = spec.startsWith('npm:') || spec.startsWith('jsr:') ||
      spec.startsWith('http:') || spec.startsWith('https:');
    if (isExternal && !isDeps) {
      issues.push({ file, line: i + 1, source: spec });
    }
    // Relative and deps imports are okay
    if (isRelative || isDeps) continue;
    // Bare module specifiers (e.g., 'preact') should also be centralized
    const looksBare = !isExternal && !isRelative;
    if (looksBare && !isDeps) {
      issues.push({ file, line: i + 1, source: spec });
    }
  }
  return issues;
}

Deno.test('Centralized deps policy: view/service import via deps.ts', async () => {
  const targets = [
    'src/services/toolkit_service.ts',
    'src/tui/views/ToolkitMenuView.ts',
  ];
  const results = await Promise.all(targets.map((f) => collectImportIssues(f)));
  const issues: ImportIssue[] = results.flat();
  const IS_POLICY_COMPLIANT = issues.length === 0;
  if (!IS_POLICY_COMPLIANT) {
    const details = issues.map((i) => `${i.file}:${i.line} -> ${i.source}`).join('\n');
    assert(
      IS_POLICY_COMPLIANT,
      `Found non-centralized imports; route through deps.ts:\n${details}`,
    );
  }
});
