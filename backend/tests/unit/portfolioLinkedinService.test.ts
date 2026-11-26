import { describe, it, expect } from 'vitest';
import {
  normalizeLinkedinPayload,
  parseLinkedinExportText,
  validateLinkedinUrl,
} from '../../services/portfolioLinkedinService.js';

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
      experience: [{ company: 'Acme', role: 'Engineer', duration: 'Jan 2022 - Present · 2 yrs' }],
      education: [{ institute: 'ABC University' }],
      skills: ['Node.js', 'System Design'],
      fullName: 'Jane Doe',
    });

    expect(normalized.basicInfo.fullName).toBe('Jane Doe');
    expect(normalized.experience[0].source).toBe('linkedin');
    expect(normalized.experience[0].startDate).toBe('Jan 2022');
    expect(normalized.experience[0].endDate).toBe('Present');
    expect(normalized.skills).toHaveLength(2);
    expect(normalized.basicInfo.headline).toBe('Senior Engineer');
  });

  it('does not treat an About-only paste (even with location/URL + other sections) as name and headline', () => {
    const aboutOnly = parseLinkedinExportText('I build distributed systems.\nI mentor backend engineers.');
    expect(aboutOnly).toMatchObject({
      fullName: null,
      headline: null,
      summary: 'I build distributed systems.\nI mentor backend engineers.',
      location: null,
    });

    const aboutHeading = parseLinkedinExportText('About\nPassionate software engineer.\nFocused on TypeScript and Node.js.');
    expect(aboutHeading).toMatchObject({
      fullName: null,
      headline: null,
      summary: 'Passionate software engineer. Focused on TypeScript and Node.js.',
    });

    const aboutPlusSkills = parseLinkedinExportText(
      'I am a backend engineer passionate about APIs.\n' +
      'I build microservices in Go and Node.js.\n' +
      'Currently based in Austin, TX.\n' +
      'https://linkedin.com/in/jane-doe\n\n' +
      'Skills\nGo\nNode.js'
    );
    expect(aboutPlusSkills?.fullName).toBeNull();
    expect(aboutPlusSkills?.headline).toBeNull();
    expect(aboutPlusSkills?.summary).toContain('I am a backend engineer');
    expect(aboutPlusSkills?.skills).toEqual(['Go', 'Node.js']);
  });

  it('extracts header fields only when a real profile header is present', () => {
    const fullExport = parseLinkedinExportText(
      'Jane Doe\n' +
      'Staff Software Engineer\n' +
      'San Francisco, CA\n' +
      'https://www.linkedin.com/in/jane-doe\n\n' +
      'About\n' +
      'Building resilient platforms.\n\n' +
      'Education\n' +
      'MIT\n\n' +
      'Skills\n' +
      'TypeScript\nPostgreSQL'
    );

    expect(fullExport).toMatchObject({
      fullName: 'Jane Doe',
      headline: 'Staff Software Engineer',
      location: 'San Francisco, CA',
      linkedin: 'https://www.linkedin.com/in/jane-doe',
      summary: 'Building resilient platforms.',
      skills: ['TypeScript', 'PostgreSQL'],
      education: [{ institute: 'MIT', source: 'linkedin' }],
    });
  });

  it('parses multiline experience entries without turning companies, dates, or descriptions into separate roles', () => {
    const multiline = parseLinkedinExportText(
      'Experience\n' +
      'Senior Software Engineer\n' +
      'Acme Corp · Full-time\n' +
      'Jan 2022 - Present · 2 yrs 11 mos\n' +
      'San Francisco, CA\n' +
      '- Led microservices migration\n' +
      '- Mentored 4 engineers\n\n' +
      'Built internal observability platform and reduced p99 latency by 40%.\n\n' +
      'Software Engineer\n' +
      'Beta Inc\n' +
      'Full-time\n' +
      'Jun 2019 - Dec 2021 · 2 yrs 7 mos'
    );

    expect(multiline?.fullName).toBeNull();
    expect(multiline?.headline).toBeNull();
    expect(multiline?.experience).toEqual([
      {
        role: 'Senior Software Engineer',
        company: 'Acme Corp',
        duration: 'Jan 2022 - Present · 2 yrs 11 mos',
        source: 'linkedin',
      },
      {
        role: 'Software Engineer',
        company: 'Beta Inc',
        duration: 'Jun 2019 - Dec 2021 · 2 yrs 7 mos',
        source: 'linkedin',
      },
    ]);
  });

  it('handles grouped roles under a single company and compact multiline entries without blank lines', () => {
    const grouped = parseLinkedinExportText(
      'Experience\n' +
      'Acme Corp\n' +
      'Full-time · 4 yrs 2 mos\n\n' +
      'Senior Software Engineer\n' +
      'Jan 2022 - Present · 2 yrs 11 mos\n' +
      'Bengaluru, India\n\n' +
      'Software Engineer\n' +
      'Nov 2020 - Dec 2021 · 1 yr 2 mos'
    );

    expect(grouped?.experience).toEqual([
      {
        role: 'Senior Software Engineer',
        company: 'Acme Corp',
        duration: 'Jan 2022 - Present · 2 yrs 11 mos',
        source: 'linkedin',
      },
      {
        role: 'Software Engineer',
        company: 'Acme Corp',
        duration: 'Nov 2020 - Dec 2021 · 1 yr 2 mos',
        source: 'linkedin',
      },
    ]);

    const compact = parseLinkedinExportText(
      'Experience\n' +
      'Senior Engineer\n' +
      'Acme Corp\n' +
      '2022 - Present\n' +
      'San Francisco, CA\n' +
      '- Shipped search v2\n' +
      'Software Engineer\n' +
      'Beta Labs\n' +
      '2020 - 2022'
    );

    expect(compact?.experience).toEqual([
      {
        role: 'Senior Engineer',
        company: 'Acme Corp',
        duration: '2022 - Present',
        source: 'linkedin',
      },
      {
        role: 'Software Engineer',
        company: 'Beta Labs',
        duration: '2020 - 2022',
        source: 'linkedin',
      },
    ]);
  });
});

