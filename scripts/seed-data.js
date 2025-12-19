/**
 * Seed Script - Populate database with realistic sample data
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...\n');
    
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('✅ Connected to MongoDB\n');
    
    const JournalEntry = require('../lib/models/JournalEntry').default;
    const Mood = require('../lib/models/Mood').default;
    const Target = require('../lib/models/Target').default;
    const PanicEvent = require('../lib/models/PanicEvent').default;
    
    const userId = 'user123';
    
    // Clear existing test data
    console.log('🧹 Clearing existing data...');
    await JournalEntry.deleteMany({ userId });
    await Mood.deleteMany({ userId });
    await Target.deleteMany({ userId });
    await PanicEvent.deleteMany({ userId });
    console.log('✅ Cleared\n');
    
    // Seed journal entries (last 7 days)
    console.log('📝 Creating journal entries...');
    const journalEntries = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const entriesPerDay = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < entriesPerDay; j++) {
        journalEntries.push({
          userId,
          compulsion: [
            'Checked locks repeatedly',
            'Counted items multiple times',
            'Washed hands excessively',
            'Organized desk items',
            'Reread messages',
          ][Math.floor(Math.random() * 5)],
          triggers: [
            ['Leaving house', 'Anxiety'],
            ['Work stress', 'Uncertainty'],
            ['Feeling unclean', 'Contamination fear'],
            ['Disorder', 'Need for symmetry'],
            ['Social interaction', 'Fear of mistakes'],
          ][Math.floor(Math.random() * 5)],
          timeSpent: Math.floor(Math.random() * 30) + 5,
          anxietyLevel: Math.floor(Math.random() * 5) + 3,
          createdAt: new Date(date.getTime() + j * 3600000),
        });
      }
    }
    await JournalEntry.insertMany(journalEntries);
    console.log(`✅ Created ${journalEntries.length} journal entries\n`);
    
    // Seed mood entries
    console.log('😊 Creating mood entries...');
    const moodEntries = [];
    const moods = [
      { emoji: '😊', intensity: 8 },
      { emoji: '😌', intensity: 7 },
      { emoji: '😐', intensity: 5 },
      { emoji: '😟', intensity: 4 },
      { emoji: '😢', intensity: 3 },
    ];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const mood = moods[Math.floor(Math.random() * moods.length)];
      
      moodEntries.push({
        userId,
        mood: mood.emoji,
        intensity: mood.intensity + Math.floor(Math.random() * 2) - 1,
        notes: i === 0 ? 'Feeling better after breathing exercise' : undefined,
        createdAt: date,
      });
    }
    await Mood.insertMany(moodEntries);
    console.log(`✅ Created ${moodEntries.length} mood entries\n`);
    
    // Seed targets
    console.log('🎯 Creating targets...');
    const targets = [
      {
        userId,
        title: 'Reduce checking rituals',
        description: 'Limit lock checking to once before leaving',
        type: 'daily',
        targetType: 'reduction',
        goal: 1,
        completed: true,
        completedAt: new Date(),
      },
      {
        userId,
        title: 'Practice mindful breathing',
        description: 'Use breathing exercise when feeling anxious',
        type: 'daily',
        targetType: 'mindfulness',
        goal: 3,
        completed: false,
      },
      {
        userId,
        title: 'Limit hand washing',
        description: 'No more than 30 seconds per wash',
        type: 'weekly',
        targetType: 'reduction',
        goal: 7,
        completed: false,
      },
    ];
    await Target.insertMany(targets);
    console.log(`✅ Created ${targets.length} targets\n`);
    
    // Seed panic events
    console.log('🆘 Creating panic events...');
    const panicEvents = [];
    for (let i = 5; i >= 0; i -= 2) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      panicEvents.push({
        userId,
        duration: Math.floor(Math.random() * 120) + 60,
        completed: true,
        reflection: 'Felt overwhelmed with intrusive thoughts',
        reflectionResponse: 'That sounds really difficult. Remember that these thoughts don\'t define you.',
        createdAt: date,
      });
    }
    await PanicEvent.insertMany(panicEvents);
    console.log(`✅ Created ${panicEvents.length} panic events\n`);
    
    console.log('✨ Seeding complete! Refresh MongoDB Compass to see your data.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedData();
