import assert from 'assert';
import { renderPortfolioHtml } from '../services/portfolioRendererService.js';

function run() {
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

  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'User data must be escaped');
  assert(html.includes('Featured Projects'), 'Portfolio sections should render');
  assert(html.includes('Repository'), 'Project links should render');

  console.log('Portfolio renderer service tests passed.');
}

try {
  run();
} catch (error) {
  console.error(`Portfolio renderer service tests failed: ${error.message}`);
  process.exit(1);
}
