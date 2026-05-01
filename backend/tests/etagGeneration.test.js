import { createHash } from 'crypto';

// Replicate the fixed generateETag function for testing
function generateETag(body) {
  const canonical = JSON.stringify(body) || '';
  return `"${createHash('sha256').update(canonical).digest('hex').slice(0, 16)}"`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message} (expected ${expected}, got ${actual})`);
  }
}

function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new Error(`❌ FAILED: ${message} (should not equal ${expected})`);
  }
}

function testETagGeneration() {
  console.log('\n🧪 Testing ETag Generation - Collision Resistance\n');

  // Test 1: Different strings
  const etag1 = generateETag('hello');
  const etag2 = generateETag('hello world');
  assertNotEqual(etag1, etag2, 'Different strings should have different ETags');
  console.log('✅ Test 1: Different strings have different ETags');

  // Test 2: Large strings differing after 10KB (collision in old implementation)
  const large1 = 'x'.repeat(10240) + 'end1';
  const large2 = 'x'.repeat(10240) + 'end2';
  const etagLarge1 = generateETag(large1);
  const etagLarge2 = generateETag(large2);
  assertNotEqual(etagLarge1, etagLarge2, 'Large strings differing after 10KB should have different ETags');
  console.log('✅ Test 2: Large strings differing after 10KB have different ETags (fixed lossy hashing)');

  // Test 3: Different arrays
  const etagArr1 = generateETag([1, 2, 3, 4, 5]);
  const etagArr2 = generateETag([1, 2, 3, 4, 6]);
  assertNotEqual(etagArr1, etagArr2, 'Different arrays should have different ETags');
  console.log('✅ Test 3: Different arrays have different ETags');

  // Test 4: Arrays differing only in middle (sampling collision in old implementation)
  const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const arr2 = [1, 2, 9, 4, 5, 6, 7, 8, 9];
  const etagMiddle1 = generateETag(arr1);
  const etagMiddle2 = generateETag(arr2);
  assertNotEqual(etagMiddle1, etagMiddle2, 'Arrays differing in middle should have different ETags');
  console.log('✅ Test 4: Arrays differing in middle have different ETags (fixed sampling collision)');

  // Test 5: Objects with different nested values (placeholder collision in old implementation)
  const obj1 = { user: { name: 'Alice', age: 30 } };
  const obj2 = { user: { name: 'Bob', age: 30 } };
  const etagObj1 = generateETag(obj1);
  const etagObj2 = generateETag(obj2);
  assertNotEqual(etagObj1, etagObj2, 'Objects with different nested values should have different ETags');
  console.log('✅ Test 5: Objects with different nested values have different ETags (fixed nested collision)');

  // Test 6: Objects with different nested array values
  const objArr1 = { items: [1, 2, 3] };
  const objArr2 = { items: [1, 2, 4] };
  const etagObjArr1 = generateETag(objArr1);
  const etagObjArr2 = generateETag(objArr2);
  assertNotEqual(etagObjArr1, etagObjArr2, 'Objects with different nested arrays should have different ETags');
  console.log('✅ Test 6: Objects with different nested arrays have different ETags');

  // Test 7: Identical data
  const data = { name: 'test', value: 42, nested: { key: 'value' } };
  const etagData1 = generateETag(data);
  const etagData2 = generateETag(data);
  assertEqual(etagData1, etagData2, 'Identical data should have same ETag');
  console.log('✅ Test 7: Identical data has same ETag');

  // Test 8: ETag format with quotes
  const etagFormat = generateETag('test');
  assert(/^"[a-f0-9]{16}"$/.test(etagFormat), `ETag should match format "hexstring", got ${etagFormat}`);
  console.log('✅ Test 8: ETag is properly formatted with quotes');

  // Test 9: Null vs undefined
  const etagNull = generateETag(null);
  const etagUndef = generateETag(undefined);
  assertNotEqual(etagNull, etagUndef, 'Null and undefined should have different ETags');
  console.log('✅ Test 9: Null and undefined have different ETags');

  // Test 10: Empty structures
  const etagEmpty1 = generateETag([]);
  const etagEmpty2 = generateETag({});
  const etagEmpty3 = generateETag('');
  assertNotEqual(etagEmpty1, etagEmpty2, 'Empty array and object should have different ETags');
  assertNotEqual(etagEmpty1, etagEmpty3, 'Empty array and string should have different ETags');
  assertNotEqual(etagEmpty2, etagEmpty3, 'Empty object and string should have different ETags');
  console.log('✅ Test 10: Empty structures have different ETags');

  // Test 11: Deeply nested structures
  const etagDeep1 = generateETag({ a: { b: { c: { d: 1 } } } });
  const etagDeep2 = generateETag({ a: { b: { c: { d: 2 } } } });
  assertNotEqual(etagDeep1, etagDeep2, 'Deeply nested objects with different values should have different ETags');
  console.log('✅ Test 11: Deeply nested structures have different ETags');

  console.log('\n🎉 All ETag generation tests passed!\n');
}

// Run tests
testETagGeneration();
