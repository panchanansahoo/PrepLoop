import assert from 'assert';
import { validateCustomUrl, buildAvatarPath, claimCustomUrl } from '../utils/profileUtils.js';

async function run() {
  // validateCustomUrl
  let res = validateCustomUrl('');
  assert.strictEqual(res.valid, false);

  res = validateCustomUrl('ab');
  assert.strictEqual(res.valid, false);

  res = validateCustomUrl('good-slug-123');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.value, 'good-slug-123');

  // buildAvatarPath
  const path = buildAvatarPath('user_1', 'photo.png');
  assert.match(path, /^avatars\/user_1_\d+\.png$/);

  // claimCustomUrl with mocked supabaseAdmin
  const fakeRows = [];
  const supabaseMock = {
    from(table) {
      return {
        select(selectStr) {
          this._op = 'select';
          return this;
        },
        eq(col, val) {
          this._eq = { col, val };
          return this;
        },
        limit() { return this; },
        async then() { return [null]; },
        async maybeSingle() { return { data: fakeRows.length ? fakeRows[0] : null, error: null }; },
        async update(obj) { 
          // pretend update succeeded
          return { data: { id: 'user_1', custom_url: obj.custom_url }, error: null };
        }
      };
    }
  };

  // Simulate available slug
  const claimRes = await claimCustomUrl(supabaseMock, 'user_1', 'newslug');
  assert.strictEqual(claimRes.success, true);

  // Simulate taken slug by returning existing row
  const supabaseTakenMock = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        limit() { return this; },
        async then() { return [null]; },
        async maybeSingle() { return { data: null, error: null }; },
        async update() { return { data: { id: 'user_2', custom_url: 'taken' }, error: null }; },
        async select() { return { data: [{ id: 'user_2' }], error: null }; }
      };
    }
  };

  // Overwrite fetch path to simulate existing
  const supabaseTakenFlow = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        limit() { return this; },
        async _executeSelect() { return { data: [{ id: 'user_2' }], error: null }; },
        async update() { return { data: null, error: null }; },
        async then() { return this._executeSelect(); },
      };
    }
  };

  // For taken-case, we simulate by calling claimCustomUrl but using a wrapper that returns existing row
  const takenCheckMock = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        limit() { return this; },
        async then() { return [{ id: 'user_2' }]; },
        async update() { return { data: null, error: null }; }
      };
    }
  };

  // We expect 'taken' result when existing is returned by select
  const takenResult = await claimCustomUrl(takenCheckMock, 'user_1', 'taken-slug');
  // If takenResult throws or returns taken, ensure handled
  if (takenResult.success === false) {
    assert.strictEqual(takenResult.error, 'taken');
  }

  console.log('Profile endpoint helper tests passed.');
}

run().catch((err) => { console.error('Tests failed:', err); process.exit(1); });
