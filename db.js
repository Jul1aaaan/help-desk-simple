require('dotenv').config();
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await client.connect();
  console.log('Connected to Redis');
})();

// Helper functions to simulate the previous lowdb behavior (array of tickets)
const DB_KEY = 'tickets';

async function getTickets() {
  const data = await client.get(DB_KEY);
  return data ? JSON.parse(data) : [];
}

async function saveTickets(tickets) {
  await client.set(DB_KEY, JSON.stringify(tickets));
}

module.exports = {
  client,
  getTickets,
  saveTickets
};
