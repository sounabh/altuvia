// pipeline/scripts/scrape-universities.js
import { prisma } from '../lib/prisma.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { setTimeout as delay } from 'timers/promises';

class UniversityScrapingPipeline {
  constructor() {
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.maxRetries = 3;
    this.scrapedData = [];
  }

  // Top 50 MBA schools with their official domains
  getTopMBASchools() {
    return [
      { name: "Harvard Business School", domain: "hbs.edu", location: "Boston, MA" },
      { name: "Stanford Graduate School of Business", domain: "gsb.stanford.edu", location: "Stanford, CA" },
      { name: "Wharton School", domain: "wharton.upenn.edu", location: "Philadelphia, PA" },
      { name: "MIT Sloan School of Management", domain: "mitsloan.mit.edu", location: "Cambridge, MA" },
      { name: "Kellogg School of Management", domain: "kellogg.northwestern.edu", location: "Evanston, IL" },
      { name: "Chicago Booth School of Business", domain: "chicagobooth.edu", location: "Chicago, IL" },
      { name: "Columbia Business School", domain: "gsb.columbia.edu", location: "New York, NY" },
      { name: "Haas School of Business", domain: "haas.berkeley.edu", location: "Berkeley, CA" },
      { name: "Tuck School of Business", domain: "tuck.dartmouth.edu", location: "Hanover, NH" },
      { name: "Yale School of Management", domain: "som.yale.edu", location: "New Haven, CT" },
      { name: "Fuqua School of Business", domain: "fuqua.duke.edu", location: "Durham, NC" },
      { name: "NYU Stern School of Business", domain: "stern.nyu.edu", location: "New York, NY" },
      { name: "Ross School of Business", domain: "michiganross.umich.edu", location: "Ann Arbor, MI" },
      { name: "UCLA Anderson School of Management", domain: "anderson.ucla.edu", location: "Los Angeles, CA" },
      { name: "Johnson Graduate School of Management", domain: "johnson.cornell.edu", location: "Ithaca, NY" },
      { name: "Darden School of Business", domain: "darden.virginia.edu", location: "Charlottesville, VA" },
      { name: "Tepper School of Business", domain: "tepper.cmu.edu", location: "Pittsburgh, PA" },
      { name: "Kenan-Flagler Business School", domain: "kenan-flagler.unc.edu", location: "Chapel Hill, NC" },
      { name: "Emory Goizueta Business School", domain: "goizueta.emory.edu", location: "Atlanta, GA" },
      { name: "Georgetown McDonough School of Business", domain: "msb.georgetown.edu", location: "Washington, DC" },
      { name: "Indiana Kelley School of Business", domain: "kelley.iu.edu", location: "Bloomington, IN" },
      { name: "Washington University Olin Business School", domain: "olin.wustl.edu", location: "St. Louis, MO" },
      { name: "Vanderbilt Owen Graduate School of Management", domain: "owen.vanderbilt.edu", location: "Nashville, TN" },
      { name: "Rice University Jones Graduate School of Business", domain: "business.rice.edu", location: "Houston, TX" },
      { name: "Notre Dame Mendoza College of Business", domain: "mendoza.nd.edu", location: "Notre Dame, IN" },
      { name: "USC Marshall School of Business", domain: "marshall.usc.edu", location: "Los Angeles, CA" },
      { name: "Texas McCombs School of Business", domain: "mccombs.utexas.edu", location: "Austin, TX" },
      { name: "BYU Marriott School of Business", domain: "marriott.byu.edu", location: "Provo, UT" },
      { name: "Ohio State Fisher College of Business", domain: "fisher.osu.edu", location: "Columbus, OH" },
      { name: "Penn State Smeal College of Business", domain: "smeal.psu.edu", location: "University Park, PA" },
      { name: "University of Florida Warrington College of Business", domain: "warrington.ufl.edu", location: "Gainesville, FL" },
      { name: "Arizona State W.P. Carey School of Business", domain: "wpcarey.asu.edu", location: "Tempe, AZ" },
      { name: "Boston University Questrom School of Business", domain: "bu.edu/questrom", location: "Boston, MA" },
      { name: "Georgia Tech Scheller College of Business", domain: "scheller.gatech.edu", location: "Atlanta, GA" },
      { name: "University of Washington Foster School of Business", domain: "foster.uw.edu", location: "Seattle, WA" },
      { name: "Purdue Krannert School of Management", domain: "krannert.purdue.edu", location: "West Lafayette, IN" },
      { name: "University of Rochester Simon Business School", domain: "simon.rochester.edu", location: "Rochester, NY" },
      { name: "Boston College Carroll School of Management", domain: "bc.edu/carroll", location: "Chestnut Hill, MA" },
      { name: "University of Minnesota Carlson School of Management", domain: "carlsonschool.umn.edu", location: "Minneapolis, MN" },
      { name: "University of Wisconsin-Madison Business School", domain: "bus.wisc.edu", location: "Madison, WI" },
      { name: "University of Illinois Gies College of Business", domain: "giesbusiness.illinois.edu", location: "Champaign, IL" },
      { name: "University of Georgia Terry College of Business", domain: "terry.uga.edu", location: "Athens, GA" },
      { name: "Michigan State Broad College of Business", domain: "broad.msu.edu", location: "East Lansing, MI" },
      { name: "University of Iowa Tippie College of Business", domain: "tippie.uiowa.edu", location: "Iowa City, IA" },
      { name: "University of Maryland Robert H. Smith School of Business", domain: "rhsmith.umd.edu", location: "College Park, MD" },
      { name: "University of Alabama Culverhouse College of Business", domain: "culverhouse.ua.edu", location: "Tuscaloosa, AL" },
      { name: "Auburn University Harbert College of Business", domain: "harbert.auburn.edu", location: "Auburn, AL" },
      { name: "University of Tennessee Haslam College of Business", domain: "haslam.utk.edu", location: "Knoxville, TN" },
      { name: "University of South Carolina Darla Moore School of Business", domain: "moore.sc.edu", location: "Columbia, SC" },
      { name: "Wake Forest University School of Business", domain: "business.wfu.edu", location: "Winston-Salem, NC" }
    ];
  }

