import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'kindora';

let client;
let clientPromise;
let db;

if (!uri) {
  throw new Error('Please add your MONGODB_URI to environment variables');
}

const connectDB = async () => {
  if (db) return db;

  if (!clientPromise) {
    client = new MongoClient(uri, {
      serverApi: ServerApiVersion.v1,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 20000,
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    clientPromise = client.connect();
  }

  try {
    await clientPromise;
    db = client.db(dbName);

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
  } catch (err) {
    clientPromise = null;
    db = null;
    throw err;
  }

  return db;
};

const getDB = () => {
  if (!db) throw new Error('Database not connected. Call connectDB first.');
  return db;
};

export { connectDB, getDB };
