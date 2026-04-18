import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const envPath = path.join(backendRoot, '.env');

const allowedNodeEnvs = new Set(['development', 'production', 'test', 'staging']);
const loadedEnv = dotenv.config({ path: envPath });

const currentNodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
if (!allowedNodeEnvs.has(currentNodeEnv)) {
	const fallbackNodeEnv = (loadedEnv.parsed?.NODE_ENV || '').trim().toLowerCase();
	if (allowedNodeEnvs.has(fallbackNodeEnv)) {
		process.env.NODE_ENV = fallbackNodeEnv;
	}
}
