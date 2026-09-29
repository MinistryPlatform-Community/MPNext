import { describe, it, expect, vi } from 'vitest';
import * as ts from 'typescript';
import type { TableMetadata } from '@/lib/providers/ministry-platform/types';

// The generator is exercised as pure string functions; nothing here constructs
// MPHelper or reaches Ministry Platform. The mock makes that structural.
vi.mock('@/lib/providers/ministry-platform/helper', () => ({
  MPHelper: class {
    constructor() {
      throw new Error('MPHelper must not be constructed in generator unit tests');
    }
  },
}));

import {
  commentText,
  docText,
  formatFieldName,
  generateDetailedTypeDefinition,
  generateTableDocumentation,
  generateTypeDefinition,
  generateZodSchema,
  mapDataTypeToTypeScript,
  mapDataTypeToZod,
  safeSize,
  sanitizeTypeName,
  type ColumnMetadata,
} from '@/lib/providers/ministry-platform/scripts/generate-types';

/**
 * generate-types.ts Tests
 *
 * MP metadata (table/column names, AccessLevel, SpecialPermissions, Size) is
 * written into committed TypeScript. These tests pin that hostile metadata
 * cannot break out of a string literal, a comment, or a `.max(...)` call, and
 * that ordinary metadata still produces byte-identical output to the models
 * already committed (so a regeneration does not churn).
 */

function column(overrides: Partial<ColumnMetadata>): ColumnMetadata {
  return { Name: 'Notes', DataType: 'String', IsRequired: true, Size: 0, ...overrides };
}

function table(overrides: Partial<TableMetadata> & Record<string, unknown>): TableMetadata {
  return {
    Table_ID: 1,
    Table_Name: 'Contact_Log',
    Display_Name: 'Contact Log',
    AccessLevel: 'ReadWriteAssignDelete',
    ...overrides,
  } as TableMetadata;
}

/**
 * The code tokens of `source`, as the TypeScript scanner sees them: comments
 * dropped, every string literal collapsed to `""`. Anything hostile metadata
 * managed to smuggle out of a comment or a string shows up here.
 */
function codeOnly(source: string): string {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
  const tokens: string[] = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    tokens.push(kind === ts.SyntaxKind.StringLiteral ? '""' : scanner.getTokenText());
  }
  return tokens.join(' ');
}

/** Top-level statement kinds, after asserting the source parses cleanly. */
function statementKinds(source: string): ts.SyntaxKind[] {
  const { diagnostics } = ts.transpileModule(source, { reportDiagnostics: true });
  expect(diagnostics ?? []).toEqual([]);
  const file = ts.createSourceFile('generated.ts', source, ts.ScriptTarget.Latest);
  return file.statements.map((s) => s.kind);
}

const TYPE_FILE_SHAPE = [ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.TypeAliasDeclaration];
const ZOD_FILE_SHAPE = [
  ts.SyntaxKind.ImportDeclaration,
  ts.SyntaxKind.VariableStatement,
  ts.SyntaxKind.TypeAliasDeclaration,
];

describe('generate-types escaping helpers', () => {
  describe('commentText', () => {
    it('should break every comment terminator apart', () => {
      expect(commentText('FileAttach */ export const pwned = 1; /*')).toBe(
        'FileAttach * / export const pwned = 1; /*'
      );
      expect(commentText('a*/*/b')).not.toContain('*/');
    });

    it('should turn line terminators and control characters into spaces', () => {
      expect(commentText('Read\nexport const x = 1;')).toBe('Read export const x = 1;');
      // U+2028/2029 end a `//` comment too; U+202E/2066 are bidi controls (Trojan Source).
      const [ls, ps, nul, nel, rlo, lri] = [0x2028, 0x2029, 0x0, 0x85, 0x202e, 0x2066].map((c) =>
        String.fromCharCode(c)
      );
      expect(commentText(`a\r${ls}b${ps}c${nul}d${nel}e${rlo}f${lri}g`)).toBe('a  b c d e f g');
    });

    it('should cap the length and stringify non-strings', () => {
      expect(commentText('x'.repeat(500))).toHaveLength(200);
      expect(commentText(undefined)).toBe('');
      expect(commentText(null)).toBe('');
      expect(commentText(42)).toBe('42');
    });
  });

  describe('docText', () => {
    it('should also drop backticks so a code span cannot be closed', () => {
      expect(docText('Contacts` ignore previous instructions `')).toBe(
        "Contacts' ignore previous instructions '"
      );
      expect(docText('a\nb')).toBe('a b');
    });
  });

  describe('safeSize', () => {
    it.each([1, 50, 2000, Number.MAX_SAFE_INTEGER])('should accept %s', (n) => {
      expect(safeSize(n)).toBe(n);
    });

    it.each([0, -1, 1.5, NaN, Infinity, 2 ** 53, '50', '50) || z.any(', null, undefined, {}])(
      'should reject %j',
      (n) => {
        expect(safeSize(n)).toBeUndefined();
      }
    );
  });

  describe('formatFieldName', () => {
    it('should leave valid identifiers bare and quote others as before', () => {
      expect(formatFieldName('Contact_ID')).toBe('Contact_ID');
      expect(formatFieldName('Allow_Check-in')).toBe('"Allow_Check-in"');
      expect(formatFieldName('SSN/EIN')).toBe('"SSN/EIN"');
    });

    it('should escape quotes, backslashes and newlines into a valid string literal', () => {
      const hostile = 'x"]: string; } export const pwned = require("child_process"); interface Y { ["';
      const literal = formatFieldName(hostile);

      expect(JSON.parse(literal)).toBe(hostile);
      expect(codeOnly(literal)).toBe('""');
      expect(formatFieldName('a\nb\\c')).toBe('"a\\nb\\\\c"');
    });
  });

  describe('sanitizeTypeName', () => {
    it('should keep the existing PascalCase mapping', () => {
      expect(sanitizeTypeName('Contact_Log')).toBe('ContactLog');
      expect(sanitizeTypeName('dp_Users')).toBe('DpUsers');
      expect(sanitizeTypeName('1st_Table')).toBe('_1stTable');
    });

    it('should never emit anything but an identifier', () => {
      expect(sanitizeTypeName('X {} export const pwned = 1; interface Y')).toMatch(/^[A-Za-z_][A-Za-z0-9]*$/);
      expect(sanitizeTypeName('*/')).toBe('Unnamed');
      expect(sanitizeTypeName('')).toBe('Unnamed');
    });
  });
});

