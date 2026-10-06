const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');
const Booking = require('../../models/bookingModel');

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

// READ JSON FILE
const readData = (fileName) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf8'));

const tours = readData('tours.json');
const users = readData('users.json');
const reviews = readData('reviews.json');

const importData = async () => {
  await Tour.create(tours);
  const normalizedUsers = users.map((user) => ({
    ...user,
    role: user.role === 'lead-guide' ? 'guide' : user.role,
  }));

  // Seed passwords are already bcrypt hashes, so bypass the save hashing hook.
  await User.collection.insertMany(normalizedUsers);
  await Review.create(reviews);
  console.log('Data successfully loaded!');
};

const deleteData = async () => {
  await Booking.deleteMany();
  await Review.deleteMany();
  await Tour.deleteMany();
  await User.deleteMany();
  console.log('Data successfully deleted!');
};

const run = async () => {
  try {
    const { DATABASE, DATABASE_PASSWORD } = process.env;
    if (!DATABASE || !DATABASE_PASSWORD) {
      throw new Error(
        `DATABASE and DATABASE_PASSWORD are required in ${envFile}`
      );
    }

    await mongoose.connect(DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD));

    if (process.argv[2] === '--import') {
      await importData();
    } else if (process.argv[2] === '--delete') {
      await deleteData();
    } else {
      throw new Error('Usage: node import-dev-data.js --import|--delete');
    }
  } catch (error) {
    console.error('Dev data operation failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
