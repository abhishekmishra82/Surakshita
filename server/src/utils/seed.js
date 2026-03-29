require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_EMAIL = 'email123@gmail.com';
const DEMO_PASSWORD = '@Email1234';
const DEMO_NAME = 'Demo User';

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('your_') || uri === 'mongodb://localhost:27017/surakshita') {
    console.log('⚠️  No valid MONGO_URI set. Skipping seed.');
    console.log('   Set MONGO_URI in server/.env and re-run: node src/utils/seed.js');
    process.exit(0);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    console.log('ℹ️  Demo account already exists:', DEMO_EMAIL);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    isVerified: true,
    phone: '+911234567890',
  });

  console.log('✅ Demo account created:');
  console.log('   Email   :', DEMO_EMAIL);
  console.log('   Password:', DEMO_PASSWORD);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
