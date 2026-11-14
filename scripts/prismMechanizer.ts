import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { codeHash, describe } from 'prism-code/canonical';

/**
 * Deterministic Prism LexLean (.lex.tex) AST Mechanizer & TypeScript Transpiler.
 *
 * Bridges the full 9-facet Prism model (`prism/spec.json` + 15 `.lex.tex` modules
 * across Application, Proofs, Architecture, Design, Features, Security, Quality,
 * Compliance, Kinematics, Pickups, NpcBehavior, OpenWorld, and Leaderboard)
 * directly into executable TypeScript (`src/game/generatedPrismRuntime.ts`,
 * `src/game/generatedPrismConstants.ts`, and `CONFORMANCE.md`) with zero
 * hand-duplicated constants.
 */

export interface LexFieldDecl {
  name: string;
  type: string;
}

export interface LexInductiveDecl {
  moduleName: string;
  name: string;
  constructors: { name: string; fields: LexFieldDecl[] }[];
}

export interface LexStructureDecl {
  moduleName: string;
  name: string;
  fields: LexFieldDecl[];
}

export interface LexParamDecl {
  name: string;
  type: string;
}

export interface LexFullDefinition {
  moduleName: string;
  name: string;
  parameters: LexParamDecl[];
  resultType: string;
  bodyRaw: string;
  executable: boolean;
}

export interface LexFullTheorem {
  moduleName: string;
  name: string;
  parameters: LexParamDecl[];
  statementRaw: string;
  proofTactic: string;
  axioms: string[];
}

export interface FullLexModule {
  moduleName: string;
  filePath: string;
  relPath: string;
  facetCategory: string;
  rawText: string;
  codeDigest: string;
  imports: string[];
  inductives: LexInductiveDecl[];
  structures: LexStructureDecl[];
  definitions: Map<string, LexFullDefinition>;
  theorems: LexFullTheorem[];
}

export interface HostedAttestationSummary {
  attestationId: string;
  buildId: string;
  verifiedAt: string;
  semanticId: string;
  modules: string[];
}

const JS_RESERVED = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

function safeIdent(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_$]/g, '_');
  return JS_RESERVED.has(cleaned) ? `_${cleaned}` : cleaned;
}

export function moduleToTsSlug(moduleName: string): string {
  return moduleName.replace(/\./g, '_');
}

function classifyFacetCategory(moduleName: string): string {
  if (moduleName === 'PrismSerpent') return 'Application';
  if (moduleName === 'PrismSerpentProofs') return 'Behavior & Proofs';
  if (moduleName.includes('.Architecture.')) return 'Architecture (ISO 42010)';
  if (moduleName.includes('.Design.')) return 'Design Views (OPM / UML)';
  if (moduleName.includes('.Features.')) return 'Features & Journeys (ISO 9241)';
  if (moduleName.includes('.Security.')) return 'Security & Threat Model (STRIDE)';
  if (moduleName.includes('.Quality.')) return 'Product Quality (ISO 25010)';
  if (moduleName.includes('.Compliance.')) return 'System & Provenance (W3C PROV-O)';
  if (
    moduleName.includes('.Kinematics.') ||
    moduleName.includes('.Pickups.') ||
    moduleName.includes('.NpcBehavior.') ||
    moduleName.includes('.OpenWorld.') ||
    moduleName.includes('.Leaderboard.')
  ) {
    return 'Extension Facet (Game Domain)';
  }
  return 'Foundation Core';
}

function findBalanced(
  text: string,
  openIdx: number,
  openCh: string,
  closeCh: string,
): { content: string; endIdx: number } {
  let depth = 0;
  let inStr = false;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && text[i - 1] !== '\\') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) {
        return { content: text.slice(openIdx + 1, i), endIdx: i };
      }
    }
  }
  throw new Error(`Unbalanced '${openCh}' starting at ${openIdx}`);
}

function splitTopLevelCommas(inner: string): string[] {
  const out: string[] = [];
  let p = 0;
  let b = 0;
  let c = 0;
  let inStr = false;
  let start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"' && inner[i - 1] !== '\\') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '(') p++;
    else if (ch === ')') p--;
    else if (ch === '[') b++;
    else if (ch === ']') b--;
    else if (ch === '{') c++;
    else if (ch === '}') c--;
    else if (ch === ',' && p === 0 && b === 0 && c === 0) {
      const part = inner.slice(start, i).trim();
      if (part) out.push(part);
      start = i + 1;
    }
  }
  const tail = inner.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

