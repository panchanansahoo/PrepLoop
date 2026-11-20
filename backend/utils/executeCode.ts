import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { SQL_SCHEMAS } from '../data/sqlSchemas.js';

export const SANDBOX_MAX_BUFFER = 5 * 1024 * 1024; // 5MB max output
export const DEFAULT_EXEC_TIMEOUT_MS = 3000;
export const DEFAULT_COMPILE_TIMEOUT_MS = 5000;
export const MAX_EXEC_TIMEOUT_MS = 30000;

export interface ExecFileAsyncOptions {
    input?: string;
    timeout?: number;
    cwd?: string;
    env?: NodeJS.ProcessEnv | Record<string, string>;
    maxBuffer?: number;
    signal?: AbortSignal | null;
}

export interface ExecuteCodeOptions {
    input?: string;
    timeout?: number;
    compileTimeout?: number;
    maxBuffer?: number;
    signal?: AbortSignal | null;
    schemaId?: string;
    schema?: string;
    [key: string]: unknown;
}

export interface ExecuteCodeResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
    compileTime: number;
    runTime: number;
    cacheHit?: boolean;
}

export interface ExecuteSqliteResult extends ExecuteCodeResult {
    columns?: string[];
    rows?: unknown[][];
}

export interface CompiledBinaryCacheEntry {
    binaryPath: string;
    createdAt: number;
}

export interface SchemaColumn {
    name: string;
    type?: string;
    primaryKey?: boolean;
    nullable?: boolean;
    unique?: boolean;
    description?: string;
}

export interface SchemaTable {
    name: string;
    columns: SchemaColumn[];
    sampleData?: unknown[][];
}

export interface SqlSchema {
    id: string;
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    tables: SchemaTable[];
}

export interface TestCase {
    input: unknown;
    output: unknown;
    hidden?: boolean;
}

export interface TestResultItem {
    passed: boolean;
    expected: unknown;
    actual: unknown;
    input: unknown;
    error?: string;
}

export function clampMaxBuffer(bufferSize?: unknown): number {
    if (typeof bufferSize !== 'number' || Number.isNaN(bufferSize) || bufferSize <= 0) {
        return SANDBOX_MAX_BUFFER;
    }
    return Math.min(bufferSize, SANDBOX_MAX_BUFFER);
}

export function clampTimeout(timeoutMs?: unknown, defaultMs = DEFAULT_EXEC_TIMEOUT_MS): number {
    if (typeof timeoutMs !== 'number' || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
        return defaultMs;
    }
    return Math.min(timeoutMs, MAX_EXEC_TIMEOUT_MS);
}

// SECURITY: Sanitized environment for child processes — only expose PATH
export const SANDBOX_ENV: Readonly<Record<string, string>> = Object.freeze({
    PATH: process.env.PATH || '',
    HOME: os.tmpdir(),
    TMPDIR: os.tmpdir(),
    NODE_ENV: 'sandbox',
    NODE_OPTIONS: '--no-warnings',
});

/**
 * Asynchronously execute a binary or script using non-blocking child_process.execFile with:
 * - Native Promise wrapper
 * - AbortController cancellation via signal
 * - Safe bounded maxBuffer
 * - Safe timeouts with process cleanup
 * - Proper error handling (stdin EPIPE protection, stderr capture)
 */
export function execFileAsync(
    command: string,
    args: string[],
    {
        input = '',
        timeout = DEFAULT_EXEC_TIMEOUT_MS,
        cwd,
        env = SANDBOX_ENV,
        maxBuffer = SANDBOX_MAX_BUFFER,
        signal = null,
    }: ExecFileAsyncOptions = {}
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            const err = new Error(signal.reason ? String(signal.reason) : 'Execution cancelled: operation was aborted');
            err.name = 'AbortError';
            (err as unknown as { code: string }).code = 'ABORT_ERR';
            return reject(err);
        }

        const controller = new AbortController();
        const safeTimeout = clampTimeout(timeout, DEFAULT_EXEC_TIMEOUT_MS);
        const safeMaxBuffer = clampMaxBuffer(maxBuffer);

        let timeoutId: NodeJS.Timeout | null = null;
        let onExternalAbort: (() => void) | null = null;
        let settled = false;
        let timedOut = false;

        const cleanup = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (signal && onExternalAbort && typeof signal.removeEventListener === 'function') {
                signal.removeEventListener('abort', onExternalAbort);
            }
        };

        if (signal && typeof signal.addEventListener === 'function') {
            onExternalAbort = () => {
                controller.abort(signal.reason || new Error('The operation was aborted'));
            };
            signal.addEventListener('abort', onExternalAbort, { once: true });
        }

        timeoutId = setTimeout(() => {
            timedOut = true;
            controller.abort(new Error(`Execution timed out after ${safeTimeout}ms`));
        }, safeTimeout);

        let child: ReturnType<typeof execFile>;
        try {
            child = execFile(
                command,
                args,
                {
                    timeout: safeTimeout,
                    signal: controller.signal,
                    shell: false,
                    cwd,
                    env: env as NodeJS.ProcessEnv,
                    maxBuffer: safeMaxBuffer,
                    encoding: 'buffer',
                },
                (error, stdout, stderr) => {
                    if (settled) return;
                    settled = true;
                    cleanup();

                    if (error) {
                        if (timedOut && (error.name === 'AbortError' || (error as unknown as { code?: string }).code === 'ABORT_ERR')) {
                            error.message = `Execution timed out after ${safeTimeout}ms`;
                        }
                        (error as unknown as { stdout: Buffer; stderr: Buffer }).stdout = stdout;
                        (error as unknown as { stdout: Buffer; stderr: Buffer }).stderr = stderr;
                        reject(error);
                        return;
                    }
                    resolve(stdout);
                }
            );
        } catch (syncErr) {
            if (settled) return;
            settled = true;
            cleanup();
            reject(syncErr);
            return;
        }

        if (controller.signal && typeof controller.signal.addEventListener === 'function') {
            controller.signal.addEventListener('abort', () => {
                if (child && typeof child.kill === 'function' && !child.killed) {
                    try {
                        child.kill('SIGTERM');
                    } catch { /* ignore kill error */ }
                }
            }, { once: true });
        }

        if (child && typeof child.on === 'function') {
            child.on('error', (streamErr) => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(streamErr);
            });
        }

        if (child?.stdin) {
            child.stdin.on('error', () => { /* ignore EPIPE */ });
            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();
        }
    });
}

