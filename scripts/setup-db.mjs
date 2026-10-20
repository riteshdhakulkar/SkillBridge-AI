/**
 * Bootstrap the MySQL database for SkillBridge AI.
 *
 * Creates the database, the application user and its grants, then applies
 * schema.sql. Safe to run more than once - every statement is idempotent.
 *
 *   npm run db:setup
 *
 * It needs MySQL administrator (root) credentials. They are read from
 * DB_ROOT_USER / DB_ROOT_PASSWORD, or prompted for if they are not set.
 * The application user's password comes from DB_PASSWORD.
 */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_NAME || 'skillbridge_ai';
  const appUser = process.env.DB_USER || 'skillbridge_app';
  const appPassword = process.env.DB_PASSWORD || '';

  const rootUser = process.env.DB_ROOT_USER || (await ask('MySQL admin user [root]: ')) || 'root';
  // Check for presence, not truthiness - an intentionally empty root password
  // is a valid configuration on a freshly initialised local server.
  let rootPassword = 'DB_ROOT_PASSWORD' in process.env ? process.env.DB_ROOT_PASSWORD : undefined;
  if (rootPassword === undefined) {
    rootPassword = await ask(`Password for ${rootUser}: `);
  }

  if (!appPassword) {
    console.error('\nDB_PASSWORD is not set in .env - set the application user password first.');
    process.exit(1);
  }

  console.log(`\nConnecting to ${rootUser}@${host}:${port} ...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user: rootUser,
    password: rootPassword,
    multipleStatements: true,
  });

  try {
    console.log(`Creating database "${dbName}" ...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
    );

    // The account name is split into user and host separately. Do NOT embed
    // the host in quotes here - the driver escapes the value, so a quoted
    // host would be stored literally as 'localhost' and never match.
    for (const hostPart of ['localhost', '127.0.0.1']) {
      console.log(`Creating user ${appUser}@${hostPart} ...`);
      await connection.query(
        `CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?`,
        [appUser, hostPart, appPassword]
      );
      await connection.query(
        `ALTER USER ?@? IDENTIFIED BY ?`,
        [appUser, hostPart, appPassword]
      );
      await connection.query(
        `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO ?@?`,
        [appUser, hostPart]
      );
    }
    await connection.query('FLUSH PRIVILEGES');

    console.log('Applying schema.sql ...');
    const schema = fs.readFileSync(path.join(ROOT, 'schema.sql'), 'utf8');
    await connection.query(schema);

    console.log('\nDone. Verify with:');
    console.log(`  mysql -h ${host} -P ${port} -u ${appUser} -p -e "USE ${dbName}; SHOW TABLES;"`);
  } catch (err) {
    console.error(`\nSetup failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