function extractBlockField(blockContent: string, fieldName: string): string | null {
  const regex = new RegExp(`(?:^|,|\\n)\\s*${fieldName}\\s*:\\s*`, 'm');
  const match = regex.exec(blockContent);
  if (!match) return null;
  const start = match.index + match[0].length;
  let p = 0;
  let b = 0;
  let c = 0;
  let inStr = false;
  let i = start;
  for (; i < blockContent.length; i++) {
    const ch = blockContent[i];
    if (ch === '"' && blockContent[i - 1] !== '\\') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '(') p++;
    else if (ch === ')') p--;
    else if (ch === '[') b++;
    else if (ch === ']') b--;
    else if (ch === '{') c++;
    else if (ch === '}') c--;
    else if (ch === ',' && p === 0 && b === 0 && c === 0) {
      break;
    }
  }
  return blockContent.slice(start, i).trim();
}

function parseParams(raw: string | null): LexParamDecl[] {
  if (!raw) return [];
  const t = raw.trim();
  const inner = t.startsWith('[') && t.endsWith(']') ? t.slice(1, -1).trim() : t;
  if (!inner) return [];
  return splitTopLevelCommas(inner).map((item) => {
    const idx = item.indexOf(':');
    if (idx === -1) return { name: item.trim(), type: 'Nat' };
    return { name: item.slice(0, idx).trim(), type: item.slice(idx + 1).trim() };
  });
}

function parseFields(raw: string | null): LexFieldDecl[] {
  if (!raw) return [];
  const t = raw.trim();
  const inner = t.startsWith('[') && t.endsWith(']') ? t.slice(1, -1).trim() : t;
  if (!inner) return [];
  return splitTopLevelCommas(inner).map((item) => {
    const bIdx = item.indexOf('{');
    const body = bIdx !== -1 ? findBalanced(item, bIdx, '{', '}').content : item;
    return {
      name: extractBlockField(body, 'name') ?? 'unknown',
      type: extractBlockField(body, 'type') ?? 'Nat',
    };
  });
}

export function parseLexModule(filePath: string, prismDir: string): FullLexModule {
  const rawText = fs.readFileSync(filePath, 'utf8');
  const modMatch = rawText.match(/\\begin\{lexlean\}\{([^}]+)\}/);
  const moduleName = modMatch ? modMatch[1] : path.basename(filePath, '.lex.tex');
  const relPath = path.relative(prismDir, filePath).replace(/\\/g, '/');
  const codeDigest = codeHash(rawText);

  const imports: string[] = [];
  const impRegex = /\\importmodule\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = impRegex.exec(rawText)) !== null) {
    imports.push(m[1]);
  }

  const inductives: LexInductiveDecl[] = [];
  const structures: LexStructureDecl[] = [];
  const definitions = new Map<string, LexFullDefinition>();
  const theorems: LexFullTheorem[] = [];

  const declRegex = /\b(inductive|structure|definition|theorem)\s*\{/g;
  let dm: RegExpExecArray | null;
  while ((dm = declRegex.exec(rawText)) !== null) {
    const kind = dm[1];
    const openIdx = dm.index + dm[0].length - 1;
    const { content, endIdx } = findBalanced(rawText, openIdx, '{', '}');
    declRegex.lastIndex = endIdx + 1;
    const name = extractBlockField(content, 'name');
    if (!name) continue;

    if (kind === 'inductive') {
      const ctorsRaw = extractBlockField(content, 'constructors') ?? '[]';
      const inner =
        ctorsRaw.startsWith('[') && ctorsRaw.endsWith(']') ? ctorsRaw.slice(1, -1).trim() : ctorsRaw;
      const constructors = inner
        ? splitTopLevelCommas(inner).map((ci) => {
            const bi = ci.indexOf('{');
            const cb = bi !== -1 ? findBalanced(ci, bi, '{', '}').content : ci;
            return {
              name: extractBlockField(cb, 'name') ?? 'Unknown',
              fields: parseFields(extractBlockField(cb, 'fields')),
            };
          })
        : [];
      inductives.push({ moduleName, name, constructors });
    } else if (kind === 'structure') {
      structures.push({
        moduleName,
        name,
        fields: parseFields(extractBlockField(content, 'fields')),
      });
    } else if (kind === 'definition') {
      definitions.set(name, {
        moduleName,
        name,
        parameters: parseParams(extractBlockField(content, 'parameters')),
        resultType: extractBlockField(content, 'result') ?? 'Nat',
        bodyRaw: extractBlockField(content, 'body') ?? '0',
        executable: extractBlockField(content, 'executable') === 'true',
      });
    } else if (kind === 'theorem') {
      const proofRaw = extractBlockField(content, 'proof') ?? 'decide{}';
      const tacticMatch = proofRaw.match(/^([a-zA-Z0-9_]+)/);
      const axiomsRaw = extractBlockField(content, 'axioms') ?? '[]';
      const axInner =
        axiomsRaw.startsWith('[') && axiomsRaw.endsWith(']')
          ? axiomsRaw.slice(1, -1).trim()
          : '';
      theorems.push({
        moduleName,
        name,
        parameters: parseParams(extractBlockField(content, 'parameters')),
        statementRaw: extractBlockField(content, 'statement') ?? '',
        proofTactic: tacticMatch ? tacticMatch[1] : 'decide',
        axioms: axInner ? splitTopLevelCommas(axInner) : [],
      });
    }
  }

  return {
    moduleName,
    filePath,
    relPath,
    facetCategory: classifyFacetCategory(moduleName),
    rawText,
    codeDigest,
    imports,
    inductives,
    structures,
    definitions,
    theorems,
  };
}