export const DANGEROUS_PATTERNS_BY_LANG: Record<string, RegExp[]> = {
    python: [
        /\b(?:import\s+(?:os|subprocess|pty|shlex|shutil|ctypes|socket|urllib|requests|http(?:\.client)?|pathlib|winreg|multiprocessing|asyncio\.subprocess))\b/i,
        /\b(?:from\s+(?:os|subprocess|pty|shlex|shutil|ctypes|socket|urllib|requests|http(?:\.client)?|pathlib|winreg|multiprocessing)\s+import)\b/i,
        /\b__import__\s*\(/i,
        /\b(?:eval|exec)\s*\(/i,
        /\bopen\s*\([^)]*['"][rwa]/i,
        /\bgetattr\s*\(\s*__builtins__/i,
        /\b__subclasses__\b/i,
        /\bos\.(?:system|popen|spawn|exec|remove|unlink|rmdir|mkdir|rename|chmod|chown)/i,
    ],
    javascript: [
        /\b(?:require\s*\(|import\s*\(|import\s+.*?from\s*)\s*['"](?:child_process|fs|fs\/promises|net|http|https|tls|dgram|dns|cluster|worker_threads|process|v8|vm)['"]/i,
        /\bprocess\.(?:exit|kill|binding|mainModule|abort)\b/i,
        /\bchild_process\b/i,
        /\b(?:eval|Function)\s*\(/i,
    ],
    c: [
        /#\s*include\s*[<"](?:sys\/|unistd\.h|windows\.h|winsock|process\.h|direct\.h|io\.h)/i,
        /\b(?:system|popen|fork|vfork|clone|exec[lvp]*e?|kill|socket|connect|remove|unlink)\s*\(/i,
    ],
    cpp: [
        /#\s*include\s*[<"](?:sys\/|unistd\.h|windows\.h|winsock|process\.h|direct\.h|io\.h)/i,
        /\b(?:system|popen|fork|vfork|clone|exec[lvp]*e?|kill|socket|connect|remove|unlink)\s*\(/i,
    ],
    java: [
        /\b(?:Runtime\s*\.\s*getRuntime\s*\(\s*\)|ProcessBuilder|System\s*\.\s*(?:exit|load|loadLibrary))/i,
        /\bjava\.(?:lang\.reflect|net|nio\.file)\b/i,
    ],
    go: [
        /"(?:os\/exec|syscall|unsafe|net|net\/http)"/i,
    ],
    rust: [
        /\b(?:std::process|std::net|Command::new|libc::)\b/i,
    ],
};

export function detectDangerousCode(code: unknown, language: unknown): string | null {
    if (!code || typeof code !== 'string') return null;
    const lang = normalizeLanguage(String(language || ''));
    const normalized = lang === 'typescript' ? 'javascript' : lang;
    const patterns = DANGEROUS_PATTERNS_BY_LANG[normalized];
    if (!patterns) return null;

    for (const pattern of patterns) {
        if (pattern.test(code)) {
            return `Security violation: forbidden system call or module detected in submission.`;
        }
    }
    return null;
}

export const COMPILED_CACHE_TTL_MS = 5 * 60 * 1000;
export const COMPILED_CACHE_MAX_ENTRIES = 50;
export const COMPILED_BINARY_CACHE = new Map<string, CompiledBinaryCacheEntry>();
export const COMPILED_CACHE_DIR = path.join(os.tmpdir(), 'preploop_compiled_cache');
try {
    if (!fs.existsSync(COMPILED_CACHE_DIR)) {
        fs.mkdirSync(COMPILED_CACHE_DIR, { recursive: true });
    }
} catch { }

export const createCompiledCacheKey = (language: string, code: string): string => {
    const hash = crypto.createHash('sha256').update(`${language}\n${code}`).digest('hex').slice(0, 32);
    return hash;
};

export const isCacheableCompiledLanguage = (language: string): boolean => language === 'c' || language === 'cpp';

export const sweepCompiledCache = (force = false): void => {
    const now = Date.now();
    for (const [key, entry] of COMPILED_BINARY_CACHE.entries()) {
        const expired = force || (now - entry.createdAt > COMPILED_CACHE_TTL_MS);
        const missing = !fs.existsSync(entry.binaryPath);
        if (expired || missing) {
            if (fs.existsSync(entry.binaryPath)) {
                try { fs.unlinkSync(entry.binaryPath); } catch { }
            }
            COMPILED_BINARY_CACHE.delete(key);
        }
    }

    if (COMPILED_BINARY_CACHE.size <= COMPILED_CACHE_MAX_ENTRIES) return;

    const ordered = [...COMPILED_BINARY_CACHE.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toDelete = ordered.slice(0, COMPILED_BINARY_CACHE.size - COMPILED_CACHE_MAX_ENTRIES);
    for (const [key, entry] of toDelete) {
        if (fs.existsSync(entry.binaryPath)) {
            try { fs.unlinkSync(entry.binaryPath); } catch { }
        }
        COMPILED_BINARY_CACHE.delete(key);
    }
};

const createTempWorkspace = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'preploop-exec-'));

const removeTempWorkspace = (workspacePath: string): void => {
    try { fs.rmSync(workspacePath, { recursive: true, force: true }); } catch { }
};

const dedentPythonCode = (code: string): string => {
    const lines = String(code || '').replace(/\r\n/g, '\n').split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
    if (nonEmptyLines.length === 0) {
        return '';
    }

    const commonIndent = nonEmptyLines.reduce((min, line) => {
        const match = line.match(/^[ \t]*/)?.[0] || '';
        return Math.min(min, match.length);
    }, Number.POSITIVE_INFINITY);

    return lines
        .map((line) => {
            if (!line.trim()) return '';
            const leading = line.match(/^[ \t]*/)?.[0] || '';
            return line.slice(Math.min(commonIndent, leading.length)).replace(/[ \t]+$/g, '');
        })
        .join('\n')
        .replace(/^\n+|\n+$/g, '');
};

const LANGUAGE_ALIASES: Record<string, string> = {
    c: 'c',
    py: 'python',
    python3: 'python',
    js: 'javascript',
    node: 'javascript',
    ts: 'typescript',
    cxx: 'cpp',
    'c++': 'cpp',
    golang: 'go',
    rs: 'rust',
    sqlite: 'sql',
    postgres: 'sql',
    postgresql: 'sql',
};

const normalizeLanguage = (language = ''): string => {
    const normalized = String(language || '').toLowerCase().trim();
    return LANGUAGE_ALIASES[normalized] || normalized;
};

const JAVA_CLASS_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

interface ExecCommand {
    command: string;
    args: string[];
}

interface LanguageDefinition {
    ext: string;
    commands: string[];
    preprocess?: (code: string) => string;
    compile?: (file: string, out: string, cmd: string, className?: string) => ExecCommand;
    run: (file: string, cmd: string, out?: string, className?: string) => ExecCommand;
}

const LANG_CONFIG: Record<string, LanguageDefinition> = {
    python: {
        ext: '.py',
        commands: ['python3', 'python', 'py'],
        run: (file, cmd) => ({ command: cmd, args: [file] }),
    },
    javascript: {
        ext: '.js',
        commands: ['node'],
        run: (file, cmd) => ({ command: cmd, args: [file] }),
    },
    c: {
        ext: '.c',
        commands: ['gcc', 'clang', 'C:\\Program Files\\LLVM\\bin\\clang.exe'],
        compile: (file, out, cmd) => ({ command: cmd, args: ['-o', out, file] }),
        run: (_file, _cmd, out) => ({ command: out || '', args: [] }),
    },
    cpp: {
        ext: '.cpp',
        commands: ['g++', 'clang++', 'C:\\Program Files\\LLVM\\bin\\clang++.exe'],
        compile: (file, out, cmd) => ({ command: cmd, args: ['-o', out, file] }),
        run: (_file, _cmd, out) => ({ command: out || '', args: [] }),
    },
    java: {
        ext: '.java',
        commands: ['javac'],
        preprocess: (code) => {
            const match = code.match(/public\s+class\s+([^\s{]+)/);
            if (!match) return 'Main';
            const candidate = match[1].replace(/;.*$/, '').trim();
            return candidate && JAVA_CLASS_NAME_PATTERN.test(candidate) ? candidate : 'Main';
        },
        compile: (file, _out, cmd, _className) => ({ command: cmd, args: [file] }),
        run: (file, _cmd, _out, className) => {
            const dir = path.dirname(file);
            return {
                command: 'java',
                args: ['-cp', dir, className || 'Main'],
            };
        },
    },
    go: {
        ext: '.go',
        commands: ['go'],
        run: (file, cmd) => ({ command: cmd, args: ['run', file] }),
    },
    rust: {
        ext: '.rs',
        commands: ['rustc'],
        compile: (file, out, cmd) => ({ command: cmd, args: ['-o', out, file] }),
        run: (_file, _cmd, out) => ({ command: out || '', args: [] }),
    },
    sql: {
        ext: '.sql',
        commands: ['sqlite3'],
        run: (file, cmd) => ({ command: cmd, args: [':memory:', '-init', file, ''] }),
    },
};

/**
 * Generate CREATE TABLE and INSERT INTO DDL/DML SQL statements for a schema
 */
export function generateSchemaSql(schema: SqlSchema): string {
    if (!schema || !Array.isArray(schema.tables)) return '';
    const statements: string[] = [];
    for (const table of schema.tables) {
        if (!table || !table.name || !Array.isArray(table.columns)) continue;
        const colDefs = table.columns.map((c) => {
            const type = (c.type || 'TEXT').replace(/ENUM\(.*?\)/i, 'TEXT');
            const parts = [`"${c.name}" ${type}`];
            if (c.primaryKey) parts.push('PRIMARY KEY');
            return parts.join(' ');
        }).join(', ');
        statements.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (${colDefs});`);
        if (Array.isArray(table.sampleData) && table.sampleData.length > 0) {
            const colNames = table.columns.map((c) => `"${c.name}"`).join(', ');
            for (const row of table.sampleData) {
                const vals = row.map((v) => {
                    if (v === null || v === undefined) return 'NULL';
                    if (typeof v === 'number') return v;
                    return "'" + String(v).replace(/'/g, "''") + "'";
                }).join(', ');
                statements.push(`INSERT OR IGNORE INTO "${table.name}" (${colNames}) VALUES (${vals});`);
            }
        }
    }
    return statements.join('\n');
}

/**
 * Identify relevant schemas for a given SQL query
 */
export function getRelevantSchemasForQuery(query = '', explicitSchemaId: string | null = null): SqlSchema[] {
    const schemas = SQL_SCHEMAS as SqlSchema[];
    if (explicitSchemaId && Array.isArray(schemas)) {
        const found = schemas.find((s) => s.id === explicitSchemaId);
        if (found) return [found];
    }
    const queryLower = String(query || '').toLowerCase();
    const matchedSchemas = new Set<SqlSchema>();
    if (Array.isArray(schemas)) {
        for (const schema of schemas) {
            if (!schema || !Array.isArray(schema.tables)) continue;
            for (const table of schema.tables) {
                const regex = new RegExp(`\\b${table.name}\\b`, 'i');
                if (regex.test(queryLower)) {
                    matchedSchemas.add(schema);
                    break;
                }
            }
        }
    }
    if (matchedSchemas.size > 0) {
        return Array.from(matchedSchemas);
    }
    const defaultSchema = Array.isArray(schemas)
        ? (schemas.find((s) => s.id === 'ecommerce') || schemas[0])
        : null;
    return defaultSchema ? [defaultSchema] : [];
}

/**
 * Format columns and rows into a tabular ASCII box string
 */
export function formatTabularOutput(columns: unknown[], rows: unknown[][]): string {
    if (!Array.isArray(columns) || columns.length === 0) {
        return '(No columns returned)';
    }
    const colWidths = columns.map((col, idx) => {
        let max = String(col).length;
        if (Array.isArray(rows)) {
            for (const row of rows) {
                const val = row[idx] === null || row[idx] === undefined ? 'NULL' : String(row[idx]);
                if (val.length > max) max = val.length;
            }
        }
        return Math.max(max, 1);
    });

    const sep = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
    const header = '| ' + columns.map((col, idx) => String(col).padEnd(colWidths[idx])).join(' | ') + ' |';
    const dataLines = (Array.isArray(rows) ? rows : []).map((row) => {
        return '| ' + row.map((val, idx) => {
            const str = val === null || val === undefined ? 'NULL' : String(val);
            return str.padEnd(colWidths[idx]);
        }).join(' | ') + ' |';
    });

    const parts = [sep, header, sep];
    if (dataLines.length > 0) {
        parts.push(...dataLines);
        parts.push(sep);
        parts.push(`(${rows.length} ${rows.length === 1 ? 'row' : 'rows'} in set)`);
    } else {
        parts.push('(0 rows returned)');
    }
    return parts.join('\n');
}

/**
 * Execute SQL in SQLite with pre-populated schema tables and sample data
 */
export async function executeSqlite(
    code: unknown,
    input: unknown = '',
    options: ExecuteCodeOptions = {}
): Promise<ExecuteSqliteResult> {
    const startTime = Date.now();

    const opts: ExecuteCodeOptions = typeof input === 'object' && input !== null
        ? { ...(input as Record<string, unknown>), ...options }
        : (options || {});

    if (opts.signal?.aborted) {
        const msg = opts.signal.reason ? String(opts.signal.reason) : 'Execution cancelled: operation was aborted';
        return {
            success: false,
            output: '',
            error: msg,
            columns: ['Error'],
            rows: [[msg]],
            executionTime: 0,
            compileTime: 0,
            runTime: 0,
        };
    }

    if (typeof code !== 'string') {
        return {
            success: false,
            output: '',
            error: 'Code must be a string',
            columns: ['Error'],
            rows: [['Code must be a string']],
            executionTime: 0,
            compileTime: 0,
            runTime: 0,
        };
    }

    if (!code.trim()) {
        return {
            success: false,
            output: '',
            error: 'SQL code is required',
            columns: ['Error'],
            rows: [['SQL code is required']],
            executionTime: 0,
            compileTime: 0,
            runTime: 0,
        };
    }

    let explicitSchemaId: string | null = null;
    if (typeof input === 'object' && input !== null) {
        explicitSchemaId = ((input as Record<string, unknown>).schemaId as string) || ((input as Record<string, unknown>).schema as string) || null;
    } else if (typeof input === 'string' && input.trim()) {
        try {
            const parsed = JSON.parse(input);
            explicitSchemaId = parsed.schemaId || parsed.schema || null;
        } catch {
            if (/^[a-z0-9_-]+$/i.test(input.trim())) {
                explicitSchemaId = input.trim();
            }
        }
    }

    // 1. Try native node:sqlite
    try {
        const sqliteModule = await import('node:sqlite' as string).catch(() => null);
        if (sqliteModule?.DatabaseSync) {
            const db = new sqliteModule.DatabaseSync(':memory:');
            const schemas = getRelevantSchemasForQuery(code, explicitSchemaId);
            for (const schema of schemas) {
                const ddlDml = generateSchemaSql(schema);
                if (ddlDml) {
                    db.exec(ddlDml);
                }
            }

            const cleaned = code
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .split('\n')
                .map((line: string) => line.replace(/--.*$/, '').trim())
                .filter(Boolean)
                .join(' ');

            const rawStatements = cleaned.split(';').map((s: string) => s.trim()).filter(Boolean);
            if (rawStatements.length === 0) {
                return {
                    success: true,
                    output: '(No SQL query to execute)',
                    columns: ['Result'],
                    rows: [['No SQL query to execute']],
                    executionTime: Date.now() - startTime,
                    compileTime: 0,
                    runTime: Date.now() - startTime,
                };
            }

            for (let i = 0; i < rawStatements.length - 1; i++) {
                db.exec(rawStatements[i] + ';');
            }

            const lastStmt = rawStatements[rawStatements.length - 1];
            const isQuery = /^\s*(SELECT|WITH|EXPLAIN|PRAGMA|VALUES)\b/i.test(lastStmt);

            let columns: string[] = [];
            let rows: unknown[][] = [];

            if (isQuery) {
                const stmt = db.prepare(lastStmt);
                const rowsObj = stmt.all();
                if (rowsObj.length > 0) {
                    columns = Object.keys(rowsObj[0]);
                    rows = rowsObj.map((r: Record<string, unknown>) => columns.map((c) => r[c]));
                } else {
                    try {
                        if (typeof stmt.columns === 'function') {
                            columns = stmt.columns().map((c: { name: string }) => c.name);
                        }
                    } catch {}
                    if (columns.length === 0) columns = ['Result'];
                    rows = [];
                }
            } else {
                const stmt = db.prepare(lastStmt);
                const info = stmt.run();
                columns = ['Status', 'Changes'];
                rows = [['Query OK', info?.changes ?? 0]];
            }

            const output = formatTabularOutput(columns, rows);
            const duration = Date.now() - startTime;
            return {
                success: true,
                output,
                columns,
                rows,
                executionTime: duration,
                compileTime: 0,
                runTime: duration,
            };
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const duration = Date.now() - startTime;
        return {
            success: false,
            output: '',
            error: message,
            columns: ['Error'],
            rows: [[message]],
            executionTime: duration,
            compileTime: 0,
            runTime: duration,
        };
    }

    // 2. Fallback: Python sqlite3
    try {
        const schemas = getRelevantSchemasForQuery(code, explicitSchemaId);
        const ddlDml = schemas.map(s => generateSchemaSql(s)).join('\n');
        const runnerScript = `import sqlite3, json, sys
con = sqlite3.connect(':memory:')
cur = con.cursor()
init_sql = ${JSON.stringify(ddlDml)}
if init_sql.strip():
    cur.executescript(init_sql)
user_code = ${JSON.stringify(code)}
statements = [s.strip() for s in user_code.split(';') if s.strip()]
if not statements:
    print(json.dumps({'columns': ['Result'], 'rows': [['No query']], 'output': '(No query)'}))
    sys.exit(0)
for s in statements[:-1]:
    cur.execute(s)
cur.execute(statements[-1])
if cur.description:
    columns = [d[0] for d in cur.description]
    rows = cur.fetchall()
else:
    columns = ['Status', 'Changes']
    rows = [['Query OK', con.total_changes]]
print(json.dumps({'columns': columns, 'rows': rows}))
`;
        const pyResult = await execFileAsync('python', ['-c', runnerScript], {
            timeout: clampTimeout(opts.timeout, DEFAULT_EXEC_TIMEOUT_MS),
            maxBuffer: clampMaxBuffer(opts.maxBuffer),
            env: SANDBOX_ENV,
            signal: opts.signal || null,
        });
        const parsed = JSON.parse(pyResult.toString().trim());
        const output = formatTabularOutput(parsed.columns, parsed.rows);
        const duration = Date.now() - startTime;
        return {
            success: true,
            output,
            columns: parsed.columns,
            rows: parsed.rows,
            executionTime: duration,
            compileTime: 0,
            runTime: duration,
        };
    } catch (fallbackErr: unknown) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : 'SQLite execution failed';
        const duration = Date.now() - startTime;
        return {
            success: false,
            output: '',
            error: message,
            columns: ['Error'],
            rows: [[message]],
            executionTime: duration,
            compileTime: 0,
            runTime: duration,
        };
    }
}

/**
 * Execute code in the given language and return the result.
 */
const ALLOWED_LANGUAGES = new Set(['python', 'javascript', 'c', 'cpp', 'java', 'typescript', 'go', 'rust', 'sql']);

export async function executeCode(
    code: unknown,
    language: unknown,
    input: unknown = '',
    options: ExecuteCodeOptions = {}
): Promise<ExecuteCodeResult | ExecuteSqliteResult> {
    const startTime = Date.now();

    const isInputObj = typeof input === 'object' && input !== null;
    const opts: ExecuteCodeOptions = isInputObj
        ? { ...(input as Record<string, unknown>), ...options }
        : (options || {});
    const inputStr = isInputObj
        ? (typeof (input as Record<string, unknown>).input === 'string' ? ((input as Record<string, unknown>).input as string) : '')
        : (typeof input === 'string' ? input : String(input ?? ''));

    const execTimeout = clampTimeout(opts.timeout, DEFAULT_EXEC_TIMEOUT_MS);
    const compileTimeout = clampTimeout(opts.compileTimeout, DEFAULT_COMPILE_TIMEOUT_MS);
    const execMaxBuffer = clampMaxBuffer(opts.maxBuffer);
    const signal = opts.signal || null;

    if (signal?.aborted) {
        return {
            success: false,
            output: '',
            error: signal.reason ? String(signal.reason) : 'Execution cancelled: operation was aborted',
            executionTime: 0,
            compileTime: 0,
            runTime: 0,
        };
    }

    if (typeof code !== 'string') {
        return {
            success: false, output: '',
            error: 'Code must be a string',
            executionTime: 0, compileTime: 0, runTime: 0,
        };
    }

    if (code.length > 100000) {
        return {
            success: false, output: '',
            error: 'Code is too large. Limit is 100000 characters.',
            executionTime: 0, compileTime: 0, runTime: 0,
        };
    }

    const requestedLanguage = normalizeLanguage(String(language || ''));
    const normalizedLanguage = requestedLanguage === 'typescript' ? 'javascript' : requestedLanguage;

    if (!ALLOWED_LANGUAGES.has(normalizedLanguage)) {
        return {
            success: false, output: '',
            error: `Language "${language}" is not supported. Supported: python, javascript, typescript, c, cpp, java, go, rust, sql.`,
            executionTime: 0, compileTime: 0, runTime: 0,
        };
    }

    // SECURITY: Reject forbidden system calls, OS exec, network sockets, or unsafe modules
    const dangerousViolation = detectDangerousCode(code, normalizedLanguage);
    if (dangerousViolation) {
        return {
            success: false,
            output: '',
            error: dangerousViolation,
            executionTime: 0,
            compileTime: 0,
            runTime: 0,
        };
    }

    sweepCompiledCache();

    // SQL / SQLite execution: hydrate schema DDL/DML and execute query
    if (normalizedLanguage === 'sql') {
        return executeSqlite(code, input, opts);
    }

    // JavaScript: execute in sandboxed child process via Node.js
    if (normalizedLanguage === 'javascript') {
        const workspaceDir = createTempWorkspace();
        const tmpFile = path.join(workspaceDir, 'playground.js');
        try {
            await fs.promises.writeFile(tmpFile, code, 'utf-8');
            try {
                const result = await execFileAsync('node', [
                    '--permission',
                    `--allow-fs-read=${workspaceDir}`,
                    tmpFile
                ], {
                    timeout: execTimeout,
                    input: inputStr || '',
                    cwd: workspaceDir,
                    env: SANDBOX_ENV,
                    maxBuffer: execMaxBuffer,
                    signal,
                });
                const output = result.toString().trim() || '(No output — use console.log() to see results)';
                const total = Date.now() - startTime;
                return { success: true, output, executionTime: total, compileTime: 0, runTime: total };
            } catch (runErr: unknown) {
                const errObj = runErr as { stderr?: Buffer | string; stdout?: Buffer | string; message?: string };
                const stderr = errObj.stderr ? errObj.stderr.toString().trim() : '';
                const stdout = errObj.stdout ? errObj.stdout.toString().trim() : '';
                const total = Date.now() - startTime;
                return { success: false, output: stdout, error: stderr || errObj.message || 'Runtime error', executionTime: total, compileTime: 0, runTime: total };
            }
        } catch (fileErr: unknown) {
            const message = fileErr instanceof Error ? fileErr.message : String(fileErr);
            return { success: false, output: '', error: `Failed to create temp file: ${message}`, executionTime: Date.now() - startTime, compileTime: 0, runTime: 0 };
        } finally {
            removeTempWorkspace(workspaceDir);
        }
    }

    // Other languages: execute via child_process
    const langConfig = LANG_CONFIG[normalizedLanguage];
    if (!langConfig) {
        return {
            success: false,
            output: '',
            error: `Language "${language}" is not supported. Supported: python, javascript, typescript, c, cpp, java, go, rust, sql.`,
            executionTime: Date.now() - startTime,
            compileTime: 0,
            runTime: 0,
        };
    }

    // Find available command
    let availableCmd: string | null = null;
    for (const cmd of langConfig.commands) {
        try {
            await execFileAsync(cmd, ['--version'], {
                timeout: 3000,
                maxBuffer: execMaxBuffer,
                signal,
            });
            availableCmd = cmd;
            break;
        } catch { /* try next */ }
    }

    if (!availableCmd) {
        return {
            success: false, output: '',
            error: `${normalizedLanguage} runtime not found. Install ${langConfig.commands[0]} or use JavaScript.`,
            executionTime: Date.now() - startTime,
            compileTime: 0,
            runTime: 0,
        };
    }

    const tmpDir = createTempWorkspace();
    let className = 'Main';
    let tmpFile: string;

    if (normalizedLanguage === 'java') {
        className = langConfig.preprocess ? langConfig.preprocess(code) : 'Main';
        tmpFile = path.join(tmpDir, `${className}${langConfig.ext}`);
    } else {
        tmpFile = path.join(tmpDir, `playground_${crypto.randomBytes(8).toString('hex')}${langConfig.ext}`);
    }

    try {
        const sourceCode = normalizedLanguage === 'python' ? dedentPythonCode(code) : code;
        await fs.promises.writeFile(tmpFile, sourceCode, 'utf-8');
        const outFile = tmpFile.replace(langConfig.ext, '');
        const compiledOutFile = process.platform === 'win32' && langConfig.compile ? `${outFile}.exe` : outFile;
        let compileTime = 0;
        let finalExecutablePath = compiledOutFile;
        let cacheHit = false;

        // Compile if needed
        if (langConfig.compile) {
            sweepCompiledCache();
            const cacheable = isCacheableCompiledLanguage(normalizedLanguage);
            const cacheKey = cacheable ? createCompiledCacheKey(normalizedLanguage, code) : null;
            const cachedEntry = cacheKey ? COMPILED_BINARY_CACHE.get(cacheKey) : null;

            if (cachedEntry && fs.existsSync(cachedEntry.binaryPath)) {
                finalExecutablePath = cachedEntry.binaryPath;
                cacheHit = true;
            } else {
                const compileStart = Date.now();
                const compileTarget = cacheable
                    ? path.join(COMPILED_CACHE_DIR, `playground_cache_${cacheKey}${process.platform === 'win32' ? '.exe' : ''}`)
                    : compiledOutFile;

                try {
                    const compileExec = langConfig.compile(tmpFile, compileTarget, availableCmd, className);
                    await execFileAsync(compileExec.command, compileExec.args, {
                        timeout: compileTimeout,
                        cwd: tmpDir,
                        env: SANDBOX_ENV,
                        maxBuffer: execMaxBuffer,
                        signal,
                    });
                    compileTime = Date.now() - compileStart;
                    finalExecutablePath = compileTarget;

                    if (cacheable && cacheKey) {
                        COMPILED_BINARY_CACHE.set(cacheKey, { binaryPath: compileTarget, createdAt: Date.now() });
                    }
                } catch (compileErr: unknown) {
                    const errObj = compileErr as { stderr?: Buffer | string; message?: string };
                    const stderr = errObj.stderr ? errObj.stderr.toString() : (errObj.message || 'Compilation failed');
                    compileTime = Date.now() - compileStart;
                    return { success: false, output: '', error: `Compilation Error:\n${stderr}`, executionTime: Date.now() - startTime, compileTime, runTime: 0, cacheHit };
                }
            }
        }

        // Run
        const executablePath = fs.existsSync(finalExecutablePath)
            ? finalExecutablePath
            : (fs.existsSync(compiledOutFile) ? compiledOutFile : (fs.existsSync(outFile + '.exe') ? outFile + '.exe' : outFile));
        const runExec = langConfig.run(tmpFile, availableCmd, executablePath, className);
        const runStart = Date.now();
        try {
            const result = await execFileAsync(runExec.command, runExec.args, {
                timeout: execTimeout,
                input: inputStr || '',
                cwd: tmpDir,
                env: SANDBOX_ENV,
                maxBuffer: execMaxBuffer,
                signal,
            });
            const output = result.toString().trim() || '(No output)';
            const runTime = Date.now() - runStart;
            return { success: true, output, executionTime: Date.now() - startTime, compileTime, runTime, cacheHit };
        } catch (runErr: unknown) {
            const errObj = runErr as { stderr?: Buffer | string; stdout?: Buffer | string; message?: string };
            const stderr = errObj.stderr ? errObj.stderr.toString().trim() : '';
            const stdout = errObj.stdout ? errObj.stdout.toString().trim() : '';
            const runTime = Date.now() - runStart;
            return { success: false, output: stdout, error: stderr || errObj.message || 'Runtime error', executionTime: Date.now() - startTime, compileTime, runTime, cacheHit };
        }
    } catch (fileErr: unknown) {
        const message = fileErr instanceof Error ? fileErr.message : String(fileErr);
        return { success: false, output: '', error: `Failed to create temp file: ${message}`, executionTime: Date.now() - startTime, compileTime: 0, runTime: 0 };
    } finally {
        // Cleanup
        try { fs.unlinkSync(tmpFile); } catch { }
        if (langConfig.compile) {
            const cacheable = isCacheableCompiledLanguage(normalizedLanguage);
            const outFile = tmpFile.replace(langConfig.ext, '');
            const compiledOutFile = process.platform === 'win32' ? `${outFile}.exe` : outFile;
            if (!cacheable) {
                try { fs.unlinkSync(compiledOutFile); } catch { }
            }
            try { fs.unlinkSync(outFile); } catch { }
            if (!cacheable) {
                try { fs.unlinkSync(outFile + '.exe'); } catch { }
            }
            if (normalizedLanguage === 'java') {
                try { fs.unlinkSync(path.join(tmpDir, `${className}.class`)); } catch { }
            }
        }
        removeTempWorkspace(tmpDir);
    }
}

export function buildTestWrapper(
    userCode: string,
    language: string,
    testCases: TestCase[],
    fnName: string,
    problem_starter_code = ''
): string {
    if (language === 'javascript' || language === 'typescript') {
        const tests = JSON.stringify(testCases);
        return `
${userCode}

// --- Test Runner ---
const __tests = ${tests};
const __results = [];

function __isNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
}

function __deepEqual(a, b) {
    if (a === b) return true;

    if (__isNumber(a) && __isNumber(b)) {
        return Math.abs(a - b) <= 1e-6;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!__deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a).sort();
        const bKeys = Object.keys(b).sort();
        if (!__deepEqual(aKeys, bKeys)) return false;
        for (const k of aKeys) {
            if (!__deepEqual(a[k], b[k])) return false;
        }
        return true;
    }

    return false;
}

function __resolveCallable(targetName) {
    // 1) Direct function by name via globalThis
    try {
        const direct = globalThis[targetName];
        if (typeof direct === 'function') return direct;
    } catch {}

    // 2) LeetCode-style class Solution with method name
    try {
        const Sol = globalThis['Solution'];
        if (typeof Sol === 'function') {
            const instance = new Sol();

            if (instance && typeof instance[targetName] === 'function') {
                return (...args) => instance[targetName](...args);
            }

            // Fallback to first public method on Solution instance
            const proto = Object.getPrototypeOf(instance) || {};
            const methodNames = Object.getOwnPropertyNames(proto)
                .filter((name) => name !== 'constructor' && typeof instance[name] === 'function');
            if (methodNames.length > 0) {
                return (...args) => instance[methodNames[0]](...args);
            }
        }
    } catch {}

    return null;
}

const __isValidIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(${JSON.stringify(fnName)});
const __fn = (() => {
    if (__isValidIdentifier) {
        try {
            if (typeof ${/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(fnName) ? fnName : '__missing_fn__'} === 'function') {
                return ${/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(fnName) ? fnName : 'null'};
            }
        } catch {}
    }
    try {
        if (typeof Solution === 'function') {
            const instance = new Solution();
            if (instance && typeof instance[${JSON.stringify(fnName)}] === 'function') {
                return (...args) => instance[${JSON.stringify(fnName)}](...args);
            }
            const proto = Object.getPrototypeOf(instance) || {};
            const methodNames = Object.getOwnPropertyNames(proto)
                .filter((name) => name !== 'constructor' && typeof instance[name] === 'function');
            if (methodNames.length > 0) {
                return (...args) => instance[methodNames[0]](...args);
            }
        }
    } catch {}
    return __resolveCallable(${JSON.stringify(fnName)});
})();

for (const tc of __tests) {
  try {
        if (!__fn) {
            __results.push({ passed: false, expected: tc.output, actual: 'Function ${fnName} not found', input: tc.input, error: 'Function not found' });
            continue;
        }

        const args = Array.isArray(tc.input) ? tc.input : [tc.input];
        const result = __fn(...args);
        const passed = __deepEqual(tc.output, result);
        __results.push({ passed, expected: tc.output, actual: result, input: tc.input });
  } catch (e) {
    __results.push({ passed: false, expected: tc.output, actual: 'Error: ' + e.message, input: tc.input, error: e.message });
  }
}
console.log('__TEST_RESULTS__' + JSON.stringify(__results));
`;
    }

    if (language === 'python') {
        const tests = JSON.stringify(testCases);

        const starterPy = (problem_starter_code || '').toString();
        const isClassBased = /class\s+(?!Solution)\w+/.test(starterPy) ||
            /def __init__/.test(starterPy) ||
            (testCases.length > 0 && Array.isArray((testCases[0] as { input?: unknown[] })?.input) && ((testCases[0] as { input?: unknown[] }).input as unknown[])[0] === 'class') ||
            (testCases.length > 0 && testCases[0]?.output === 'class');

        const solHandlesTreeConversion = /(__list_to_tree|list_to_tree)\s*\(/.test(userCode);
        const solHandlesLLConversion = /(__list_to_linked|list_to_linked)\s*\(/.test(userCode);

        const fnLower = fnName.toLowerCase();
        const exactTreeFunctions = [
            'inverttree', 'mergetrees', 'binarytreepaths', 'zigzaglevelorder',
            'levelorder', 'levelorderbottom', 'rightsideview', 'averageoflevels',
            'sumnumbers', 'isvalidbst', 'buildtree', 'lowestcommonancestor',
            'maxdepth', 'mindepth', 'isbalanced', 'issymmetric', 'issubtree',
            'flatten', 'serialize', 'deserialize', 'hasPathSum',
        ];
        const needsTree = !solHandlesTreeConversion && (
            exactTreeFunctions.some(k => fnLower === k.toLowerCase()) ||
            (/TreeNode/.test(starterPy) && !/ListNode/.test(starterPy))
        );

        const exactLLFunctions = [
            'hascycle', 'detectcycle', 'getdecimalvalue',
        ];
        const needsLL = !solHandlesLLConversion && (
            exactLLFunctions.some(k => fnLower === k.toLowerCase()) ||
            (/ListNode/.test(starterPy) && !/TreeNode/.test(starterPy) &&
                !solHandlesTreeConversion)
        );

        const needsBadVersionAPI = fnLower === 'firstbadversion';
        const needsGuessAPI = fnLower === 'guessnumber';

        const isLCA = fnLower.includes('lowestcommonancestor');
        const isBuildTree = fnLower === 'buildtree';

        return `
import json, sys, math
from collections import deque, Counter, defaultdict
import heapq

# --- Definitions ---
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# --- Conversion Helpers ---
def __list_to_tree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    queue = deque([root])
    i = 1
    while queue and i < len(arr):
        node = queue.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def __tree_to_list(root):
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

def __list_to_linked(arr):
    if not arr:
        return None
    dummy = ListNode(0)
    curr = dummy
    for val in arr:
        curr.next = ListNode(val)
        curr = curr.next
    return dummy.next

def __linked_to_list(head):
    result = []
    curr = head
    visited = set()
    while curr:
        if id(curr) in visited:
            break
        visited.add(id(curr))
        result.append(curr.val)
        curr = curr.next
    return result

${userCode}

# --- Test Runner ---
__tests = ${tests}
__results = []

def __deep_equal(a, b):
    if a == b:
        return True
    if isinstance(a, float) and isinstance(b, (int, float)):
        return abs(a - b) <= 1e-6
    if isinstance(b, float) and isinstance(a, (int, float)):
        return abs(a - b) <= 1e-6
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            return False
        return all(__deep_equal(x, y) for x, y in zip(a, b))
    return False

# Resolve callable function
__target_fn = None
try:
    if '${fnName}' in globals() and callable(globals()['${fnName}']):
        __target_fn = globals()['${fnName}']
except:
    pass

if __target_fn is None:
    try:
        if 'Solution' in globals():
            __sol_inst = globals()['Solution']()
            if hasattr(__sol_inst, '${fnName}') and callable(getattr(__sol_inst, '${fnName}')):
                __target_fn = getattr(__sol_inst, '${fnName}')
            else:
                for attr_name in dir(__sol_inst):
                    if not attr_name.startswith('_') and callable(getattr(__sol_inst, attr_name)):
                        __target_fn = getattr(__sol_inst, attr_name)
                        break
    except:
        pass

for tc in __tests:
    try:
        if __target_fn is None:
            __results.append({'passed': False, 'expected': tc['output'], 'actual': 'Function ${fnName} not found', 'input': tc['input'], 'error': 'Function not found'})
            continue

        raw_inp = tc['input']
        if isinstance(raw_inp, list):
            args = list(raw_inp)
        else:
            args = [raw_inp]

        # Convert tree/linked inputs if needed
        ${needsTree ? `args = [__list_to_tree(a) if isinstance(a, list) else a for a in args]` : ''}
        ${needsLL ? `args = [__list_to_linked(a) if isinstance(a, list) else a for a in args]` : ''}

        res = __target_fn(*args)

        # Convert return values back to list if TreeNode/ListNode
        if isinstance(res, TreeNode):
            res = __tree_to_list(res)
        elif isinstance(res, ListNode):
            res = __linked_to_list(res)

        passed = __deep_equal(res, tc['output'])
        __results.append({'passed': passed, 'expected': tc['output'], 'actual': res, 'input': tc['input']})
    except Exception as e:
        __results.append({'passed': False, 'expected': tc['output'], 'actual': f'Error: {e}', 'input': tc['input'], 'error': str(e)})

print('__TEST_RESULTS__' + json.dumps(__results))
`;
    }

    let wrappedCode = userCode;
    if (language === 'c' && !userCode.includes('main(')) {
        wrappedCode += '\n\nint main() {\n    return 0;\n}\n';
    }
    if (language === 'cpp' && !userCode.includes('main(')) {
        wrappedCode += '\n\nint main() {\n    return 0;\n}\n';
    }
    if (language === 'java' && !userCode.includes('public static void main')) {
        wrappedCode += '\n\nclass Main {\n    public static void main(String[] args) {\n    }\n}\n';
    }

    return wrappedCode;
}

/**
 * Parse test results from execution output.
 */
export function parseTestResults(output: string): TestResultItem[] | null {
    const marker = '__TEST_RESULTS__';
    const idx = output.indexOf(marker);
    if (idx === -1) return null;
    try {
        return JSON.parse(output.substring(idx + marker.length));
    } catch {
        return null;
    }
}
