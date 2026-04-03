const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/IT_MIS')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));

const userSchema = new mongoose.Schema({
  rollNo: String,
  name: String,
  email: String,
  password: String,
  role: String,
  jobType: String,
  experience: String,
  system: String,
  dateOfJoining: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function addTestUser() {
  try {
    // Check if test user exists
    const existing = await User.findOne({ email: 'test@admin.com' });
    if (existing) {
      console.log('⚠️  Test user already exists');
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = new User({
      rollNo: 'TEST001',
      name: 'Test Admin',
      email: 'test@admin.com',
      password: hashedPassword,
      role: 'admin',
      jobType: 'fulltime',
      experience: '1 year',
      system: 'Windows',
      dateOfJoining: new Date()
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@admin.com');
    console.log('🔑 Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestUser();
