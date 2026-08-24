import { hashPassword } from './auth';

const password = process.env.PAPASTOCK_AUTH_PASSWORD;
if (!password) throw new Error('Definí PAPASTOCK_AUTH_PASSWORD sólo para ejecutar este comando.');
process.stdout.write(`${hashPassword(password)}\n`);
