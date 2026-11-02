import { describe, it, expect } from 'vitest';
import { renderPortfolioHtml } from '../../services/portfolioRendererService.js';

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
});

