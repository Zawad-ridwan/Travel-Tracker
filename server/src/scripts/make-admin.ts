/**
 * Gives an existing account the admin role.
 *
 *   npm run make-admin -w server -- you@example.com
 *
 * It uses MONGODB_URI from server/.env, so it works for your Atlas database
 * (including the live one) from your own computer.
 * Log out and back in afterwards so your browser gets the new role.
 */
import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../db/connect';
import { User } from '../models/User';

async function run() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -w server -- you@example.com');
    process.exit(1);
  }

  await connectDatabase(env.MONGODB_URI);
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { returnDocument: 'after' });
  await disconnectDatabase();

  if (!user) {
    console.error(`No account found for ${email}. Sign up on the website first.`);
    process.exit(1);
  }
  console.log(`${user.name} <${user.email}> is now an admin. Log out and back in to see the Admin page.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
