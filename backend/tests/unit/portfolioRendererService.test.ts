import { describe, it, expect } from 'vitest';
import {
  normalizePortfolioAppearance,
  renderPortfolioHtml,
} from '../../services/portfolioRendererService.js';

describe('Portfolio Renderer Service Unit Tests', () => {
  it('escapes user input to prevent XSS injection attacks', () => {
    const html = renderPortfolioHtml({
      profile: {
        basicInfo: {
          fullName: '<script>alert(1)</script>',
          headline: 'Developer',
          summary: 'Builds tools',
          email: 'dev@example.com',
        },
        socials: {
          github: 'dev',
        },
        skills: {
          languages: ['JavaScript'],
          frameworks: ['React'],
        },
        experience: [
          {
            role: 'Engineer',
            company: 'Acme',
            startDate: '2024',
          },
        ],
        projects: [
          {
            name: 'Demo',
            description: 'Portfolio project',
            stack: ['Node.js'],
            repoUrl: 'https://github.com/demo/repo',
            featured: true,
          },
        ],
      },
      theme: {
        primaryColor: '#123456',
      },
    });

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Featured Projects');
    expect(html).toContain('Repository');
  });

  it('normalizes valid template and custom theme fields while stripping invalid values', () => {
    expect(
      normalizePortfolioAppearance('creative', {
        primaryColor: ' #112233 ',
        accentColor: '#abcdef',
        fontFamily: "'Poppins', sans-serif",
      })
    ).toEqual({
      template: 'creative',
      theme: {
        primaryColor: '#112233',
        accentColor: '#abcdef',
        fontFamily: "'Poppins', sans-serif",
      },
    });

    expect(
      normalizePortfolioAppearance('unknown-template', {
        primaryColor: 'red; background: url(evil)',
        accentColor: '#xyz123',
        fontFamily: 'Comic Sans; } body { display: none',
      })
    ).toEqual({
      template: 'minimal',
      theme: {},
    });
  });

  it('embeds normalized template and custom theme variables into rendered HTML', () => {
    const html = renderPortfolioHtml({
      profile: { basicInfo: { fullName: 'Jane Doe' } },
      template: 'dark',
      theme: {
        primaryColor: '#1e293b',
        accentColor: '#38bdf8',
        fontFamily: "'Fira Sans', sans-serif",
      },
    });

    expect(html).toContain('data-template="dark"');
    expect(html).toContain('--primary: #1e293b; --accent: #38bdf8;');
    expect(html).toContain("font-family: 'Fira Sans', sans-serif;");
  });
});

