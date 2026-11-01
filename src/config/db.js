import { MongoClient } from 'mongodb';

let client;
let clientPromise;

const uri = process.env.MONGODB_URI;
const dbName = 'kindora';

if (!uri) {
  throw new Error('Please add your MONGODB_URI to .env');
}

const connectDB = async () => {
  if (clientPromise) return clientPromise;

  client = new MongoClient(uri);
  clientPromise = client.connect();
  await clientPromise;

  const db = client.db(dbName);

  // Create unique compound index to prevent duplicate event participation
  try {
    await db.collection('eventParticipants').createIndex(
      { eventId: 1, userId: 1 },
      { unique: true }
    );
    console.log('✓ eventParticipants unique index ensured');
  } catch (err) {
    console.warn('Index creation warning:', err.message);
  }

  console.log(`✓ MongoDB connected: ${dbName}`);
  return db;
};

const getDB = () => {
  if (!client) throw new Error('Database not connected. Call connectDB first.');
  return client.db(dbName);
};

export { connectDB, getDB };
