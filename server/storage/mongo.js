const { MongoClient, ObjectId } = require('mongodb');

// sails-mongo stores a Waterline id in _id, often as an ObjectId.
function filter(criteria) {
  const query = {};
  for (const [field, value] of Object.entries(criteria)) {
    const choices = (Array.isArray(value) ? value : [value]).flatMap(item => {
      const variants = [item];
      if (field === 'id' && typeof item === 'string' && ObjectId.isValid(item)) variants.push(new ObjectId(item));
      if (/^(id|.*Id)$/.test(field) && /^\d+$/.test(item)) variants.push(String(item), Number(item));
      if (field === 'updatedAt' && typeof item === 'string') variants.push(new Date(item));
      return variants;
    });
    query[field === 'id' ? '_id' : field] = { $in: choices };
  }
  return query;
}

function record({ _id, ...row }) {
  return { ...row, id: _id instanceof ObjectId ? _id.toHexString() : _id };
}

async function openMongo(url) {
  if (!url) throw new Error('DB_URL is required for MongoDB');
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();
  return {
    async find(name, criteria) { return (await db.collection(name).find(filter(criteria)).toArray()).map(record); },
    async create(name, values, existingCriteria) {
      const { id, ...data } = values;
      const now = new Date();
      const doc = { ...data, _id: id ?? new ObjectId(), createdAt: now, updatedAt: now };
      if (existingCriteria) {
        const saved = await db.collection(name).findOneAndUpdate(filter(existingCriteria), { $setOnInsert: doc }, { upsert: true, returnDocument: 'after' });
        return record(saved);
      }
      await db.collection(name).insertOne(doc);
      return record(doc);
    },
    async update(name, criteria, values) {
      const collection = db.collection(name);
      const rows = await collection.find(filter(criteria)).toArray();
      const updated = [];
      for (const row of rows) {
        const saved = await collection.findOneAndUpdate({ ...filter(criteria), _id: row._id },
          [{ $set: { ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { $literal: value }])),
            updatedAt: { $max: ['$$NOW', { $add: [{ $toDate: { $ifNull: ['$updatedAt', new Date(0)] } }, 1] }] } } }], { returnDocument: 'after' });
        if (saved) updated.push(record(saved));
      }
      return updated;
    },
    async destroy(name, criteria) {
      const collection = db.collection(name);
      const rows = await collection.find(filter(criteria)).toArray();
      const removed = [];
      for (const row of rows) {
        const result = await collection.findOneAndDelete({ ...filter(criteria), _id: row._id });
        if (result) removed.push(record(result));
      }
      return removed;
    },
    close: () => client.close(),
  };
}

module.exports = { openMongo };
