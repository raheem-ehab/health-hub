import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Admin from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Admin emails to seed
    const adminEmails = [
      'RaheemEhab@gmail.com',
      'Atefmohamed@gmail.com',
      'Abdallah@gmail.com',
      'shahd@gmail.com'
    ];

    // Default password for all admins (should be changed after first login)
    const defaultPassword = 'Admin123!';

    console.log('🌱 Seeding admin accounts...\n');

    for (const email of adminEmails) {
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      
      if (existingAdmin) {
        console.log(`ℹ️  Admin already exists: ${email}`);
      } else {
        await Admin.create({
          email: email.toLowerCase(),
          password: defaultPassword,
          role: 'admin'
        });
        console.log(`✅ Admin created: ${email}`);
      }
    }

    console.log('\n📋 Admin Accounts:');
    console.log('   Default Password: Admin123!');
    console.log('   (Please change passwords after first login)\n');
    console.log('🎉 Admin seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

