import assert from 'assert';
import { sanitizeAdminBookPayloadForUpdate } from '../routes/library.js';

function run() {
  const input = {
    title: 'Refactoring',
    author: 'Martin Fowler',
    isbn: '978-0201485677',
    published_year: 2018,
    approved: false,
    added_by: '00000000-0000-0000-0000-000000000000',
    random_field: 'should-not-pass-through',
  };

  const result = sanitizeAdminBookPayloadForUpdate(input);

  assert.deepStrictEqual(result, {
    title: 'Refactoring',
    author: 'Martin Fowler',
    isbn: '978-0201485677',
  });

  assert.strictEqual('published_year' in result, false);
  assert.strictEqual('approved' in result, false);
  assert.strictEqual('added_by' in result, false);
  assert.strictEqual('random_field' in result, false);

  console.log('PASS testLibraryAdminUpdatePayload');
}

run();
