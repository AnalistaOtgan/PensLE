import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('exportNotes startup behavior', () => {
  it('does not statically import native export plugins', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/services/exportService.ts'), 'utf8');

    expect(source).not.toMatch(/import\s+.*from ['"]@capacitor\/filesystem['"]/);
    expect(source).not.toMatch(/import\s+.*from ['"]@capacitor\/share['"]/);
    expect(source).not.toContain('@capacitor/filesystem');
    expect(source).not.toContain('@capacitor/share');
  });
});
