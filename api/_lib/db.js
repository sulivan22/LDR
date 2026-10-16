import { MongoClient } from 'mongodb';

let clientPromise;
let indexesPromise;

function getClientPromise() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getMembersCollection() {
  const client = await getClientPromise();
  const database = client.db(process.env.MONGODB_DB_NAME || 'ladymadrid');
  const collection = database.collection(process.env.MONGODB_COLLECTION || 'members');

  if (!indexesPromise) {
    indexesPromise = Promise.all([
      collection.createIndex({ email: 1 }, { unique: true, name: 'email_unique' }),
      collection.createIndex({ verificationTokenHash: 1 }, { unique: true, sparse: true, name: 'verification_token_unique' }),
      collection.createIndex({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0, name: 'verification_expiry' }),
    ]);
  }
  await indexesPromise;
  return collection;
}
