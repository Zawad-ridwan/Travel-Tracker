import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/** Connects to MongoDB. Throws with a readable message if it cannot. */
export async function connectDatabase(uri: string) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    console.log(`MongoDB connected (${mongoose.connection.name})`);
  } catch (err) {
    console.error('\nCould not connect to MongoDB. Check that:');
    console.error('  1. MONGODB_URI in server/.env is correct (including the password)');
    console.error('  2. Your IP address is allowed in Atlas → Network Access');
    console.error('  3. You are online\n');
    throw err;
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
