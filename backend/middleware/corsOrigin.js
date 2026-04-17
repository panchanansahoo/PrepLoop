const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const PREPLOOP_VERCEL_PATTERN = /^https:\/\/preploop-frontend(?:-[a-z0-9-]+)*\.vercel\.app$/i;
const PREPLOOP_CUSTOM_DOMAIN_PATTERN = /^https:\/\/(www\.)?preploop\.me$/i;

export function isAllowedCorsOrigin(origin, configuredOrigins = []) {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  if (LOCAL_ORIGIN_PATTERN.test(origin)) {
    return true;
  }

  if (PREPLOOP_VERCEL_PATTERN.test(origin)) {
    return true;
  }

  if (PREPLOOP_CUSTOM_DOMAIN_PATTERN.test(origin)) {
    return true;
  }

  return false;
}
