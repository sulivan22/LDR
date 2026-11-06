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
    indexesPromise = ensureIndexes(collection);
  }
  await indexesPromise;
  return collection;
}

async function ensureIndexes(collection) {
  // The first version of the form created a unique email index. Remove it so
  // the same customer can register each additional purchase independently.
  try {
    await collection.dropIndex('email_unique');
  } catch (error) {
    const indexDoesNotExist = error?.code === 27 || error?.codeName === 'IndexNotFound';
    if (!indexDoesNotExist) throw error;
  }

  await Promise.all([
    collection.createIndex({ email: 1 }, { name: 'email_lookup' }),
    collection.createIndex({ verificationTokenHash: 1 }, { unique: true, sparse: true, name: 'verification_token_unique' }),
    collection.createIndex({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0, name: 'verification_expiry' }),
  ]);
}
