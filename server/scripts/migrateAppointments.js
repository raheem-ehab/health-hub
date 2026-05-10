/**
 * Migration script to fix appointments with invalid doctorId values
 * This script handles cases where doctorId might be stored as a string instead of ObjectId
 * 
 * Run with: node server/scripts/migrateAppointments.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

dotenv.config();

async function migrateAppointments() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB');

    // Find all appointments
    const appointments = await Appointment.find({});
    console.log(`Found ${appointments.length} appointments to check`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const appointment of appointments) {
      try {
        const doctorId = appointment.doctorId;
        
        // Check if doctorId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
          console.log(`Appointment ${appointment._id} has invalid doctorId: ${doctorId}`);
          
          // Try to find doctor by converting string to ObjectId if it's a valid format
          // If doctorId is a string but looks like an ObjectId, try to convert it
          if (typeof doctorId === 'string' && doctorId.length === 24) {
            try {
              const objectIdDoctorId = new mongoose.Types.ObjectId(doctorId);
              const doctor = await Doctor.findById(objectIdDoctorId);
              
              if (doctor) {
                appointment.doctorId = objectIdDoctorId;
                await appointment.save();
                console.log(`  ✓ Fixed appointment ${appointment._id} - converted string to ObjectId`);
                fixed++;
                continue;
              }
            } catch (e) {
              // Not a valid ObjectId string
            }
          }
          
          // If we can't fix it, log it
          console.log(`  ✗ Cannot fix appointment ${appointment._id} - invalid doctorId: ${doctorId}`);
          errors++;
        } else {
          // Verify the doctor exists
          const doctor = await Doctor.findById(doctorId);
          if (!doctor) {
            console.log(`Appointment ${appointment._id} references non-existent doctor: ${doctorId}`);
            errors++;
          } else {
            skipped++; // Already valid
          }
        }
      } catch (error) {
        console.error(`Error processing appointment ${appointment._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total appointments: ${appointments.length}`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Already valid: ${skipped}`);
    console.log(`Errors/invalid: ${errors}`);

    await mongoose.connection.close();
    console.log('\nMigration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateAppointments();

