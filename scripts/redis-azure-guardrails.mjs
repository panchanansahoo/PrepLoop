import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const defaults = {
  resourceGroup: process.env.REDIS_AZURE_RESOURCE_GROUP || 'preploop-redis-rg',
  containerName: process.env.REDIS_AZURE_CONTAINER || 'preploop-redis-aci',
  webAppResourceGroup: process.env.REDIS_AZURE_WEBAPP_RESOURCE_GROUP || 'preploop-backend',
  webAppName: process.env.REDIS_AZURE_WEBAPP_NAME || 'preploop-api-staging',
  envPath: process.env.REDIS_ENV_PATH || path.join(process.cwd(), 'backend', '.env'),
  strictMode: process.env.REDIS_GUARDRAILS_STRICT === 'true' || process.argv.includes('--strict')
};

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Env file not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx < 0) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }

  return env;
}

function runAz(args) {
  const printableArgs = args.map((arg, index) => {
    if (typeof arg !== 'string') return arg;
    if (index > 0 && args[index - 1] === '-a') return '***';
    let sanitized = arg;
    if (/requirepass\s+\S+/i.test(sanitized)) {
      sanitized = sanitized.replace(/(requirepass\s+)\S+/i, '$1***');
    }
    sanitized = sanitized.replace(/-a\s+'[^']*'/g, "-a '***'");
    sanitized = sanitized.replace(/-a\s+\S+/g, '-a ***');
    return sanitized;
  });

  try {
    if (process.platform === 'win32') {
      const psQuote = (s) => `'${String(s).replace(/'/g, "''")}'`;
      const command = `& az ${args.map(psQuote).join(' ')}`;
      return execFileSync('powershell', ['-NoProfile', '-Command', command], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim();
    }

    return execFileSync('az', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const stderr = String(error?.stderr || '').trim();
    const stdout = String(error?.stdout || '').trim();
    const details = stderr || stdout || error.message;
    throw new Error(`az ${printableArgs.join(' ')} failed: ${details}`);
  }
}

function check(name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name} - ${detail}`);
  return ok;
}

function redactRedisUrl(redisUrl) {
  try {
    const parsed = new URL(redisUrl);
    parsed.password = parsed.password ? '***' : '';
    return parsed.toString();
  } catch {
    return '<invalid redis url>';
  }
}

async function main() {
  const localEnv = readEnvFile(defaults.envPath);
  const failures = [];

  let cloudEnv = null;
  const shouldUseCloudConfig = process.argv.includes('--cloud')
    || process.env.REDIS_GUARDRAILS_SOURCE === 'azure'
    || localEnv.USE_REDIS !== 'true';

  if (shouldUseCloudConfig) {
    try {
      const appSettingsJson = runAz([
        'webapp',
        'config',
        'appsettings',
        'list',
        '--resource-group',
        defaults.webAppResourceGroup,
        '--name',
        defaults.webAppName,
        '--output',
        'json'
      ]);
      cloudEnv = {};
      for (const entry of JSON.parse(appSettingsJson)) {
        cloudEnv[entry.name] = entry.value;
      }
    } catch (error) {
      cloudEnv = null;
      console.log(`[WARN] Azure app settings lookup failed - ${error.message}`);
    }
  }

  const env = cloudEnv && cloudEnv.USE_REDIS === 'true' ? cloudEnv : localEnv;
  const sourceName = env === cloudEnv ? 'azure app settings' : 'local backend env';

  const useRedis = env.USE_REDIS === 'true';
  const redisUrlRaw = env.REDIS_URL || '';

  check('Redis config source', Boolean(env), sourceName);

  if (!check('USE_REDIS flag', useRedis, `USE_REDIS=${env.USE_REDIS || '<missing>'}`)) {
    failures.push('USE_REDIS must be true');
  }

  let redisUrl;
  try {
    redisUrl = new URL(redisUrlRaw);
    const protocolOk = redisUrl.protocol === 'redis:' || redisUrl.protocol === 'rediss:';
    if (!check('REDIS_URL format', protocolOk, redactRedisUrl(redisUrlRaw))) {
      failures.push('REDIS_URL must use redis:// or rediss://');
    }
  } catch {
    check('REDIS_URL format', false, '<invalid URL>');
    failures.push('REDIS_URL is missing or invalid');
  }

  let container;
  try {
    const json = runAz([
      'container',
      'show',
      '--resource-group',
      defaults.resourceGroup,
      '--name',
      defaults.containerName,
      '--output',
      'json'
    ]);
    container = JSON.parse(json);

    const running = container?.instanceView?.state === 'Running';
    const succeeded = container?.provisioningState === 'Succeeded';
    const stateDetail = `state=${container?.instanceView?.state || 'unknown'}, provisioning=${container?.provisioningState || 'unknown'}`;

    if (!check('Azure container state', running && succeeded, stateDetail)) {
      failures.push('Azure container is not in Running/Succeeded state');
    }

    const ipType = container?.ipAddress?.type || 'unknown';
    const endpoint = container?.ipAddress?.fqdn || container?.ipAddress?.ip || '<missing endpoint>';
    check('Azure endpoint available', Boolean(endpoint && endpoint !== '<missing endpoint>'), endpoint);

    if (ipType === 'Public') {
      console.log('[WARN] Endpoint exposure - Redis is currently on a public IP. Prefer private networking for production.');
      if (defaults.strictMode) {
        failures.push('Strict mode: Redis endpoint must not be public');
      }
    }

    if (redisUrl) {
      const host = redisUrl.hostname;
      const endpointMatches = host === container?.ipAddress?.fqdn || host === container?.ipAddress?.ip;
      if (!check('Env points to active container endpoint', endpointMatches, `env host=${host}, container fqdn=${container?.ipAddress?.fqdn || 'n/a'}, ip=${container?.ipAddress?.ip || 'n/a'}`)) {
        failures.push('REDIS_URL host does not match current container endpoint');
      }
    }

    if (env === cloudEnv) {
      const routeAll = cloudEnv?.WEBSITE_VNET_ROUTE_ALL || '0';
      check('App Service VNet route all', routeAll === '1', `WEBSITE_VNET_ROUTE_ALL=${routeAll}`);
    }
  } catch (error) {
    check('Azure container lookup', false, error.message);
    failures.push('Unable to inspect Azure container');
  }

  try {
    const unauthResult = runAz([
      'container',
      'exec',
      '--resource-group',
      defaults.resourceGroup,
      '--name',
      defaults.containerName,
      '--container-name',
      defaults.containerName,
      '--exec-command',
      'redis-cli -h 127.0.0.1 ping'
    ]);

    const unauthDenied = /NOAUTH/i.test(unauthResult);
    if (!check('Unauthenticated access denied', unauthDenied, unauthDenied ? 'NOAUTH enforced' : unauthResult || 'unexpected output')) {
      failures.push('Unauthenticated redis ping was not denied');
    }
  } catch (error) {
    const denied = /NOAUTH/i.test(error.message);
    if (!check('Unauthenticated access denied', denied, denied ? 'NOAUTH enforced' : error.message)) {
      failures.push('Unable to verify unauthenticated redis access behavior');
    }
  }

  try {
    if (!redisUrl || !redisUrl.password) {
      throw new Error('REDIS_URL password is missing');
    }

    const safePassword = redisUrl.password;
    const authResult = runAz([
      'container',
      'exec',
      '--resource-group',
      defaults.resourceGroup,
      '--name',
      defaults.containerName,
      '--container-name',
      defaults.containerName,
      '--exec-command',
      `redis-cli --no-auth-warning -h 127.0.0.1 -a ${safePassword} ping`
    ]);

    const authOk = /PONG/i.test(authResult);
    if (!check('Authenticated ping', authOk, authOk ? 'PONG' : authResult || 'unexpected output')) {
      failures.push('Authenticated redis ping failed');
    }
  } catch (error) {
    check('Authenticated ping', false, error.message);
    failures.push('Unable to verify authenticated redis ping');
  }

  if (failures.length > 0) {
    console.log('\nGuardrail summary: FAIL');
    for (const failure of failures) {
      console.log(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('\nGuardrail summary: PASS');
}

main().catch((error) => {
  console.error('Guardrail check failed:', error.message);
  process.exit(1);
});
