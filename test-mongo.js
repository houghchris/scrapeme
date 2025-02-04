import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://chris:SmQbBwIKGb1X5ZzF@scrapercluster.66h0o.mongodb.net/?retryWrites=true&w=majority&appName=ScraperCluster';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB!');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
  process.exit();
}

testConnection();
