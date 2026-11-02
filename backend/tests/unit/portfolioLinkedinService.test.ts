import { describe, it, expect } from 'vitest';
import { normalizeLinkedinPayload, validateLinkedinUrl } from '../../services/portfolioLinkedinService.js';

describe('Portfolio LinkedIn Service Unit Tests', () => {
  it('validates public LinkedIn member profile URLs correctly', () => {
    const valid = validateLinkedinUrl('https://www.linkedin.com/in/jane-doe-123/');
    expect(valid.valid).toBe(true);

    const companyUrl = validateLinkedinUrl('https://linkedin.com/company/acme');
    expect(companyUrl.valid).toBe(false);

    const invalid = validateLinkedinUrl('https://example.com/not-linkedin');
    expect(invalid.valid).toBe(false);
  });

  it('normalizes raw LinkedIn payload into standard portfolio profile structure', () => {
    const normalized = normalizeLinkedinPayload({
      url: 'https://linkedin.com/in/jane-doe-123',
      headline: 'Senior Engineer',
      summary: 'Building resilient systems',
      experience: [{ company: 'Acme', role: 'Engineer' }],
      education: [{ institute: 'ABC University' }],
      skills: ['Node.js', 'System Design'],
      fullName: 'Jane Doe',
    });

    expect(normalized.basicInfo.fullName).toBe('Jane Doe');
    expect(normalized.experience[0].source).toBe('linkedin');
    expect(normalized.skills).toHaveLength(2);
    expect(normalized.basicInfo.headline).toBe('Senior Engineer');
  });
});

