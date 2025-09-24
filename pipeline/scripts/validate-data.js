// scripts/validate-data.js
import { prisma } from "../../src/lib/prisma.js";

class DataValidator {
  async validateUniversities() {
    console.log('Validating universities...');
    
    const universities = await prisma.university.findMany({
      include: {
        programs: true,
        departments: true,
        admissions: true,
        scholarships: true,
        tuitionBreakdowns: true
      }
    });

    const issues = [];

    for (const university of universities) {
      // Check required fields
      if (!university.universityName) {
        issues.push(`University ${university.id} missing name`);
      }
      
      if (!university.city || !university.state) {
        issues.push(`University ${university.universityName} missing location info`);
      }

      if (university.programs.length === 0) {
        issues.push(`University ${university.universityName} has no programs`);
      }

      if (university.departments.length === 0) {
        issues.push(`University ${university.universityName} has no departments`);
      }

      // Validate tuition fees
      if (university.tuitionFees && (university.tuitionFees < 10000 || university.tuitionFees > 200000)) {
        issues.push(`University ${university.universityName} has unrealistic tuition: $${university.tuitionFees}`);
      }

      // Validate rankings
      if (university.usNewsRanking && (university.usNewsRanking < 1 || university.usNewsRanking > 500)) {
        issues.push(`University ${university.universityName} has invalid US News ranking: ${university.usNewsRanking}`);
      }
    }

    return { count: universities.length, issues };
  }

  async validatePrograms() {
    console.log('Validating programs...');
    
    const programs = await prisma.program.findMany({
      include: {
        admissions: true,
        essayPrompts: true,
        scholarships: true,
        university: true
      }
    });

    const issues = [];

    for (const program of programs) {
      if (!program.programName) {
        issues.push(`Program ${program.id} missing name`);
      }

      if (!program.programSlug) {
        issues.push(`Program ${program.programName} missing slug`);
      }

      if (program.admissions.length === 0) {
        issues.push(`Program ${program.programName} has no admission requirements`);
      }

      if (program.essayPrompts.length === 0) {
        issues.push(`Program ${program.programName} has no essay prompts`);
      }

      // Validate program length
      if (program.programLength && (program.programLength < 12 || program.programLength > 48)) {
        issues.push(`Program ${program.programName} has unrealistic length: ${program.programLength} months`);
      }
    }

    return { count: programs.length, issues };
  }

  async validateAdmissions() {
    console.log('Validating admissions...');
    
    const admissions = await prisma.admission.findMany({
      include: {
        intakes: true,
        university: true,
        program: true
      }
    });

    const issues = [];

    for (const admission of admissions) {
      // Check GMAT scores
      if (admission.gmatMinScore && admission.gmatMaxScore) {
        if (admission.gmatMinScore > admission.gmatMaxScore) {
          issues.push(`Admission for ${admission.program.programName} has invalid GMAT range`);
        }
        if (admission.gmatMinScore < 200 || admission.gmatMaxScore > 800) {
          issues.push(`Admission for ${admission.program.programName} has unrealistic GMAT scores`);
        }
      }

      // Check GPA
      if (admission.minimumGpa && (admission.minimumGpa < 2.0 || admission.minimumGpa > 4.0)) {
        issues.push(`Admission for ${admission.program.programName} has invalid minimum GPA: ${admission.minimumGpa}`);
      }

      // Check acceptance rate
      if (admission.acceptanceRate && (admission.acceptanceRate < 0 || admission.acceptanceRate > 1)) {
        issues.push(`Admission for ${admission.program.programName} has invalid acceptance rate: ${admission.acceptanceRate}`);
      }

      if (admission.intakes.length === 0) {
        issues.push(`Admission for ${admission.program.programName} has no intakes`);
      }
    }

    return { count: admissions.length, issues };
  }

  async validateEssayPrompts() {
    console.log('Validating essay prompts...');
    
    const essayPrompts = await prisma.essayPrompt.findMany({
      include: {
        program: true
      }
    });

    const issues = [];

    for (const prompt of essayPrompts) {
      if (!prompt.promptTitle) {
        issues.push(`Essay prompt ${prompt.id} missing title`);
      }

      if (!prompt.promptText) {
        issues.push(`Essay prompt ${prompt.promptTitle} missing text`);
      }

      if (prompt.wordLimit < 50 || prompt.wordLimit > 2000) {
        issues.push(`Essay prompt ${prompt.promptTitle} has unrealistic word limit: ${prompt.wordLimit}`);
      }

      if (prompt.minWordCount > prompt.wordLimit) {
        issues.push(`Essay prompt ${prompt.promptTitle} has min word count greater than limit`);
      }
    }

    return { count: essayPrompts.length, issues };
  }

  async validateScholarships() {
    console.log('Validating scholarships...');
    
    const scholarships = await prisma.scholarship.findMany({
      include: {
        university: true,
        program: true
      }
    });

    const issues = [];

    for (const scholarship of scholarships) {
      if (!scholarship.scholarshipName) {
        issues.push(`Scholarship ${scholarship.id} missing name`);
      }

      if (scholarship.percentage && (scholarship.percentage < 0 || scholarship.percentage > 100)) {
        issues.push(`Scholarship ${scholarship.scholarshipName} has invalid percentage: ${scholarship.percentage}`);
      }

      if (scholarship.amount && scholarship.amount < 0) {
        issues.push(`Scholarship ${scholarship.scholarshipName} has negative amount: ${scholarship.amount}`);
      }
    }

    return { count: scholarships.length, issues };
  }

  async runFullValidation() {
    console.log('Starting full data validation...\n');
    
    const results = {};
    
    try {
      results.universities = await this.validateUniversities();
      results.programs = await this.validatePrograms();
      results.admissions = await this.validateAdmissions();
      results.essayPrompts = await this.validateEssayPrompts();
      results.scholarships = await this.validateScholarships();

      // Summary
      console.log('\n=== VALIDATION RESULTS ===');
      console.log(`Universities: ${results.universities.count} (${results.universities.issues.length} issues)`);
      console.log(`Programs: ${results.programs.count} (${results.programs.issues.length} issues)`);
      console.log(`Admissions: ${results.admissions.count} (${results.admissions.issues.length} issues)`);
      console.log(`Essay Prompts: ${results.essayPrompts.count} (${results.essayPrompts.issues.length} issues)`);
      console.log(`Scholarships: ${results.scholarships.count} (${results.scholarships.issues.length} issues)`);

      // Show issues
      const allIssues = [
        ...results.universities.issues,
        ...results.programs.issues,
        ...results.admissions.issues,
        ...results.essayPrompts.issues,
        ...results.scholarships.issues
      ];

      if (allIssues.length > 0) {
        console.log('\n=== ISSUES FOUND ===');
        allIssues.forEach(issue => console.log(`- ${issue}`));
      } else {
        console.log('\nAll data validation passed!');
      }

      return results;

    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run if called directly
if (process.argv[1].includes('validate-data.js')) {
  const validator = new DataValidator();
  validator.runFullValidation();
}

export default DataValidator;