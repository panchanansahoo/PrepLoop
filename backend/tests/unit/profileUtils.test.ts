import { describe, it, expect } from 'vitest';
import { validateCustomUrl, buildAvatarPath, claimCustomUrl } from '../../utils/profileUtils.js';

describe('Profile Utilities & URL Claiming Unit Tests', () => {
  it('validates custom profile URLs according to format rules', () => {
    expect(validateCustomUrl('').valid).toBe(false);
    expect(validateCustomUrl('ab').valid).toBe(false);
    expect(validateCustomUrl('toolong'.repeat(10)).valid).toBe(false);
    expect(validateCustomUrl('invalid!slug').valid).toBe(false);

    const valid = validateCustomUrl('good-slug-123');
    expect(valid.valid).toBe(true);
    expect(valid.value).toBe('good-slug-123');
  });

  it('builds unique avatar paths with timestamp suffixes', () => {
    const path = buildAvatarPath('user_123', 'photo.png');
    expect(path).toMatch(/^avatars\/user_123_\d+\.png$/);
  });

  it('claims an available custom slug when no conflicting record exists', async () => {
    const supabaseMock: any = {
      from(_table: string) {
        return {
          select(_cols?: string) {
            return this;
          },
          eq(_col: string, _val: any) {
            return this;
          },
          limit(_n: number) {
            return Promise.resolve({ data: [], error: null });
          },
          update(obj: any) {
            return {
              eq(_field: string, _val: any) {
                return {
                  select() {
                    return {
                      maybeSingle() {
                        return Promise.resolve({
                          data: { id: 'user_1', custom_url: obj.custom_url },
                          error: null,
                        });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };

    const claimRes = await claimCustomUrl(supabaseMock, 'user_1', 'newslug');
    expect(claimRes.success).toBe(true);
    expect(claimRes.profile?.custom_url).toBe('newslug');
  });

  it('rejects custom slug claim when slug is already claimed by another user', async () => {
    const takenMock: any = {
      from(_table: string) {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          limit() {
            return Promise.resolve({ data: [{ id: 'other_user_456' }], error: null });
          },
        };
      },
    };

    const takenResult = await claimCustomUrl(takenMock, 'user_1', 'taken-slug');
    expect(takenResult.success).toBe(false);
    expect(takenResult.error).toBe('taken');
  });

});
