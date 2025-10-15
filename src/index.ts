import dotenv from 'dotenv';
dotenv.config();

import { CustomClient } from './extensions';
import { Logger } from './services/logger';
import readline from 'readline';
import { createConnection } from 'mysql2/promise';

const client = new CustomClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function verifyUser(discordId: string, discordUsername: string): Promise<boolean> {
  try {
    const db = await createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.MYSQL_PORT) || 3306
    });

    const [rows]: any = await db.query(
      `SELECT * FROM discord_clients WHERE discord_id = ? AND discord_username = ? LIMIT 1`,
      [discordId, discordUsername]
    );

    await db.end();

    if (rows.length === 0) {
      console.log('❌ No user found with that ID and username.');
      return false;
    }

    if (!rows[0].is_permitted) {
      console.log('⚠️ User found but not permitted to run the bot.');
      return false;
    }

    console.log(`✅ Verified as ${rows[0].discord_username} (ID: ${rows[0].discord_id})`);
    return true;
  } catch (err: any) {
    console.log('❌ Failed to connect to the database. Please check your connection settings.');
    Logger.error('Database connection failed', err?.code || err?.message || err);
    return false;
  }
}

async function start(): Promise<void> {
  try {
    const discordUsername = await ask('Enter your discord username: ');
    const discordId = await ask('Enter your discord id: ');

    console.log('\n🔍 Checking database for authorization...');

    const authorized = await verifyUser(discordId, discordUsername);

    if (!authorized) {
      console.log('⛔ Access denied. Exiting.');
      rl.close();
      process.exit(1);
    }

    console.log('\n🚀 Authorization successful! Launching bot...\n');

    rl.close();
    await client.start();

  } catch (error) {
    console.log('❌ Failed to start the bot. Please check your setup.');
    Logger.error('Failed to start the bot', error);
    rl.close();
    process.exit(1);
  }
}

start();

export default client;
