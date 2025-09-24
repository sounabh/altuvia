// pipeline/scripts/run-scraper.js
import UniversityScrapingPipeline from './scrape-universities.js';
import RankingService from './services/ranking-service.js';
import { prisma } from '../lib/prisma.js';

class PipelineRunner {
  async cleanDatabase() {
    console.log('🧹 Cleaning existing data...');
    
    try {
      // Delete in proper order to respect foreign key constraints
      await prisma.essayPrompt.deleteMany();
      await prisma.scholarshipApplication.deleteMany();
      await prisma.scholarship.deleteMany();
      await prisma.tuitionBreakdown.deleteMany();
      await prisma.intake.deleteMany();
      await prisma.admission.deleteMany();
      await prisma.programDepartment.deleteMany();
      await prisma.program.deleteMany();
      await prisma.department.deleteMany();
      await prisma.universityImage.deleteMany();
      await prisma.university.deleteMany();
      
      console.log('✓ Database cleaned');
      return true;
    } catch (error) {
      console.error('Error cleaning database:', error.message);
      return false;
    }
  }

  async validateData() {
    console.log('\n📊 Validating scraped data...');
    
    const universities = await prisma.university.count();
    const programs = await prisma.program.count();
    const admissions = await prisma.admission.count();
    const intakes = await prisma.intake.count();
    const essays = await prisma.essayPrompt.count();
    const scholarships = await prisma.scholarship.count();
    
    console.log(`Universities: ${universities}`);
    console.log(`Programs: ${programs}`);
    console.log(`Admissions: ${admissions}`);
    console.log(`Intakes: ${intakes}`);
    console.log(`Essay Prompts: ${essays}`);
    console.log(`Scholarships: ${scholarships}`);
    
    return {
      universities,
      programs,
      admissions,
      intakes,
      essays,
      scholarships
    };
  }

  async enrichWithRankings() {
    console.log('\n🏆 Enriching with ranking data...');
    
    const rankingService = new RankingService();
    await rankingService.updateUniversityRankings();
    
    console.log('✓ Rankings updated');
  }

  async run() {
    try {
      const startTime = Date.now();
      
      // Clean existing data (optional)
      const shouldClean = process.argv.includes('--clean');
      if (shouldClean) {
        await this.cleanDatabase();
      }
      
      // Run the main scraping pipeline
      const pipeline = new UniversityScrapingPipeline();
      await pipeline.run();
      
      // Enrich with additional data
      await this.enrichWithRankings();
      
      // Validate results
      const stats = await this.validateData();
      
      const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
      
      console.log(`\n🎉 Pipeline completed in ${duration} minutes`);
      console.log('Data successfully populated in database!');
      
      return stats;
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run if called directly
if (process.argv[1].includes('run-scraper.js')) {
  const runner = new PipelineRunner();
  runner.run();
}

export default PipelineRunner;