function stripOuterParens(raw: string): string {
  let s = raw.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    const { endIdx } = findBalanced(s, 0, '(', ')');
    if (endIdx === s.length - 1) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

function tokenizeTopLevel(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    while (i < expr.length && /\s/.test(expr[i])) i++;
    if (i >= expr.length) break;
    const ch = expr[i];
    if (ch === '(') {
      const { endIdx } = findBalanced(expr, i, '(', ')');
      tokens.push(expr.slice(i, endIdx + 1));
      i = endIdx + 1;
    } else if (ch === '[') {
      const { endIdx } = findBalanced(expr, i, '[', ']');
      tokens.push(expr.slice(i, endIdx + 1));
      i = endIdx + 1;
    } else if (ch === '{') {
      const { endIdx } = findBalanced(expr, i, '{', '}');
      tokens.push(expr.slice(i, endIdx + 1));
      i = endIdx + 1;
    } else if (ch === '"') {
      let j = i + 1;
      while (j < expr.length && !(expr[j] === '"' && expr[j - 1] !== '\\')) j++;
      tokens.push(expr.slice(i, j + 1));
      i = j + 1;
    } else {
      let j = i;
      while (j < expr.length && !/\s/.test(expr[j]) && !'()[]{}'.includes(expr[j])) j++;
      tokens.push(expr.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

function findTopKeyword(
  expr: string,
  keyword: string,
  fromIdx = 0,
): { index: number; length: number } | null {
  let p = 0;
  let b = 0;
  let c = 0;
  let inStr = false;
  for (let i = fromIdx; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"' && expr[i - 1] !== '\\') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '(') p++;
    else if (ch === ')') p--;
    else if (ch === '[') b++;
    else if (ch === ']') b--;
    else if (ch === '{') c++;
    else if (ch === '}') c--;
    else if (p === 0 && b === 0 && c === 0 && /\s/.test(ch)) {
      const m = new RegExp(`^\\s+${keyword}\\s+`).exec(expr.slice(i));
      if (m) return { index: i, length: m[0].length };
    }
  }
  return null;
}

function findTopBinaryOp(
  expr: string,
  op: string,
): { left: string; right: string } | null {
  let p = 0;
  let b = 0;
  let c = 0;
  let inStr = false;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"' && expr[i - 1] !== '\\') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === '(') p++;
    else if (ch === ')') p--;
    else if (ch === '[') b++;
    else if (ch === ']') b--;
    else if (ch === '{') c++;
    else if (ch === '}') c--;
    else if (p === 0 && b === 0 && c === 0) {
      const prevOk = i === 0 || /\s/.test(expr[i - 1]);
      const nextIdx = i + op.length;
      const nextOk = nextIdx < expr.length && /\s/.test(expr[nextIdx]);
      if (prevOk && nextOk && expr.slice(i, nextIdx) === op) {
        return {
          left: expr.slice(0, i).trim(),
          right: expr.slice(nextIdx).trim(),
        };
      }
    }
  }
  return null;
}

function compileLexType(
  rawType: string,
  currentModule: string,
  moduleMap: Map<string, FullLexModule>,
): string {
  const t = stripOuterParens(rawType);
  if (t === 'Nat' || t.startsWith('UInt')) return 'bigint';
  if (t === 'Bool') return 'boolean';
  if (t === 'String') return 'string';
  if (t === 'Bytes') return 'PrismBytes';
  if (t === 'Ordering') return 'PrismOrdering';
  if (t.startsWith('Option ')) {
    const inner = compileLexType(t.slice(7).trim(), currentModule, moduleMap);
    return `PrismOption<${inner}>`;
  }
  if (t.startsWith('List ')) {
    const inner = compileLexType(t.slice(5).trim(), currentModule, moduleMap);
    return `ReadonlyArray<${inner}>`;
  }
  if (t.includes('::')) {
    const [mod, name] = t.split('::');
    return `${moduleToTsSlug(mod)}_${name}`;
  }
  const curMod = moduleMap.get(currentModule);
  if (
    curMod &&
    (curMod.structures.some((s) => s.name === t) || curMod.inductives.some((i) => i.name === t))
  ) {
    return `${moduleToTsSlug(currentModule)}_${t}`;
  }
  for (const imp of curMod?.imports ?? []) {
    const impMod = moduleMap.get(imp);
    if (
      impMod &&
      (impMod.structures.some((s) => s.name === t) || impMod.inductives.some((i) => i.name === t))
    ) {
      return `${moduleToTsSlug(imp)}_${t}`;
    }
  }
  return 'unknown';
}

interface CompileCtx {
  currentModule: string;
  moduleMap: Map<string, FullLexModule>;
  tempCounter: number;
}

function compileExpr(exprRaw: string, ctx: CompileCtx, locals: Record<string, string>): string {
  const expr = stripOuterParens(exprRaw);
  if (expr === 'true') return 'true';
  if (expr === 'false') return 'false';
  if (/^\d+$/.test(expr)) return `${expr}n`;
  if (/^0x[0-9a-fA-F]*$/.test(expr)) return `_hex(${JSON.stringify(expr.slice(2))})`;
  if (expr.startsWith('"') && expr.endsWith('"')) return expr;

  const typedUint = expr.match(/^(\d+)\s*:\s*UInt\d+$/);
  if (typedUint) return `${typedUint[1]}n`;

  if (Object.prototype.hasOwnProperty.call(locals, expr)) {
    return locals[expr];
  }

  // `let x : T := val; body`
  if (expr.startsWith('let ')) {
    const assignIdx = expr.indexOf(':=');
    if (assignIdx !== -1) {
      const varHeader = expr.slice(4, assignIdx).trim();
      const rawVar = varHeader.split(':')[0].trim();
      let p = 0;
      let b = 0;
      let c = 0;
      let inStr = false;
      let semiIdx = -1;
      for (let i = assignIdx + 2; i < expr.length; i++) {
        const ch = expr[i];
        if (ch === '"' && expr[i - 1] !== '\\') inStr = !inStr;
        if (inStr) continue;
        if (ch === '(') p++;
        else if (ch === ')') p--;
        else if (ch === '[') b++;
        else if (ch === ']') b--;
        else if (ch === '{') c++;
        else if (ch === '}') c--;
        else if (ch === ';' && p === 0 && b === 0 && c === 0) {
          semiIdx = i;
          break;
        }
      }
      if (semiIdx !== -1) {
        const valCode = compileExpr(expr.slice(assignIdx + 2, semiIdx), ctx, locals);
        const tsVar = `${safeIdent(rawVar)}_${++ctx.tempCounter}`;
        const bodyCode = compileExpr(expr.slice(semiIdx + 1), ctx, {
          ...locals,
          [rawVar]: tsVar,
        });
        return `((${tsVar}) => ${bodyCode})(${valCode})`;
      }
    }
  }

  // `record Struct { k := v, ... }`
  if (expr.startsWith('record ')) {
    const bStart = expr.indexOf('{');
    const structType = compileLexType(
      expr.slice(7, bStart).trim(),
      ctx.currentModule,
      ctx.moduleMap,
    );
    const { content } = findBalanced(expr, bStart, '{', '}');
    const fields = splitTopLevelCommas(content).map((f) => {
      const eq = f.indexOf(':=');
      const k = f.slice(0, eq).trim();
      const v = compileExpr(f.slice(eq + 2).trim(), ctx, locals);
      return `${k}: ${v}`;
    });
    return `({ ${fields.join(', ')} } as ${structType})`;
  }

  // `if c then t else e`
  if (expr.startsWith('if ') || expr.startsWith('if\n')) {
    const thenK = findTopKeyword(expr, 'then', 2);
    if (!thenK) throw new Error(`Missing then in ${ctx.currentModule}: ${expr}`);
    const elseK = findTopKeyword(expr, 'else', thenK.index + thenK.length);
    if (!elseK) throw new Error(`Missing else in ${ctx.currentModule}: ${expr}`);
    const cCode = compileExpr(expr.slice(2, thenK.index), ctx, locals);
    const tCode = compileExpr(expr.slice(thenK.index + thenK.length, elseK.index), ctx, locals);
    const eCode = compileExpr(expr.slice(elseK.index + elseK.length), ctx, locals);
    return `(${cCode} ? ${tCode} : ${eCode})`;
  }

  // `match scrut | pat1 => body1 | pat2 => body2`
  if (expr.startsWith('match ')) {
    let p = 0;
    let b = 0;
    let c = 0;
    let inStr = false;
    const bars: number[] = [];
    for (let i = 6; i < expr.length; i++) {
      const ch = expr[i];
      if (ch === '"' && expr[i - 1] !== '\\') inStr = !inStr;
      if (inStr) continue;
      if (ch === '(') p++;
      else if (ch === ')') p--;
      else if (ch === '[') b++;
      else if (ch === ']') b--;
      else if (ch === '{') c++;
      else if (ch === '}') c--;
      else if (ch === '|' && p === 0 && b === 0 && c === 0) bars.push(i);
    }
    const scrutCode = compileExpr(expr.slice(6, bars[0]), ctx, locals);
    const scrutVar = `_s${++ctx.tempCounter}`;
    const arms = bars.map((idx, a) => {
      const end = a + 1 < bars.length ? bars[a + 1] : expr.length;
      const seg = expr.slice(idx + 1, end).trim();
      const arr = seg.indexOf('=>');
      return { pat: seg.slice(0, arr).trim(), body: seg.slice(arr + 2).trim() };
    });

    const noneArm = arms.find((a) => a.pat === 'Option.none');
    const someArm = arms.find((a) => a.pat.startsWith('Option.some '));
    if (noneArm && someArm) {
      const bindRaw = someArm.pat.slice('Option.some '.length).trim();
      const bindVar = `${safeIdent(bindRaw)}_${++ctx.tempCounter}`;
      const noneCode = compileExpr(noneArm.body, ctx, locals);
      const someCode = compileExpr(someArm.body, ctx, { ...locals, [bindRaw]: bindVar });
      return `((${scrutVar}) => ${scrutVar}.tag === 'none' ? ${noneCode} : ((${bindVar}) => ${someCode})(${scrutVar}.value))(${scrutCode})`;
    }

    const zeroArm = arms.find((a) => a.pat === 'Nat.zero');
    const succArm = arms.find((a) => a.pat.startsWith('Nat.succ '));
    if (zeroArm && succArm) {
      const bindRaw = succArm.pat.slice('Nat.succ '.length).trim();
      const bindVar = `${safeIdent(bindRaw)}_${++ctx.tempCounter}`;
      const zeroCode = compileExpr(zeroArm.body, ctx, locals);
      const succCode = compileExpr(succArm.body, ctx, { ...locals, [bindRaw]: bindVar });
      return `((${scrutVar}) => ${scrutVar} <= 0n ? ${zeroCode} : ((${bindVar}) => ${succCode})(${scrutVar} - 1n))(${scrutCode})`;
    }
    throw new Error(`Unsupported match arms in ${ctx.currentModule}: ${expr}`);
  }

  // Binary operators by precedence
  const binOps: [string, string][] = [
    ['||', '||'],
    ['&&', '&&'],
    ['=?', '==='],
    ['<=?', '<='],
    ['<?', '<'],
    ['+', '+'],
  ];
  for (const [lexOp, tsOp] of binOps) {
    const split = findTopBinaryOp(expr, lexOp);
    if (split) {
      const l = compileExpr(split.left, ctx, locals);
      const r = compileExpr(split.right, ctx, locals);
      return `(${l} ${tsOp} ${r})`;
    }
  }

  const tokens = tokenizeTopLevel(expr);
  if (tokens.length === 0) return '0n';

  if (tokens[0] === 'not') {
    return `(!${compileExpr(tokens.slice(1).join(' '), ctx, locals)})`;
  }
  if (tokens[0] === 'project') {
    const obj = compileExpr(tokens[1], ctx, locals);
    return `${obj}.${tokens[2]}`;
  }
  if (tokens[0] === 'ctor') {
    const ctorName = tokens[1];
    const innerT = compileLexType(
      tokens[2]?.replace(/^\[|\]$/g, '').trim() ?? 'Nat',
      ctx.currentModule,
      ctx.moduleMap,
    );
    if (ctorName === 'Option.none') return `({ tag: 'none' } as PrismOption<${innerT}>)`;
    if (ctorName === 'Option.some') {
      const v = compileExpr(tokens[3], ctx, locals);
      return `({ tag: 'some', value: ${v} } as PrismOption<${innerT}>)`;
    }
    return `{ tag: ${JSON.stringify(ctorName)} }`;
  }
  if (tokens[0] === 'nil') {
    const elemT = compileLexType(tokens.slice(1).join(' '), ctx.currentModule, ctx.moduleMap);
    return `([] as ReadonlyArray<${elemT}>)`;
  }
  if (tokens[0] === 'cons') {
    const head = compileExpr(tokens[1], ctx, locals);
    const tail = compileExpr(tokens[2], ctx, locals);
    return `[${head}, ...${tail}]`;
  }
  if (tokens[0] === 'prim') {
    const op = tokens[1];
    const colon = tokens.indexOf(':');
    const rawArgs = colon === -1 ? tokens.slice(2) : tokens.slice(2, colon);
    const args = rawArgs.map((a) => compileExpr(a, ctx, locals));
    switch (op) {
      case 'multiply':
        return `(${args[0]} * ${args[1]})`;
      case 'subtract':
        return `_natSub(${args[0]}, ${args[1]})`;
      case 'equal':
        return `_valEq(${args[0]}, ${args[1]})`;
      case 'length':
        return `BigInt(${args[0]}.length)`;
      case 'to_nat':
        return `${args[0]}`;
      case 'index':
        return `_bytesIndex(${args[0]}, ${args[1]})`;
      case 'slice':
        return `_bytesSlice(${args[0]}, ${args[1]}, ${args[2]})`;
      case 'append':
        return `_bytesAppend(${args[0]}, ${args[1]})`;
      case 'compare_bytes':
        return `_bytesCmp(${args[0]}, ${args[1]})`;
      default:
        throw new Error(`Unsupported prim '${op}' in ${ctx.currentModule}`);
    }
  }

  // Function/definition call
  const fnTok = tokens[0];
  let targetMod = ctx.currentModule;
  let defName = fnTok;
  if (fnTok.includes('::')) {
    const parts = fnTok.split('::');
    targetMod = parts[0];
    defName = parts[1];
  }
  const modObj = ctx.moduleMap.get(targetMod);
  if (!modObj || !modObj.definitions.has(defName)) {
    throw new Error(`Unknown definition '${targetMod}::${defName}' in ${ctx.currentModule}`);
  }
  const cArgs = tokens.slice(1).map((t) => compileExpr(t, ctx, locals));
  return `${moduleToTsSlug(targetMod)}_${defName}(${cArgs.join(', ')})`;
}

function topoSortModules(modules: FullLexModule[]): FullLexModule[] {
  const byName = new Map(modules.map((m) => [m.moduleName, m]));
  const visited = new Set<string>();
  const out: FullLexModule[] = [];
  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const mod = byName.get(name);
    if (!mod) return;
    for (const imp of mod.imports) visit(imp);
    out.push(mod);
  }
  for (const mod of modules) visit(mod.moduleName);
  return out;
}

function readHostedAttestations(prismDir: string): HostedAttestationSummary[] {
  const hostedDir = path.join(prismDir, '.lexlean', 'hosted');
  if (!fs.existsSync(hostedDir)) return [];
  const files = fs
    .readdirSync(hostedDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  return files.map((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(hostedDir, file), 'utf8'));
    return {
      attestationId: String(data.attestation_id ?? file.replace('.json', '')),
      buildId: String(data.build_id ?? ''),
      verifiedAt: String(data.verified_at ?? ''),
      semanticId: String(data.semantic_id ?? ''),
      modules: Array.isArray(data.modules) ? data.modules.map(String) : [],
    };
  });
}

function writeOrCheckFile(
  filePath: string,
  content: string,
  checkOnly: boolean,
  driftedFiles: string[],
): boolean {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) {
    return false;
  }
  if (checkOnly) {
    driftedFiles.push(filePath);
    return true;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

export function synchronizePrismArtifacts(
  projectRoot: string,
  options: { checkOnly?: boolean } = {},
): {
  modulesCount: number;
  definitionsCount: number;
  theoremsCount: number;
  specCodeHash: string;
  driftedFiles: string[];
} {
  const checkOnly = Boolean(options.checkOnly);
  const driftedFiles: string[] = [];
  const prismDir = path.join(projectRoot, 'prism');
  const specPath = path.join(prismDir, 'spec.json');
  const specRaw = fs.readFileSync(specPath, 'utf8');
  const specFacts = describe(specRaw);
  const specJson = JSON.parse(specRaw);

  const sessionPath = path.join(prismDir, 'session.json');
  const sessionJson = fs.existsSync(sessionPath)
    ? JSON.parse(fs.readFileSync(sessionPath, 'utf8'))
    : { status: {} };
  const specAddress = String(
    sessionJson?.status?.specAddress ??
      `sha256:${crypto.createHash('sha256').update(specRaw).digest('hex')}`,
  );

  // Collect all .lex.tex files
  const lexFiles: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.lex.tex')) lexFiles.push(full);
    }
  }
  walk(path.join(prismDir, 'src'));
  lexFiles.sort();

  const parsed = lexFiles.map((f) => parseLexModule(f, prismDir));
  const sorted = topoSortModules(parsed);
  const moduleMap = new Map(sorted.map((m) => [m.moduleName, m]));

  // Generate src/game/generatedPrismRuntime.ts
  const runtimeLines: string[] = [
    '// AUTO-GENERATED BY `scripts/prismMechanizer.ts` FROM `/prism/src/**/*.lex.tex`.',
    '// DO NOT EDIT BY HAND — SINGLE SOURCE OF TRUTH (`uor/template-contract/1` Rule R1).',
    '',
    'export type PrismBytes = Uint8Array;',
    "export type PrismOrdering = 'lt' | 'eq' | 'gt';",
    'export type PrismOption<T> =',
    "  | { readonly tag: 'none' }",
    "  | { readonly tag: 'some'; readonly value: T };",
    '',
    'const _encoder = new TextEncoder();',
    'const _decoder = new TextDecoder("utf-8", { fatal: false });',
    'const _hexCache = new Map<string, Uint8Array>();',
    '',
    'function _hex(hex: string): Uint8Array {',
    '  const hit = _hexCache.get(hex);',
    '  if (hit) return hit;',
    '  const out = new Uint8Array(hex.length / 2);',
    '  for (let i = 0; i < hex.length; i += 2) {',
    '    out[i >> 1] = parseInt(hex.slice(i, i + 2), 16);',
    '  }',
    '  _hexCache.set(hex, out);',
    '  return out;',
    '}',
    '',
    'export function encodeUtf8ToPrismBytes(text: string): Uint8Array {',
    '  return _encoder.encode(text);',
    '}',
    '',
    'export function decodePrismBytesToUtf8(bytes: Uint8Array): string {',
    '  return _decoder.decode(bytes);',
    '}',
    '',
    'function _natSub(a: bigint, b: bigint): bigint {',
    '  return a > b ? a - b : 0n;',
    '}',
    '',
    'function _valEq(a: unknown, b: unknown): boolean {',
    '  if (a instanceof Uint8Array && b instanceof Uint8Array) {',
    '    if (a.length !== b.length) return false;',
    '    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;',
    '    return true;',
    '  }',
    '  return a === b;',
    '}',
    '',
    'function _bytesIndex(v: Uint8Array, idx: bigint): PrismOption<bigint> {',
    "  if (idx < 0n || idx >= BigInt(v.length)) return { tag: 'none' };",
    "  return { tag: 'some', value: BigInt(v[Number(idx)]) };",
    '}',
    '',
    'function _bytesSlice(v: Uint8Array, start: bigint, count: bigint): PrismOption<Uint8Array> {',
    '  const len = BigInt(v.length);',
    "  if (start < 0n || count < 0n || start + count > len) return { tag: 'none' };",
    '  const s = Number(start);',
    "  return { tag: 'some', value: v.subarray(s, s + Number(count)) };",
    '}',
    '',
    'function _bytesAppend(a: Uint8Array, b: Uint8Array): Uint8Array {',
    '  const out = new Uint8Array(a.length + b.length);',
    '  out.set(a, 0);',
    '  out.set(b, a.length);',
    '  return out;',
    '}',
    '',
    'function _bytesCmp(a: Uint8Array, b: Uint8Array): PrismOrdering {',
    '  const n = Math.min(a.length, b.length);',
    '  for (let i = 0; i < n; i++) {',
    "    if (a[i] < b[i]) return 'lt';",
    "    if (a[i] > b[i]) return 'gt';",
    '  }',
    "  return a.length < b.length ? 'lt' : a.length > b.length ? 'gt' : 'eq';",
    '}',
    '',
  ];

  let totalDefs = 0;
  let totalTheorems = 0;

  for (const mod of sorted) {
    const slug = moduleToTsSlug(mod.moduleName);
    runtimeLines.push(`// === Module: ${mod.moduleName} (${mod.facetCategory}) ===`);
    for (const ind of mod.inductives) {
      const union = ind.constructors
        .map((c) => `{ readonly tag: ${JSON.stringify(c.name)} }`)
        .join(' | ');
      runtimeLines.push(`export type ${slug}_${ind.name} = ${union || 'never'};`);
    }
    for (const st of mod.structures) {
      runtimeLines.push(`export interface ${slug}_${st.name} {`);
      for (const f of st.fields) {
        runtimeLines.push(
          `  readonly ${f.name}: ${compileLexType(f.type, mod.moduleName, moduleMap)};`,
        );
      }
      runtimeLines.push('}');
    }
    const ctx: CompileCtx = { currentModule: mod.moduleName, moduleMap, tempCounter: 0 };
    for (const def of mod.definitions.values()) {
      totalDefs++;
      const locals: Record<string, string> = {};
      const paramDecls = def.parameters.map((p) => {
        const tsName = safeIdent(p.name);
        locals[p.name] = tsName;
        return `${tsName}: ${compileLexType(p.type, mod.moduleName, moduleMap)}`;
      });
      const retType = compileLexType(def.resultType, mod.moduleName, moduleMap);
      const bodyTs = compileExpr(def.bodyRaw, ctx, locals);
      runtimeLines.push(
        `export function ${slug}_${def.name}(${paramDecls.join(', ')}): ${retType} {`,
      );
      runtimeLines.push(`  return ${bodyTs};`);
      runtimeLines.push('}');
    }
    totalTheorems += mod.theorems.length;
    runtimeLines.push('');
  }

  writeOrCheckFile(
    path.join(projectRoot, 'src', 'game', 'generatedPrismRuntime.ts'),
    runtimeLines.join('\n'),
    checkOnly,
    driftedFiles,
  );

  // Build facet & theorem manifest for generatedPrismConstants.ts
  const hostedAttestations = readHostedAttestations(prismDir);
  const moduleSummaries = sorted.map((m) => ({
    moduleName: m.moduleName,
    relPath: m.relPath,
    facetCategory: m.facetCategory,
    codeDigest: m.codeDigest,
    structuresCount: m.structures.length,
    definitionsCount: m.definitions.size,
    theorems: m.theorems.map((t) => ({
      name: t.name,
      proofTactic: t.proofTactic,
      axioms: t.axioms,
    })),
  }));

  const constantsLines = [
    '// AUTO-GENERATED BY `scripts/prismMechanizer.ts` FROM `prism/spec.json` & `prism/src/**/*.lex.tex`.',
    '// DO NOT EDIT BY HAND (`uor/template-contract/1` Rule R1).',
    '',
    `export const PRISM_SPEC_CANONICAL_HASH = ${JSON.stringify(specFacts.hash)} as const;`,
    `export const PRISM_SPEC_ADDRESS = ${JSON.stringify(specAddress)} as const;`,
    `export const PRISM_SPEC_DOCUMENT = ${JSON.stringify(specJson, null, 2)} as const;`,
    `export const PRISM_MODULE_CATALOG = ${JSON.stringify(moduleSummaries, null, 2)} as const;`,
    `export const PRISM_HOSTED_ATTESTATIONS = ${JSON.stringify(hostedAttestations, null, 2)} as const;`,
    '',
  ];

  writeOrCheckFile(
    path.join(projectRoot, 'src', 'game', 'generatedPrismConstants.ts'),
    constantsLines.join('\n'),
    checkOnly,
    driftedFiles,
  );

  // Generate CONFORMANCE.md
  const conformanceLines = [
    '# Prism Serpent: Neon Sovereign — Mechanized Conformance & Facet Ledger',
    '',
    '<!-- AUTO-GENERATED BY `scripts/prismMechanizer.ts` (`npm run prism:mechanize`). DO NOT EDIT BY HAND (`R1`). -->',
    '',
    `- **Specification Schema**: \`${specJson.schema}\` (\`prism/spec.json\`)`,
    `- **Canonical Spec Code Hash (\`prism-code/canonical\`)**: \`${specFacts.hash}\``,
    `- **UOR Content Address (\`specAddress\`)**: \`${specAddress}\``,
    `- **Compiled LexLean Modules**: \`${sorted.length}\` (\`${totalDefs}\` definitions, \`${totalTheorems}\` formal theorems)`,
    `- **Hosted Lean 4.32 Kernel Receipts**: \`${hostedAttestations.length}\``,
    '',
    '## 1. Full 9-Facet Prism Module Catalog (`prism-devrel` Taxonomy)',
    '',
    '| # | Module | Facet | Definitions | Theorems | Canonical Digest |',
    '| --- | --- | --- | --- | --- | --- |',
    ...moduleSummaries.map(
      (m, idx) =>
        `| ${idx + 1} | \`${m.moduleName}\` | ${m.facetCategory} | ${m.definitionsCount} | ${m.theorems.length} | \`${m.codeDigest.slice(0, 23)}…\` |`,
    ),
    '',
    '## 2. Formally Modeled Properties & Kernel Proofs',
    '',
    '| Module | Theorem | Tactic | Axioms |',
    '| --- | --- | --- | --- |',
    ...sorted.flatMap((m) =>
      m.theorems.map(
        (t) =>
          `| \`${m.moduleName}\` | \`${t.name}\` | \`${t.proofTactic}\` | \`${t.axioms.length ? t.axioms.join(', ') : '0 (Pure Kernel)'}\` |`,
      ),
    ),
    '',
  ];

  writeOrCheckFile(
    path.join(projectRoot, 'CONFORMANCE.md'),
    conformanceLines.join('\n'),
    checkOnly,
    driftedFiles,
  );

  return {
    modulesCount: sorted.length,
    definitionsCount: totalDefs,
    theoremsCount: totalTheorems,
    specCodeHash: specFacts.hash,
    driftedFiles,
  };
}
