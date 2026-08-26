import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const blueprint = parse(await readFile(new URL('../render.yaml', import.meta.url), 'utf8'));
const web = blueprint?.services?.find((service) => service.type === 'web');
const database = blueprint?.databases?.find((item) => item.name === 'papastock-db');

function assert(condition, message) {
  if (!condition) throw new Error(`render.yaml inválido: ${message}`);
}

assert(blueprint.services?.length === 1, 'debe declarar exactamente un servicio');
assert(blueprint.databases?.length === 1, 'debe declarar exactamente una base');
assert(web?.runtime === 'node' && web?.plan !== 'free', 'el web debe ser Node pago');
assert(web?.region === database?.region, 'servicio y base deben compartir región');
assert(web?.preDeployCommand === 'npm run db:migrate -- --apply-production', 'la migración de producción debe correr en pre-deploy');
assert(web?.healthCheckPath === '/health', 'falta healthCheckPath /health');
assert(web?.envVars?.some((item) => item.key === 'GROQ_API_KEY' && item.sync === false), 'GROQ_API_KEY debe ser secreto sync:false');
assert(web?.envVars?.some((item) => item.key === 'DATABASE_URL' && item.fromDatabase?.name === database.name && item.fromDatabase?.property === 'connectionString'), 'DATABASE_URL debe venir de Postgres');
assert(web?.envVars?.some((item) => item.key === 'PAPASTOCK_AUTH_USERNAME' && item.value), 'falta el usuario operativo');
assert(web?.envVars?.some((item) => item.key === 'PAPASTOCK_AUTH_PASSWORD_HASH' && item.sync === false), 'el hash de autenticación debe ser secreto sync:false');
assert(web?.envVars?.some((item) => item.key === 'PAPASTOCK_SESSION_SECRET' && item.sync === false), 'el secreto de sesión debe ser sync:false');
console.log('render.yaml válido: 1 web Node + 1 PostgreSQL, misma región, secretos y pre-deploy correctos.');
