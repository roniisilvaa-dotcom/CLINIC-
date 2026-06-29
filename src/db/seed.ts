import { db } from './index';

async function seed() {
  console.log("Database initialized.");
}

seed().catch(console.error);
