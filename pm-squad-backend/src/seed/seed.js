require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const seedBoss = async () => {
  try {
    await connectDB();

    // Remove any existing boss so the seed is idempotent.
    await User.deleteOne({ role: 'boss' });

    const boss = await User.create({
      name: process.env.BOSS_NAME,
      email: process.env.BOSS_EMAIL,
      password: process.env.BOSS_PASSWORD,
      role: 'boss',
      color: '#EF4444',
    });

    console.log(
      `Boss created: ${boss.email} / ${process.env.BOSS_PASSWORD}`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedBoss();
