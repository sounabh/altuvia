// scripts/setup-database.js
import { prisma } from "../../src/lib/prisma.js";

class DatabaseSetup {
  async checkConnection() {
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async checkTables() {
    console.log('🔍 Checking database tables...');
    
    const tables = [
      'universities',
      'programs',
      'departments',
      'admissions',
      'intakes',
      'essay_prompts',
      'scholarships',
      'tuition_breakdowns'
    ];

    const existingTables = [];
    
    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM ${Prisma.raw(table)} LIMIT 1`;
        existingTables.push(table);
      } catch (error) {
        console.log(`⚠️  Table ${table} not found or empty`);
      }
    }

    console.log(`✅ Found ${existingTables.length}/${tables.length} tables`);
    return existingTables;
  }

  async getTableCounts() {
    console.log('📊 Getting current data counts...');
    
    const counts = {
      universities: await prisma.university.count(),
      programs: await prisma.program.count(),
      departments: await prisma.department.count(),
      admissions: await prisma.admission.count(),
      intakes: await prisma.intake.count(),
      essayPrompts: await prisma.essayPrompt.count(),
      scholarships: await prisma.scholarship.count(),
      tuitionBreakdowns: await prisma.tuitionBreakdown.count()
    };

    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records`);
    });

    return counts;
  }

  async createSampleUniversity() {
    console.log('🏫 Creating sample university for testing...');
    
    try {
      const sampleUni = await prisma.university.create({
        data: {
          universityName: 'Test Business School',
          slug: 'test-business-school',
          city: 'Test City',
          state: 'CA',
          country: 'United States',
          shortDescription: 'A test business school for pipeline validation',
          overview: 'This is a test university created to validate the scraping pipeline.',
          websiteUrl: 'https://test.edu',
          isActive: true,
          tuitionFees: 50000,
          currency: 'USD'
        }
      });

      console.log(`✅ Created sample university: ${sampleUni.universityName}`);
      
      // Clean up
      await prisma.university.delete({
        where: { id: sampleUni.id }
      });
      
      console.log('🧹 Cleaned up sample university');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to create sample university:', error.message);
      return false;
    }
  }

  async runSetup() {
    console.log('🚀 Running database setup checks...\n');
    
    try {
      // Check connection
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        console.log('Please check your database connection settings.');
        return false;
      }

      // Check tables
      const existingTables = await this.checkTables();
      
      // Get current counts
      const counts = await this.getTableCounts();
      
      // Test create/delete operations
      const canWrite = await this.createSampleUniversity();
      if (!canWrite) {
        console.log('⚠️  Database write operations may fail during scraping.');
      }

      console.log('\n=== SETUP SUMMARY ===');
      console.log(`Database Connection: ${isConnected ? '✅' : '❌'}`);
      console.log(`Tables Found: ${existingTables.length}/8`);
      console.log(`Write Access: ${canWrite ? '✅' : '❌'}`);
      console.log(`Total Records: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);

      if (isConnected && canWrite) {
        console.log('\n🎉 Database is ready for scraping!');
        console.log('\nRun the scraper with:');
        console.log('  npm run scrape        # Start scraping');
        console.log('  npm run scrape:clean  # Clean existing data first');
        console.log('  npm run validate      # Validate scraped data');
        return true;
      } else {
        console.log('\n❌ Database setup issues found. Please resolve them before running the scraper.');
        return false;
      }

    } catch (error) {
      console.error('Setup failed:', error);
      return false;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Import Prisma for raw queries
import { Prisma } from '@prisma/client';

// Run if called directly
if (process.argv[1].includes('setup-database.js')) {
  const setup = new DatabaseSetup();
  setup.runSetup();
}

export default DatabaseSetup;