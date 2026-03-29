const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri === 'mongodb://localhost:27017/surakshita') {
    console.warn('⚠️  MONGO_URI not set or using default. Please set a valid MongoDB URI in server/.env');
    console.warn('   Get a free cloud DB at: https://www.mongodb.com/atlas');
    return;
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    await seedDemoAccount();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

async function seedDemoAccount() {
  try {
    const User = require('../models/User');
    const exists = await User.findOne({ email: 'email123@gmail.com' });
    if (!exists) {
      await User.create({
        name: 'Demo User',
        email: 'email123@gmail.com',
        password: '@Email1234',
        isVerified: true,
        phone: '+911234567890',
      });
      console.log('✅ Demo account seeded: email123@gmail.com / @Email1234');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = connectDB;
