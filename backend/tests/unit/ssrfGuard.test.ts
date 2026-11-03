import { describe, it, expect } from 'vitest';
import { validateOutboundUrl, isSafeOutboundUrl } from '../../utils/ssrfGuard.js';

describe('SSRF Protection Guardrails', () => {
  it('blocks loopback and localhost targets', () => {
    const maliciousUrls = [
      'http://localhost:5000/api/admin',
      'https://localhost:8080/metrics',
      'http://127.0.0.1:3000',
      'https://127.0.0.1/admin',
      'http://[::1]:8080/secret',
      'https://localhost.localdomain',
    ];

    for (const url of maliciousUrls) {
      const res = validateOutboundUrl(url, { requireHttps: false });
      expect(res.safe).toBe(false);
      expect(isSafeOutboundUrl(url, { requireHttps: false })).toBe(false);
    }
  });

  it('blocks cloud metadata service endpoints (AWS/GCP/Azure)', () => {
    const metadataUrls = [
      'http://169.254.169.254/latest/meta-data/',
      'https://169.254.169.254/computeMetadata/v1/',
      'http://metadata.google.internal/computeMetadata/v1/',
      'https://metadata.google.internal',
      'http://instance-data/latest/meta-data',
    ];

    for (const url of metadataUrls) {
      const res = validateOutboundUrl(url, { requireHttps: false });
      expect(res.safe).toBe(false);
    }
  });

  it('blocks RFC1918 private subnets', () => {
    const privateUrls = [
      'https://10.0.0.1/internal-api',
      'https://10.255.255.254',
      'https://172.16.0.5/api',
      'https://172.31.255.254',
      'https://192.168.1.1/router',
      'https://192.168.100.50',
      'https://100.64.0.1/shared',
    ];

    for (const url of privateUrls) {
      const res = validateOutboundUrl(url, { requireHttps: false });
      expect(res.safe).toBe(false);
    }
  });

  it('blocks non-HTTP protocols (e.g. file://, gopher://, ftp://)', () => {
    const badProtocols = [
      'file:///etc/passwd',
      'ftp://files.example.com',
      'gopher://gopher.example.com',
      'dict://dict.org',
    ];

    for (const url of badProtocols) {
      const res = validateOutboundUrl(url, { requireHttps: false });
      expect(res.safe).toBe(false);
    }
  });

  it('requires HTTPS by default', () => {
    const httpUrl = 'http://api.partner.com/webhook';
    const res = validateOutboundUrl(httpUrl, { requireHttps: true });
    expect(res.safe).toBe(false);
    expect(res.error).toContain('HTTPS');
  });

  it('permits legitimate public HTTPS webhook targets', () => {
    const validUrls = [
      'https://api.github.com/repos/preploop/events',
      'https://hooks.slack.com/services/T00/B00/X00',
      'https://webhook.site/12345678-abcd-ef01-2345-6789abcdef01',
      'https://enterprise.acme-corp.com/api/v1/preploop-callback',
    ];

    for (const url of validUrls) {
      const res = validateOutboundUrl(url);
      expect(res.safe).toBe(true);
      expect(res.parsedUrl).toBeDefined();
    }
  });
});

