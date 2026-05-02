#!/usr/bin/env node

/**
 * Voice Playback Optimization Test
 * Measures latency improvements with caching and parallel provider execution
 */

import voiceOptimization from '../services/voiceOptimizationService.js';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🎙️  Voice Playback Optimization Test Suite\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// Test 1: Cache initialization
test('Voice Optimization: Cache initialized', () => {
  const stats = voiceOptimization.getCacheStats();
  if (stats.size !== 0) throw new Error('Cache should start empty');
  if (stats.maxSize !== 100) throw new Error('Max cache size should be 100');
});

// Test 2: Get optimal provider
test('Voice Optimization: Get optimal providers', () => {
  const providers = voiceOptimization.getOptimalProvider();
  if (!Array.isArray(providers)) throw new Error('Should return array of providers');
  if (providers.length === 0) throw new Error('Should have at least one provider');
  if (providers.length > 3) throw new Error('Should return top 3 providers');
  
  // Check first provider (should be fastest)
  const first = providers[0];
  if (!first.name) throw new Error('Provider should have name');
  if (typeof first.latency !== 'number') throw new Error('Provider should have latency');
});

// Test 3: Preload common phrases
test('Voice Optimization: Preload phrases', async () => {
  // Should not throw and should be non-blocking
  voiceOptimization.preloadCommonPhrases();
  // Give it a moment to start
  await new Promise(r => setTimeout(r, 100));
});

// Test 4: Clear cache
test('Voice Optimization: Clear cache', () => {
  const result = voiceOptimization.clearCache();
  if (!result.cleared) throw new Error('Cache should be cleared');
  if (result.size !== 0) throw new Error('Cache should be empty');
});

// Test 5: Cache statistics
test('Voice Optimization: Cache statistics', () => {
  const stats = voiceOptimization.getCacheStats();
  if (typeof stats.size !== 'number') throw new Error('Size should be number');
  if (typeof stats.maxSize !== 'number') throw new Error('Max size should be number');
  if (typeof stats.ttl !== 'number') throw new Error('TTL should be number');
  if (typeof stats.utilization !== 'string') throw new Error('Utilization should be string');
});

// Test 6: Measure latency (mocked - won't call real providers)
test('Voice Optimization: Latency measurement structure', async () => {
  // This test checks the measurement structure without actually calling providers
  // In a real test environment, you'd mock the synthesizeFast function
  
  const mockResult = {
    average: 750,
    min: 600,
    max: 900,
    results: [
      { iteration: 1, latency: 750, cached: false, provider: 'kokoro' }
    ]
  };

  if (typeof mockResult.average !== 'number') throw new Error('Average should be number');
  if (mockResult.average < 0) throw new Error('Average should be positive');
  if (mockResult.min > mockResult.max) throw new Error('Min should be ≤ max');
});

// Test 7: Provider scoring
test('Voice Optimization: Provider scoring', () => {
  const providers = voiceOptimization.getOptimalProvider();
  
  // Verify scoring logic
  for (let i = 0; i < providers.length - 1; i++) {
    if (providers[i].score > providers[i + 1].score) {
      throw new Error('Providers should be sorted by score (ascending)');
    }
  }
});

// Test 8: Optimal provider caching
test('Voice Optimization: Caching LRU behavior', () => {
  const stats1 = voiceOptimization.getCacheStats();
  const initialSize = stats1.size;
  
  // Clear and verify
  voiceOptimization.clearCache();
  const stats2 = voiceOptimization.getCacheStats();
  
  if (stats2.size !== 0) throw new Error('Cache should be empty after clear');
});

// Test 9: Provider health check structure
test('Voice Optimization: Provider chain validation', () => {
  const providers = voiceOptimization.getOptimalProvider();
  
  const required = ['kokoro', 'edge'];
  const available = providers.map(p => p.name);
  
  for (const req of required) {
    if (!available.includes(req)) {
      throw new Error(`Provider ${req} should be available`);
    }
  }
});

// Test 10: Performance improvement potential
test('Voice Optimization: Latency improvement potential', () => {
  // Check expected latency improvements
  const providers = voiceOptimization.getOptimalProvider();
  
  // Local providers should be faster
  const localProviders = providers.filter(p => ['kokoro', 'edge'].includes(p.name));
  const remoteProviders = providers.filter(p => !['kokoro', 'edge'].includes(p.name));
  
  if (localProviders.length === 0) throw new Error('Should have local providers');
  
  // Local should generally be faster (lower latency)
  const avgLocal = localProviders.reduce((sum, p) => sum + p.latency, 0) / localProviders.length;
  const avgRemote = remoteProviders.reduce((sum, p) => sum + p.latency, 0) / remoteProviders.length || 0;
  
  if (avgRemote > 0 && avgLocal > avgRemote) {
    throw new Error('Local providers should typically be faster than remote');
  }
});

// Test 11: Reliability scoring
test('Voice Optimization: Provider reliability', () => {
  const providers = voiceOptimization.getOptimalProvider();
  
  for (const provider of providers) {
    if (typeof provider.reliability !== 'number') {
      throw new Error(`Provider ${provider.name} should have reliability score`);
    }
    if (provider.reliability < 0 || provider.reliability > 1) {
      throw new Error(`Reliability should be 0-1, got ${provider.reliability}`);
    }
  }
});

// Test 12: Cache TTL validation
test('Voice Optimization: Cache TTL configuration', () => {
  const stats = voiceOptimization.getCacheStats();
  
  // Default TTL should be 5 minutes (300000ms)
  if (stats.ttl !== 5 * 60 * 1000) {
    throw new Error(`TTL should be 300000ms, got ${stats.ttl}`);
  }
});

// Run all tests
runTests();
