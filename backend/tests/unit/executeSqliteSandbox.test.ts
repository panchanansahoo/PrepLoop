import { describe, it, expect } from 'vitest';
import { executeCode, executeSqlite, generateSchemaSql, getRelevantSchemasForQuery, formatTabularOutput } from '../../utils/executeCode.js';

describe('SQLite Coding Sandbox Execution & Schema Hydration', () => {
  it('hydrates tables from ecommerce schema and executes SELECT query successfully', async () => {
    const query = "SELECT customer_id, first_name, country FROM customers WHERE country = 'USA';";
    const result = await executeCode(query, 'sql');

    expect(result.success).toBe(true);
    expect(result.columns).toEqual(['customer_id', 'first_name', 'country']);
    expect(result.rows).toBeInstanceOf(Array);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toEqual([1, 'Alice', 'USA']);
    expect(result.output).toContain('| customer_id | first_name | country |');
    expect(result.output).toContain('| 1           | Alice      | USA     |');
  });

  it('correctly maps and executes queries targeting other schemas via table name detection', async () => {
    const query = 'SELECT department_id, department_name FROM departments ORDER BY department_id ASC LIMIT 2;';
    const result = await executeCode(query, 'sql');

    expect(result.success).toBe(true);
    expect(result.columns).toEqual(['department_id', 'department_name']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual([1, 'Engineering']);
    expect(result.rows[1]).toEqual([2, 'Marketing']);
  });

  it('supports explicit schemaId parameter in options', async () => {
    const query = 'SELECT COUNT(*) as cnt FROM branches;';
    const result = await executeCode(query, 'sql', { schemaId: 'banking' });

    expect(result.success).toBe(true);
    expect(result.columns).toEqual(['cnt']);
    expect(result.rows[0][0]).toBeGreaterThan(0);
  });

  it('handles calculations and queries without tables', async () => {
    const query = 'SELECT 40 + 2 AS answer;';
    const result = await executeCode(query, 'sql');

    expect(result.success).toBe(true);
    expect(result.columns).toEqual(['answer']);
    expect(result.rows).toEqual([[42]]);
    expect(result.output).toContain('| answer |');
    expect(result.output).toContain('| 42     |');
  });

  it('handles syntax errors gracefully without unhandled rejections', async () => {
    const query = 'SELECT * FORM customers;';
    const result = await executeCode(query, 'sql');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.columns).toEqual(['Error']);
    expect(result.rows[0][0]).toContain('syntax error');
  });

  it('directly exports executeSqlite with tabular formatting and DML changes reporting', async () => {
    const result = await executeSqlite('SELECT product_id, product_name, price FROM products LIMIT 1;', { schemaId: 'ecommerce' });
    expect(result.success).toBe(true);
    expect(result.columns).toEqual(['product_id', 'product_name', 'price']);
    expect(result.rows.length).toBe(1);
    expect(result.output).toMatch(/\+[-+]+\+/);
  });

  it('formatTabularOutput correctly formats columns and rows into ASCII table', () => {
    const columns = ['id', 'name'];
    const rows = [[1, 'Alice'], [2, 'Bob']];
    const table = formatTabularOutput(columns, rows);

    expect(table).toContain('| id | name  |');
    expect(table).toContain('| 1  | Alice |');
    expect(table).toContain('| 2  | Bob   |');
    expect(table).toContain('(2 rows in set)');
  });
});
