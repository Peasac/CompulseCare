/**
 * MongoDB Connection Test Script
 * Run this to verify your MongoDB connection and create test data
 */

const mongoose = require('mongoose');

// Load your MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';

async function testConnection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    
    console.log('✅ Connected to MongoDB successfully!\n');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📦 Database name:', dbName);
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Existing collections:');
    if (collections.length === 0) {
      console.log('   (No collections yet - they will be created when you insert data)\n');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Import models to ensure they're registered
    console.log('\n🔧 Loading Mongoose models...');
    const JournalEntry = require('../lib/models/JournalEntry').default;
    const Mood = require('../lib/models/Mood').default;
    const Target = require('../lib/models/Target').default;
    const PanicEvent = require('../lib/models/PanicEvent').default;
    const User = require('../lib/models/User').default;
    
    console.log('✅ Models loaded:', Object.keys(mongoose.models).join(', '));
    
    // Create test data
    console.log('\n📝 Creating test data...\n');
    
    const testUserId = 'user123';
    
    // 1. Create a journal entry
    const journalEntry = await JournalEntry.create({
      userId: testUserId,
      compulsion: 'Checked door locks multiple times',
      triggers: ['Leaving house', 'Anxiety'],
      timeSpent: 15,
      anxietyLevel: 7,
      notes: 'Test entry to verify MongoDB integration',
    });
    console.log('✅ Created journal entry:', journalEntry._id);
    
    // 2. Create a mood entry
    const moodEntry = await Mood.create({
      userId: testUserId,
      mood: '😌',
      intensity: 6,
      notes: 'Testing mood tracking',
    });
    console.log('✅ Created mood entry:', moodEntry._id);
    
    // 3. Create a target
    const target = await Target.create({
      userId: testUserId,
      title: 'Reduce checking rituals',
      description: 'Limit door checking to once before leaving',
      type: 'daily',
      targetType: 'reduction',
      goal: 1,
      completed: false,
    });
    console.log('✅ Created target:', target._id);
    
    // 4. Create a panic event
    const panicEvent = await PanicEvent.create({
      userId: testUserId,
      duration: 180,
      completed: true,
      reflection: 'Feeling anxious about work deadline',
    });
    console.log('✅ Created panic event:', panicEvent._id);
    
    // Verify collections now exist
    console.log('\n📚 Collections after creating data:');
    const newCollections = await mongoose.connection.db.listCollections().toArray();
    newCollections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n✨ Success! Check MongoDB Compass and refresh to see:');
    console.log('   - journalentries');
    console.log('   - moods');
    console.log('   - targets');
    console.log('   - panicevents');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.log('\n⚠️  Make sure to set your MONGODB_URI environment variable!');
      console.log('   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/compulsecare');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed');
  }
}

testConnection();