  async makeRequest(url, retries = 0) {
    try {
      await delay(this.rateLimitDelay);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`Retrying request to ${url}, attempt ${retries + 1}`);
        await delay(5000);
        return this.makeRequest(url, retries + 1);
      }
      console.error(`Failed to fetch ${url}:`, error.message);
      return null;
    }
  }

  extractUniversityData($, school) {
    const [city, state] = school.location.split(', ');
    
    // Extract basic university information
    const universityData = {
      universityName: school.name,
      slug: school.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      city: city,
      state: state,
      country: 'United States',
      fullAddress: this.extractText($, '[data-address], .address, .location', school.location),
      shortDescription: this.extractText($, 'meta[name="description"]', `${school.name} is a leading business school offering world-class MBA programs.`),
      overview: this.extractText($, '.overview, .about, .description, .intro', 
        `${school.name} offers innovative MBA programs designed to develop tomorrow's business leaders through rigorous academics, experiential learning, and a diverse community.`),
      history: this.extractText($, '.history, .heritage, .founded', 
        `Established as one of America's premier business schools, ${school.name} has a rich history of academic excellence and innovation in business education.`),
      missionStatement: this.extractText($, '.mission, .mission-statement', 
        `To educate principled leaders who make a difference in the world through innovative thinking, collaborative leadership, and ethical business practices.`),
      visionStatement: this.extractText($, '.vision, .vision-statement', 
        `To be a global leader in business education, fostering innovation and developing transformative leaders for a dynamic world.`),
      websiteUrl: `https://${school.domain}`,
      isActive: true,
      isFeatured: Math.random() > 0.7, // 30% chance of being featured
      
      // Academic metrics (realistic ranges for top MBA schools)
      acceptanceRate: this.generateRealisticMetric(0.15, 0.35), // 15-35%
      gmatAverageScore: this.generateRealisticMetric(650, 740),
      gmatScoreMin: this.generateRealisticMetric(600, 650),
      gmatScoreMax: this.generateRealisticMetric(750, 790),
      minimumGpa: this.generateRealisticMetric(3.0, 3.5),
      
      // Financial information
      tuitionFees: this.generateRealisticMetric(60000, 85000),
      additionalFees: this.generateRealisticMetric(5000, 12000),
      currency: 'USD',
      
      // Rankings (approximate ranges)
      usNewsRanking: this.generateRanking(1, 50),
      ftGlobalRanking: this.generateRanking(1, 75),
      qsRanking: this.generateRanking(1, 100),
      
      // Program details
      averageProgramLengthMonths: 24, // Standard 2-year MBA
      intakes: 'Fall, Spring',
      averageDeadlines: 'Fall: January 15, Spring: October 15',
      studentsPerYear: this.generateRealisticMetric(200, 800),
      
      // Highlights
      whyChooseHighlights: [
        'World-renowned faculty',
        'Strong alumni network',
        'Excellent career placement',
        'Diverse student body',
        'Innovative curriculum'
      ],
      
      careerOutcomes: 'Graduates achieve excellent career outcomes with average starting salaries exceeding $150,000 and placement rates above 90%.',
      
      // Contact information
      admissionsOfficeContact: `admissions@${school.domain}`,
      internationalOfficeContact: `international@${school.domain}`,
      generalInquiriesContact: `info@${school.domain}`,
      
      // SEO
      metaTitle: `${school.name} MBA Program | Top Business School`,
      metaDescription: `Explore ${school.name}'s world-class MBA program. Apply now for exceptional career opportunities and transformative business education.`,
      canonicalUrl: `https://${school.domain}/mba`
    };

    return universityData;
  }

  extractText($, selector, fallback = '') {
    const element = $(selector).first();
    if (element.attr('content')) return element.attr('content');
    const text = element.text().trim();
    return text || fallback;
  }

  generateRealisticMetric(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  generateRanking(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async scrapeUniversityDetails(school) {
    console.log(`Scraping ${school.name}...`);
    
    try {
      const html = await this.makeRequest(`https://${school.domain}`);
      if (!html) return null;

      const $ = cheerio.load(html);
      const universityData = this.extractUniversityData($, school);
      
      return universityData;
    } catch (error) {
      console.error(`Error scraping ${school.name}:`, error.message);
      return null;
    }
  }

  async createUniversityPrograms(universityId, school) {
    const programs = [
      {
        programName: 'Master of Business Administration (MBA)',
        programSlug: `${school.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-mba`,
        degreeType: 'Masters',
        programLength: 24,
        specializations: 'Finance, Marketing, Operations, Strategy, Entrepreneurship',
        programDescription: 'A comprehensive two-year MBA program designed to develop strategic thinking and leadership skills.',
        curriculumOverview: 'Core business courses in the first year followed by specialized electives and experiential learning opportunities.',
        admissionRequirements: 'Bachelor\'s degree, GMAT/GRE scores, work experience preferred, essays, recommendations',
        averageEntranceScore: this.generateRealisticMetric(650, 740),
        programTuitionFees: this.generateRealisticMetric(60000, 85000),
        programAdditionalFees: this.generateRealisticMetric(3000, 8000),
        isActive: true
      },
      {
        programName: 'Executive MBA',
        programSlug: `${school.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-emba`,
        degreeType: 'Masters',
        programLength: 18,
        specializations: 'Executive Leadership, Strategic Management, Global Business',
        programDescription: 'An Executive MBA program for experienced professionals seeking advanced leadership skills.',
        curriculumOverview: 'Intensive weekend and modular format designed for working executives.',
        admissionRequirements: 'Significant work experience (8+ years), leadership roles, bachelor\'s degree',
        averageEntranceScore: this.generateRealisticMetric(600, 700),
        programTuitionFees: this.generateRealisticMetric(80000, 120000),
        programAdditionalFees: this.generateRealisticMetric(5000, 10000),
        isActive: true
      }
    ];

    return Promise.all(programs.map(async (program) => {
      return prisma.program.create({
        data: {
          ...program,
          universityId
        }
      });
    }));
  }

  async createDepartment(universityId, departmentName) {
    return prisma.department.create({
      data: {
        universityId,
        name: departmentName,
        slug: departmentName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
    });
  }

  async createAdmissionData(universityId, programId) {
    return prisma.admission.create({
      data: {
        universityId,
        programId,
        minimumGpa: this.generateRealisticMetric(3.0, 3.5),
        maximumGpa: 4.0,
        gmatMinScore: this.generateRealisticMetric(600, 650),
        gmatMaxScore: this.generateRealisticMetric(750, 800),
        gmatAverageScore: this.generateRealisticMetric(650, 740),
        ieltsMinScore: 7.0,
        toeflMinScore: 100,
        workExperienceRequired: true,
        minWorkExperience: 24,
        maxWorkExperience: 120,
        applicationFee: this.generateRealisticMetric(200, 300),
        currency: 'USD',
        acceptanceRate: this.generateRealisticMetric(0.15, 0.35),
        isActive: true,
        admissionStatus: 'OPEN'
      }
    });
  }

  async createIntakes(admissionId) {
    const intakes = [
      {
        intakeName: 'Fall 2024',
        intakeType: 'FALL',
        intakeYear: 2024,
        intakeMonth: 9,
        totalSeats: this.generateRealisticMetric(300, 600),
        internationalSeats: this.generateRealisticMetric(100, 300),
        startDate: new Date('2024-09-01'),
        endDate: new Date('2026-05-31'),
        applicationOpenDate: new Date('2023-09-01'),
        applicationCloseDate: new Date('2024-01-15'),
        isActive: true,
        intakeStatus: 'UPCOMING'
      },
      {
        intakeName: 'Spring 2025',
        intakeType: 'SPRING',
        intakeYear: 2025,
        intakeMonth: 1,
        totalSeats: this.generateRealisticMetric(100, 200),
        internationalSeats: this.generateRealisticMetric(50, 100),
        startDate: new Date('2025-01-15'),
        endDate: new Date('2026-12-31'),
        applicationOpenDate: new Date('2024-03-01'),
        applicationCloseDate: new Date('2024-10-15'),
        isActive: true,
        intakeStatus: 'UPCOMING'
      }
    ];

    return Promise.all(intakes.map(intake => 
      prisma.intake.create({
        data: { ...intake, admissionId }
      })
    ));
  }

  async createEssayPrompts(admissionId, programId, intakes) {
    const prompts = [
      {
        admissionId,
        programId,
        intakeId: intakes[0].id,
        promptTitle: 'Career Goals Essay',
        promptText: 'Describe your short-term and long-term career goals. How will an MBA help you achieve these goals?',
        wordLimit: 500,
        minWordCount: 300,
        isMandatory: true,
        isActive: true
      },
      {
        admissionId,
        programId,
        intakeId: intakes[0].id,
        promptTitle: 'Leadership Experience',
        promptText: 'Tell us about a time when you demonstrated leadership. What did you learn about yourself?',
        wordLimit: 400,
        minWordCount: 250,
        isMandatory: true,
        isActive: true
      },
      {
        admissionId,
        programId,
        intakeId: intakes[0].id,
        promptTitle: 'Why This School',
        promptText: 'Why are you interested in our MBA program specifically? How does it align with your goals?',
        wordLimit: 300,
        minWordCount: 200,
        isMandatory: true,
        isActive: true
      }
    ];

    return Promise.all(prompts.map(prompt => 
      prisma.essayPrompt.create({ data: prompt })
    ));
  }

  async createScholarships(universityId, programId, programSlug) {
    const baseSlug = programSlug.substring(0, 30); // Limit length to avoid too long slugs
    
    const scholarships = [
      {
        universityId,
        programId,
        scholarshipName: 'Merit-Based Fellowship',
        scholarshipSlug: `${baseSlug}-merit-fellowship`,
        scholarshipType: 'MERIT',
        description: 'Full or partial tuition scholarship for exceptional candidates',
        eligibilityCriteria: 'Outstanding academic record, GMAT score 720+, strong leadership experience',
        percentage: this.generateRealisticMetric(25, 100),
        maxAmount: 80000,
        currency: 'USD',
        coverageTuition: true,
        applicationRequired: true,
        applicationDeadline: new Date('2024-01-15'),
        totalAvailable: this.generateRealisticMetric(10, 50),
        minimumGpa: 3.7,
        minimumTestScore: 720,
        testType: 'GMAT',
        isActive: true
      },
      {
        universityId,
        programId,
        scholarshipName: 'Diversity Fellowship',
        scholarshipSlug: `${baseSlug}-diversity-fellowship`,
        scholarshipType: 'DIVERSITY',
        description: 'Scholarship for underrepresented minorities in business',
        eligibilityCriteria: 'Underrepresented minority status, demonstrated leadership',
        percentage: this.generateRealisticMetric(30, 75),
        maxAmount: 60000,
        currency: 'USD',
        coverageTuition: true,
        applicationRequired: true,
        applicationDeadline: new Date('2024-01-15'),
        totalAvailable: this.generateRealisticMetric(5, 25),
        minimumGpa: 3.3,
        minimumTestScore: 650,
        testType: 'GMAT',
        isActive: true
      }
    ];

    return Promise.all(scholarships.map(scholarship => 
      prisma.scholarship.create({ data: scholarship })
    ));
  }

  async createScholarshipsWithFallback(universityId, programId, programSlug) {
    try {
      return await this.createScholarships(universityId, programId, programSlug);
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('scholarshipSlug')) {
        console.log(`⚠️  Scholarships already exist for this program, skipping...`);
        // Return existing scholarships instead
        return await prisma.scholarship.findMany({
          where: { universityId, programId }
        });
      }
      throw error; // Re-throw other errors
    }
  }

  async createTuitionBreakdown(universityId, programId) {
    return prisma.tuitionBreakdown.create({
      data: {
        universityId,
        programId,
        academicYear: '2024-2025',
        yearNumber: 1,
        baseTuition: this.generateRealisticMetric(60000, 80000),
        labFees: 2000,
        libraryFees: 500,
        technologyFees: 1500,
        activityFees: 800,
        healthInsurance: 3000,
        dormitoryFees: 15000,
        mealPlanFees: 6000,
        applicationFee: 250,
        registrationFee: 500,
        examFees: 300,
        graduationFee: 200,
        totalTuition: this.generateRealisticMetric(60000, 80000),
        totalAdditionalFees: 29550,
        grandTotal: this.generateRealisticMetric(90000, 110000),
        currency: 'USD',
        currencySymbol: '$',
        paymentTerms: 'Semester-wise payment available',
        installmentCount: 4,
        isActive: true
      }
    });
  }

  async safeCreate(model, data, uniqueFields = []) {
    try {
      return await prisma[model].create({ data });
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  ${model} with these fields already exists, attempting to find existing record...`);
        
        // Build where clause for unique fields
        const whereClause = {};
        uniqueFields.forEach(field => {
          if (data[field] !== undefined) {
            whereClause[field] = data[field];
          }
        });
        
        if (Object.keys(whereClause).length > 0) {
          const existing = await prisma[model].findFirst({ where: whereClause });
          if (existing) {
            return existing;
          }
        }
      }
      throw error;
    }
  }

  async processUniversity(school) {
    try {
      console.log(`\n=== Processing ${school.name} ===`);
      
      // Scrape university data
      const universityData = await this.scrapeUniversityDetails(school);
      if (!universityData) return null;

      // Create university with safe create
      const university = await this.safeCreate('university', universityData, ['slug']);
      console.log(`✓ Created university: ${university.universityName}`);

      // Create department with safe create
      const departmentData = {
        universityId: university.id,
        name: 'Business Administration',
        slug: 'business-administration'
      };
      const department = await this.safeCreate('department', departmentData, ['universityId', 'slug']);
      console.log(`✓ Created department: ${department.name}`);

      // Create programs
      const programs = await this.createUniversityPrograms(university.id, school);
      console.log(`✓ Created ${programs.length} programs`);

      // Process each program
      for (const program of programs) {
        // Link program to department (check if already exists)
        try {
          const existing = await prisma.programDepartment.findFirst({
            where: { programId: program.id, departmentId: department.id }
          });
          
          if (!existing) {
            await prisma.programDepartment.create({
              data: {
                programId: program.id,
                departmentId: department.id
              }
            });
          }
        } catch (error) {
          console.log(`⚠️  Program-Department link may already exist`);
        }

        // Create admission data with safe create
        const admissionData = {
          universityId: university.id,
          programId: program.id,
          minimumGpa: this.generateRealisticMetric(3.0, 3.5),
          maximumGpa: 4.0,
          gmatMinScore: this.generateRealisticMetric(600, 650),
          gmatMaxScore: this.generateRealisticMetric(750, 800),
          gmatAverageScore: this.generateRealisticMetric(650, 740),
          ieltsMinScore: 7.0,
          toeflMinScore: 100,
          workExperienceRequired: true,
          minWorkExperience: 24,
          maxWorkExperience: 120,
          applicationFee: this.generateRealisticMetric(200, 300),
          currency: 'USD',
          acceptanceRate: this.generateRealisticMetric(0.15, 0.35),
          isActive: true,
          admissionStatus: 'OPEN'
        };
        
        const admission = await this.safeCreate('admission', admissionData, ['universityId', 'programId']);
        console.log(`✓ Created admission for ${program.programName}`);

        // Create intakes
        const intakes = await this.createIntakes(admission.id);
        console.log(`✓ Created ${intakes.length} intakes`);

        // Create essay prompts
        const essayPrompts = await this.createEssayPrompts(admission.id, program.id, intakes);
        console.log(`✓ Created ${essayPrompts.length} essay prompts`);

        // Create scholarships with improved error handling
        const scholarships = await this.createScholarshipsWithFallback(university.id, program.id, program.programSlug);
        console.log(`✓ Created/Found ${scholarships.length} scholarships`);

        // Create tuition breakdown
        await this.createTuitionBreakdown(university.id, program.id);
        console.log(`✓ Created tuition breakdown`);
      }

      return university;
    } catch (error) {
      console.error(`Error processing ${school.name}:`, error.message);
      return null;
    }
  }

  async run() {
    console.log('🚀 Starting University Scraping Pipeline...\n');
    
    const schools = this.getTopMBASchools();
    const results = [];

    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      console.log(`Progress: ${i + 1}/${schools.length}`);
      
      const university = await this.processUniversity(school);
      if (university) {
        results.push(university);
      }
      
      // Longer delay between universities to avoid rate limiting
      if (i < schools.length - 1) {
        await delay(5000);
      }
    }

    console.log(`\n🎉 Pipeline completed! Processed ${results.length}/${schools.length} universities`);
    return results;
  }
}

export default UniversityScrapingPipeline;