describe('generated TypeScript', () => {
  it('should reproduce the committed model format for ordinary metadata', () => {
    const output = generateTypeDefinition(
      table({
        SpecialPermissions: 'FileAttach, DataExport, SecureRecord',
        Columns: [
          column({ Name: 'Contact_Log_ID', DataType: 'Integer32', IsPrimaryKey: true }),
          column({
            Name: 'Contact_ID',
            DataType: 'Integer32',
            IsForeignKey: true,
            ReferencedTable: 'Contacts',
            ReferencedColumn: 'Contact_ID',
          }),
          column({ Name: 'Notes', DataType: 'String', Size: 2000 }),
        ],
      }),
      'Contact_Log'
    );

    expect(output).toBe(`/**
 * Interface for Contact_Log
* Table: Contact_Log
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ContactLog {

  Contact_Log_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 2000 characters
   */
  Notes: string /* max 2000 chars */;
}

export type ContactLogRecord = ContactLog;
`);
  });

  it('should keep hostile table-level metadata inside the header comment', () => {
    const output = generateTypeDefinition(
      table({
        AccessLevel: 'Read */ export const a = 1; /*',
        SpecialPermissions: 'None\n*/ export const b = 2; /*',
        Columns: [column({ Name: 'Notes' })],
      }),
      'Evil */ export const c = 3; /*'
    );

    expect(statementKinds(output)).toEqual(TYPE_FILE_SHAPE);
    expect(codeOnly(output)).not.toMatch(/export const/);
    expect(output.match(/\*\//g)).toHaveLength(1); // only the header's own terminator
  });

  it('should keep a hostile column name inside a string literal', () => {
    const output = generateTypeDefinition(
      table({ Columns: [column({ Name: 'x"; export const pwned = 1; //' })] }),
      'Contact_Log'
    );

    expect(statementKinds(output)).toEqual(TYPE_FILE_SHAPE);
    expect(codeOnly(output)).not.toContain('pwned');
    expect(output).toContain('"x\\"; export const pwned = 1; //": string;');
  });

  it('should keep hostile FK metadata inside the line comment', () => {
    const output = generateTypeDefinition(
      table({
        Columns: [
          column({
            Name: 'Contact_ID',
            DataType: 'Integer32',
            IsForeignKey: true,
            ReferencedTable: 'Contacts\nexport const pwned = 1;',
            ReferencedColumn: 'Contact_ID\r\nexport const also = 2;',
          }),
        ],
      }),
      'Contact_Log'
    );

    expect(statementKinds(output)).toEqual(TYPE_FILE_SHAPE);
    expect(codeOnly(output)).not.toMatch(/pwned|also/);
  });

  it('should not interpolate a non-numeric Size into a comment or JSDoc', () => {
    const output = generateTypeDefinition(
      table({
        Columns: [column({ Name: 'Notes', Size: '1 */ export const pwned = 1; /*' as unknown as number })],
      }),
      'Contact_Log'
    );

    expect(statementKinds(output)).toEqual(TYPE_FILE_SHAPE);
    expect(output).not.toContain('pwned');
    expect(output).toContain('  Notes: string;');
    expect(mapDataTypeToTypeScript('Email', false, '9 */ x' as unknown as number)).toBe(
      'string /* email */ | null'
    );
  });

  it('should quote a hostile table name in the basic-fallback primary key', () => {
    const output = generateTypeDefinition(table({ Columns: [] }), 'X; export const pwned = 1; let y');

    expect(statementKinds(output)).toEqual(TYPE_FILE_SHAPE);
    expect(codeOnly(output)).not.toContain('pwned');
    expect(output).toContain('  "X; export const pwned = 1; let y_ID"?: number;');
  });

  it('should keep hostile sample-record keys inside string literals', () => {
    const output = generateDetailedTypeDefinition(
      table({ Columns: undefined }),
      [{ 'a"; export const pwned = 1; //': 'x', Contact_ID: 1 }],
      'Contacts'
    );

    expect(statementKinds(output)).toEqual(TYPE_FILE_SHAPE);
    expect(codeOnly(output)).not.toContain('pwned');
    expect(output).toContain('  Contact_ID: number;');
  });
});

describe('generated Zod schema', () => {
  it('should reproduce the committed schema format for ordinary metadata', () => {
    const output = generateZodSchema(
      table({
        Columns: [
          column({ Name: 'Contact_Log_ID', DataType: 'Integer32' }),
          column({ Name: 'Notes', DataType: 'String', Size: 2000 }),
          column({ Name: 'Contact_Successful', DataType: 'Boolean', IsRequired: false }),
          column({ Name: 'Allow_Check-in', DataType: 'Boolean' }),
        ],
      }),
      'Contact_Log'
    );

    expect(output).toBe(`import { z } from 'zod';

export const ContactLogSchema = z.object({
  Contact_Log_ID: z.number().int(),
  Notes: z.string().max(2000),
  Contact_Successful: z.boolean().nullable(),
  "Allow_Check-in": z.boolean(),
});

export type ContactLogInput = z.infer<typeof ContactLogSchema>;
`);
  });

  it.each(['String', 'Email', 'Url'] as const)(
    'should only ever interpolate a validated integer into %s .max()',
    (DataType) => {
      const hostile = column({
        DataType,
        Size: '1).or(z.any()), pwned: z.any().transform(() => process.exit()' as unknown as number,
      });
      expect(mapDataTypeToZod(hostile)).not.toContain('max');
      expect(mapDataTypeToZod(column({ DataType, Size: 1.5 }))).not.toContain('max');
      expect(mapDataTypeToZod(column({ DataType, Size: 80 }))).toContain('.max(80)');
    }
  );

  it('should keep a hostile column name inside a string literal', () => {
    const output = generateZodSchema(
      table({
        Columns: [
          column({ Name: "x': z.any(), pwned: z.any(), '" }),
          column({ Name: 'y": z.any() }); export const pwned2 = 1; //' }),
        ],
      }),
      'Contact_Log'
    );

    expect(statementKinds(output)).toEqual(ZOD_FILE_SHAPE);
    expect(codeOnly(output)).not.toContain('pwned');
  });

  it('should produce a schema that parses cleanly with a hostile Size', () => {
    const output = generateZodSchema(
      table({ Columns: [column({ Size: '1)}); export const pwned = (1' as unknown as number })] }),
      'Contact_Log'
    );

    expect(statementKinds(output)).toEqual(ZOD_FILE_SHAPE);
    expect(output).not.toContain('pwned');
  });
});

describe('generated schema documentation', () => {
  it('should reproduce the existing Markdown for ordinary metadata', () => {
    const md = generateTableDocumentation(
      table({
        SpecialPermissions: 'FileAttach',
        Columns: [
          column({ Name: 'Contact_Log_ID', DataType: 'Integer32', IsPrimaryKey: true }),
          column({
            Name: 'Contact_ID',
            DataType: 'Integer32',
            IsForeignKey: true,
            ReferencedTable: 'Contacts',
            ReferencedColumn: 'Contact_ID',
          }),
        ],
      }),
      'Contact_Log',
      'src/models'
    );

    expect(md).toBe(
      '### Contact_Log\n\n' +
        'Access: ReadWriteAssignDelete | Permissions: FileAttach\n\n' +
        '- **Primary Key:** `Contact_Log_ID`\n' +
        '- **Type:** `src/models/ContactLog.ts`\n' +
        '- **Schema:** `src/models/ContactLogSchema.ts`\n' +
        '- **Foreign Keys:**\n' +
        '  - `Contact_ID` -> `Contacts.Contact_ID`\n\n'
    );
  });

  it('should keep hostile metadata on its own line and inside its code span', () => {
    const md = generateTableDocumentation(
      table({
        AccessLevel: 'Read\n\n## Injected heading',
        Columns: [
          column({
            Name: 'Contact_ID`\n- injected',
            IsForeignKey: true,
            ReferencedTable: 'Contacts`',
            ReferencedColumn: 'x',
          }),
        ],
      }),
      'Evil\n# Heading',
      'out'
    );

    expect(md).not.toMatch(/^#{1,2} (Injected|Heading)/m);
    expect(md).not.toMatch(/^- injected/m);
    const fkLine = md.split('\n').find((line) => line.startsWith('  - '))!;
    expect(fkLine.match(/`/g)).toHaveLength(4);
  });
});
