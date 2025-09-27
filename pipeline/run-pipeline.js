import { prisma } from "@/lib/prisma";
import { chromium } from 'playwright';

// University configurations with specific selectors and data patterns
const UNIVERSITY_CONFIGS = {
  "harvard-business-school": {
    name: "Harvard Business School",
    baseUrl: "https://www.hbs.edu",
    pages: {
      admissions: "/mba/admissions",
      application: "/mba/admissions/application-process",
      tuition: "/mba/admissions/cost-financial-aid",
      essays: "/mba/admissions/application-process/essay-questions",
      scholarships: "/mba/admissions/cost-financial-aid/fellowships-scholarships"
    },
    selectors: {
      tuition: ['.tuition-cost', '.cost-breakdown', '[class*="tuition"]'],
      gmat: ['.test-scores', '.gmat-score', '[class*="gmat"]'],
      essays: ['.essay-question', '.application-essay', '[class*="essay"]'],
      deadlines: ['.deadline', '.application-deadline', '[class*="deadline"]'],
      acceptance: ['.admission-stats', '.acceptance-rate', '[class*="acceptance"]']
    }
  },
  "stanford-gsb": {
    name: "Stanford Graduate School of Business",
    baseUrl: "https://www.gsb.stanford.edu",
    pages: {
      admissions: "/programs/mba/admission",
      application: "/programs/mba/admission/application-requirements",
      tuition: "/programs/mba/financial-aid/tuition-fees",
      essays: "/programs/mba/admission/essays",
      scholarships: "/programs/mba/financial-aid/fellowships"
    },
    selectors: {
      tuition: ['.tuition-amount', '.fee-structure', '[class*="cost"]'],
      gmat: ['.test-requirements', '.gmat-requirements', '[class*="score"]'],
      essays: ['.essay-prompt', '.essay-requirements', '[class*="essay"]'],
      deadlines: ['.deadline-table', '.important-dates', '[class*="deadline"]'],
      acceptance: ['.admission-statistics', '[class*="rate"]']
    }
  },
  "wharton": {
    name: "The Wharton School",
    baseUrl: "https://mba.wharton.upenn.edu",
    pages: {
      admissions: "/admissions",
      application: "/admissions/application-process",
      tuition: "/admissions/financing-your-mba/tuition-fees",
      essays: "/admissions/application-requirements/essays",
      scholarships: "/admissions/financing-your-mba/fellowships"
    },
    selectors: {
      tuition: ['.tuition-costs', '.mba-costs', '[class*="tuition"]'],
      gmat: ['.admissions-requirements', '[class*="gmat"]', '[class*="test"]'],
      essays: ['.essay-questions', '[class*="essay"]'],
      deadlines: ['.application-deadlines', '[class*="deadline"]'],
      acceptance: ['.class-profile', '[class*="acceptance"]']
    }
  }
  // Add more university configurations
};

class EnhancedMBADataScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.successfulScrapes = new Map();
    this.failedScrapes = new Map();
  }

  async initialize() {
    console.log("Initializing enhanced scraper...");
    this.browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
  }

  async scrapeUniversityWithRealData(universityConfig) {
    const page = await this.context.newPage();
    const universityData = { name: universityConfig.name, data: {} };
    
    try {
      console.log(`\nScraping ${universityConfig.name} with real data extraction...`);
      
      // Step 1: Extract basic university information
      const basicInfo = await this.extractBasicUniversityInfo(page, universityConfig);
      universityData.data = { ...universityData.data, ...basicInfo };
      
      // Step 2: Extract admission requirements
      const admissionData = await this.extractAdmissionRequirements(page, universityConfig);
      universityData.data = { ...universityData.data, ...admissionData };
      
      // Step 3: Extract tuition and fees
      const financialData = await this.extractTuitionAndFees(page, universityConfig);
      universityData.data = { ...universityData.data, ...financialData };
      
      // Step 4: Extract essay prompts
      const essayData = await this.extractEssayPrompts(page, universityConfig);
      universityData.data = { ...universityData.data, ...essayData };
      
      // Step 5: Extract deadlines
      const deadlineData = await this.extractDeadlines(page, universityConfig);
      universityData.data = { ...universityData.data, ...deadlineData };
      
      // Step 6: Extract scholarship information
      const scholarshipData = await this.extractScholarships(page, universityConfig);
      universityData.data = { ...universityData.data, ...scholarshipData };
      
      this.successfulScrapes.set(universityConfig.name, universityData);
      return universityData;
      
    } catch (error) {
      console.error(`Failed to scrape ${universityConfig.name}:`, error);
      this.failedScrapes.set(universityConfig.name, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  async extractBasicUniversityInfo(page, config) {
    console.log(`  Extracting basic info for ${config.name}...`);
    
    // Navigate to main admissions page
    await page.goto(`${config.baseUrl}${config.pages.admissions}`, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    const basicInfo = await page.evaluate(() => {
      // Extract meta information
      const getMetaContent = (name) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.content : null;
      };
      
      // Extract university location from footer, contact info, or about sections
      const extractLocation = () => {
        const locationSelectors = [
          'address',
          '.address',
          '.contact-info',
          '.location',
          '.footer-address',
          '[itemtype*="PostalAddress"]',
          '.school-info'
        ];
        
        for (const selector of locationSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            const text = el.textContent.trim();
            // Look for US address patterns
            const cityStateMatch = text.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/);
            if (cityStateMatch) {
              return {
                city: cityStateMatch[1].trim(),
                state: cityStateMatch[2],
                zipCode: cityStateMatch[3] || null,
                fullAddress: text
              };
            }
          }
        }
        return null;
      };
      
      // Extract acceptance rate from page content
      const extractAcceptanceRate = () => {
        const textContent = document.body.textContent;
        const patterns = [
          /acceptance\s+rate[:\s]*(\d+(?:\.\d+)?)%/i,
          /admit\s+rate[:\s]*(\d+(?:\.\d+)?)%/i,
          /(\d+(?:\.\d+)?)%\s*acceptance\s*rate/i,
          /admits?\s*(\d+(?:\.\d+)?)%/i
        ];
        
        for (const pattern of patterns) {
          const match = textContent.match(pattern);
          if (match) return parseFloat(match[1]);
        }
        return null;
      };
      
      // Extract class size information
      const extractClassSize = () => {
        const textContent = document.body.textContent;
        const patterns = [
          /class\s+size[:\s]*(\d+)/i,
          /(\d+)\s+students\s+per\s+class/i,
          /cohort\s+of\s+(\d+)/i
        ];
        
        for (const pattern of patterns) {
          const match = textContent.match(pattern);
          if (match) return parseInt(match[1]);
        }
        return null;
      };
      
      const location = extractLocation();
      
      return {
        metaTitle: document.title,
        metaDescription: getMetaContent('description'),
        metaKeywords: getMetaContent('keywords'),
        websiteUrl: window.location.origin,
        acceptanceRate: extractAcceptanceRate(),
        classSize: extractClassSize(),
        location: location,
        // Extract any visible program highlights or key features
        highlights: Array.from(document.querySelectorAll('.highlight, .feature, .strength, .advantage'))
          .map(el => el.textContent.trim())
          .filter(text => text.length > 10 && text.length < 200)
          .slice(0, 5)
      };
    });
    
    return {
      city: basicInfo.location?.city || null,
      state: basicInfo.location?.state || null,
      fullAddress: basicInfo.location?.fullAddress || null,
      acceptanceRate: basicInfo.acceptanceRate,
      metaTitle: basicInfo.metaTitle,
      metaDescription: basicInfo.metaDescription,
      metaKeywords: basicInfo.metaKeywords,
      websiteUrl: basicInfo.websiteUrl,
      whyChooseHighlights: basicInfo.highlights
    };
  }

  async extractAdmissionRequirements(page, config) {
    console.log(`  Extracting admission requirements...`);
    
    try {
      await page.goto(`${config.baseUrl}${config.pages.application}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const admissionData = await page.evaluate(() => {
        const textContent = document.body.textContent;
        
        // Extract GMAT scores
        const extractGMAT = () => {
          const patterns = [
            /GMAT[:\s]*(\d+)[^\d]*(?:-|to)[^\d]*(\d+)/i,
            /average\s+GMAT[:\s]*(\d+)/i,
            /GMAT[:\s]*range[:\s]*(\d+)[^\d]+(\d+)/i,
            /GMAT[:\s]*score[:\s]*(\d+)/i
          ];
          
          for (const pattern of patterns) {
            const match = textContent.match(pattern);
            if (match) {
              return match[2] ? {
                min: parseInt(match[1]),
                max: parseInt(match[2]),
                average: Math.round((parseInt(match[1]) + parseInt(match[2])) / 2)
              } : {
                average: parseInt(match[1])
              };
            }
          }
          return null;
        };
        
        // Extract GRE scores
        const extractGRE = () => {
          const patterns = [
            /GRE[:\s]*(\d+)[^\d]*(?:-|to)[^\d]*(\d+)/i,
            /average\s+GRE[:\s]*(\d+)/i,
            /GRE[:\s]*score[:\s]*(\d+)/i
          ];
          
          for (const pattern of patterns) {
            const match = textContent.match(pattern);
            if (match) {
              return match[2] ? {
                min: parseInt(match[1]),
                max: parseInt(match[2])
              } : {
                average: parseInt(match[1])
              };
            }
          }
          return null;
        };
        
        // Extract GPA requirements
        const extractGPA = () => {
          const patterns = [
            /minimum\s+GPA[:\s]*(\d+\.?\d*)/i,
            /GPA[:\s]*of[:\s]*(\d+\.?\d*)/i,
            /average\s+GPA[:\s]*(\d+\.?\d*)/i
          ];
          
          for (const pattern of patterns) {
            const match = textContent.match(pattern);
            if (match) return parseFloat(match[1]);
          }
          return null;
        };
        
        // Extract language requirements
        const extractLanguageRequirements = () => {
          const toefl = textContent.match(/TOEFL[:\s]*(?:minimum[:\s]*)?(\d+)/i);
          const ielts = textContent.match(/IELTS[:\s]*(?:minimum[:\s]*)?(\d+\.?\d*)/i);
          
          return {
            toefl: toefl ? parseInt(toefl[1]) : null,
            ielts: ielts ? parseFloat(ielts[1]) : null
          };
        };
        
        // Extract work experience requirements
        const extractWorkExperience = () => {
          const patterns = [
            /(\d+)[^\d]*years?\s*(?:of\s*)?work\s*experience/i,
            /minimum[^\d]*(\d+)[^\d]*years?\s*experience/i,
            /(\d+)\+\s*years?\s*(?:of\s*)?experience/i
          ];
          
          for (const pattern of patterns) {
            const match = textContent.match(pattern);
            if (match) return parseInt(match[1]) * 12; // Convert to months
          }
          return null;
        };
        
        // Extract application fee
        const extractApplicationFee = () => {
          const patterns = [
            /application\s+fee[:\s]*\$?(\d+(?:,\d{3})*)/i,
            /\$(\d+(?:,\d{3})*)\s*application\s*fee/i
          ];
          
          for (const pattern of patterns) {
            const match = textContent.match(pattern);
            if (match) return parseFloat(match[1].replace(/,/g, ''));
          }
          return null;
        };
        
        const gmatData = extractGMAT();
        const greData = extractGRE();
        const languageReqs = extractLanguageRequirements();
        
        return {
          gmatData,
          greData,
          minimumGpa: extractGPA(),
          toeflMinScore: languageReqs.toefl,
          ieltsMinScore: languageReqs.ielts,
          minWorkExperience: extractWorkExperience(),
          applicationFee: extractApplicationFee()
        };
      });
      
      return {
        gmatMinScore: admissionData.gmatData?.min,
        gmatMaxScore: admissionData.gmatData?.max,
        gmatAverageScore: admissionData.gmatData?.average,
        greMinScore: admissionData.greData?.min,
        greMaxScore: admissionData.greData?.max,
        minimumGpa: admissionData.minimumGpa,
        toeflMinScore: admissionData.toeflMinScore,
        ieltsMinScore: admissionData.ieltsMinScore,
        minWorkExperience: admissionData.minWorkExperience,
        applicationFee: admissionData.applicationFee
      };
      
    } catch (error) {
      console.log(`    Warning: Could not extract admission requirements - ${error.message}`);
      return {};
    }
  }

  async extractTuitionAndFees(page, config) {
    console.log(`  Extracting tuition and fees...`);
    
    try {
      await page.goto(`${config.baseUrl}${config.pages.tuition}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const financialData = await page.evaluate((selectors) => {
        // Try multiple selectors for tuition information
        const findTuitionAmount = () => {
          const patterns = [
            /tuition[:\s]*\$?(\d+(?:,\d{3})*)/i,
            /\$(\d+(?:,\d{3})*)[^\d]*(?:per\s*year|annual|yearly)/i,
            /annual\s*tuition[:\s]*\$?(\d+(?:,\d{3})*)/i,
            /total\s*cost[:\s]*\$?(\d+(?:,\d{3})*)/i
          ];
          
          const textContent = document.body.textContent;
          
          for (const pattern of patterns) {
            const match = textContent.match(pattern);
            if (match) {
              const amount = parseFloat(match[1].replace(/,/g, ''));
              // Reasonable range check for MBA tuition (30k-200k USD)
              if (amount >= 30000 && amount <= 200000) {
                return amount;
              }
            }
          }
          
          // Try selectors approach
          for (const selector of selectors.tuition) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              const text = el.textContent;
              const amountMatch = text.match(/\$?(\d+(?:,\d{3})*)/);
              if (amountMatch) {
                const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                if (amount >= 30000 && amount <= 200000) {
                  return amount;
                }
              }
            }
          }
          
          return null;
        };
        
        // Extract additional fees
        const extractFees = () => {
          const feeTypes = ['application', 'registration', 'technology', 'activity', 'health'];
          const fees = {};
          
          feeTypes.forEach(feeType => {
            const pattern = new RegExp(`${feeType}\\s+fee[:\\s]*\\$?(\\d+(?:,\\d{3})*)`, 'i');
            const match = document.body.textContent.match(pattern);
            if (match) {
              fees[`${feeType}Fee`] = parseFloat(match[1].replace(/,/g, ''));
            }
          });
          
          return fees;
        };
        
        return {
          baseTuition: findTuitionAmount(),
          additionalFees: extractFees()
        };
      }, config.selectors);
      
      return {
        tuitionFees: financialData.baseTuition,
        additionalFees: financialData.additionalFees
      };
      
    } catch (error) {
      console.log(`    Warning: Could not extract tuition data - ${error.message}`);
      return {};
    }
  }

  async extractEssayPrompts(page, config) {
    console.log(`  Extracting essay prompts...`);
    
    try {
      await page.goto(`${config.baseUrl}${config.pages.essays}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const essayData = await page.evaluate(() => {
        const prompts = [];
        
        // Look for essay questions/prompts
        const essaySelectors = [
          '.essay-question',
          '.essay-prompt', 
          '.application-essay',
          '[class*="essay"]',
          'h3 + p',
          'h4 + p'
        ];
        
        essaySelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            // Check if this looks like an essay prompt (contains question mark, reasonable length)
            if (text.includes('?') && text.length > 50 && text.length < 1000) {
              // Extract word limit if mentioned
              const wordLimitMatch = text.match(/(\d+)\s*words?/i) || 
                                   el.parentElement?.textContent.match(/(\d+)\s*words?/i);
              
              prompts.push({
                promptText: text,
                wordLimit: wordLimitMatch ? parseInt(wordLimitMatch[1]) : null
              });
            }
          });
        });
        
        // Deduplicate based on similar text
        const uniquePrompts = [];
        prompts.forEach(prompt => {
          const isDuplicate = uniquePrompts.some(existing => 
            existing.promptText.substring(0, 100) === prompt.promptText.substring(0, 100)
          );
          if (!isDuplicate) {
            uniquePrompts.push(prompt);
          }
        });
        
        return uniquePrompts.slice(0, 5); // Limit to 5 prompts
      });
      
      return { essayPrompts: essayData };
      
    } catch (error) {
      console.log(`    Warning: Could not extract essay prompts - ${error.message}`);
      return { essayPrompts: [] };
    }
  }

  async extractDeadlines(page, config) {
    console.log(`  Extracting application deadlines...`);
    
    try {
      // Try main admissions page first for deadlines
      const deadlineData = await page.evaluate(() => {
        const deadlines = [];
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        
        // Look for deadline patterns in text
        const textContent = document.body.textContent;
        const datePatterns = [
          /(\w+\s+\d{1,2},?\s+\d{4})/g, // January 15, 2024
          /(\d{1,2}\/\d{1,2}\/\d{4})/g,  // 01/15/2024
          /(\d{1,2}-\d{1,2}-\d{4})/g     // 01-15-2024
        ];
        
        // Extract round information with dates
        const roundPatterns = [
          /round\s+(\d+)[:\s]*([^.]+)/gi,
          /deadline[:\s]*([^.]+)/gi,
          /application\s+due[:\s]*([^.]+)/gi
        ];
        
        roundPatterns.forEach(pattern => {
          const matches = textContent.matchAll(pattern);
          for (const match of matches) {
            const text = match[0];
            // Look for dates in this text
            datePatterns.forEach(datePattern => {
              const dateMatches = text.matchAll(datePattern);
              for (const dateMatch of dateMatches) {
                const dateStr = dateMatch[1];
                const parsedDate = new Date(dateStr);
                
                // Validate date is reasonable (current year or next year)
                if (parsedDate.getFullYear() >= currentYear && 
                    parsedDate.getFullYear() <= nextYear + 1) {
                  deadlines.push({
                    text: text.trim(),
                    date: parsedDate.toISOString(),
                    dateString: dateStr
                  });
                }
              }
            });
          }
        });
        
        return deadlines.slice(0, 5); // Limit to 5 deadlines
      });
      
      return { applicationDeadlines: deadlineData };
      
    } catch (error) {
      console.log(`    Warning: Could not extract deadlines - ${error.message}`);
      return { applicationDeadlines: [] };
    }
  }

  async extractScholarships(page, config) {
    console.log(`  Extracting scholarship information...`);
    
    try {
      await page.goto(`${config.baseUrl}${config.pages.scholarships}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const scholarshipData = await page.evaluate(() => {
        const scholarships = [];
        
        // Look for scholarship sections
        const scholarshipSections = document.querySelectorAll([
          '.scholarship',
          '.fellowship',
          '.financial-aid',
          '[class*="scholarship"]',
          '[class*="fellowship"]',
          'h3, h4, h5'
        ].join(', '));
        
        scholarshipSections.forEach(section => {
          const title = section.textContent.trim();
          
          // Check if this looks like a scholarship title
          if ((title.toLowerCase().includes('scholarship') || 
               title.toLowerCase().includes('fellowship') || 
               title.toLowerCase().includes('grant')) && 
              title.length < 200) {
            
            // Try to find description in next sibling or parent
            let description = '';
            let amount = null;
            let percentage = null;
            
            const nextElement = section.nextElementSibling;
            if (nextElement) {
              description = nextElement.textContent.trim();
              
              // Extract monetary amounts
              const amountMatch = description.match(/\$(\d+(?:,\d{3})*)/);
              if (amountMatch) {
                amount = parseFloat(amountMatch[1].replace(/,/g, ''));
              }
              
              // Extract percentages
              const percentMatch = description.match(/(\d+)%/);
              if (percentMatch) {
                percentage = parseFloat(percentMatch[1]);
              }
            }
            
            scholarships.push({
              name: title,
              description: description.substring(0, 500),
              amount,
              percentage
            });
          }
        });
        
        return scholarships.slice(0, 10); // Limit to 10 scholarships
      });
      
      return { scholarships: scholarshipData };
      
    } catch (error) {
      console.log(`    Warning: Could not extract scholarships - ${error.message}`);
      return { scholarships: [] };
    }
  }

  async createDatabaseRecords(universityData, config) {
    console.log(`  Creating database records for ${config.name}...`);
    
    try {
      // Create university record
      const university = await prisma.university.upsert({
        where: { slug: this.createSlug(config.name) },
        update: {
          universityName: config.name,
          city: universityData.data.city,
          state: universityData.data.state,
          country: "United States",
          fullAddress: universityData.data.fullAddress,
          acceptanceRate: universityData.data.acceptanceRate,
          gmatAverageScore: universityData.data.gmatAverageScore,
          gmatScoreMin: universityData.data.gmatMinScore,
          gmatScoreMax: universityData.data.gmatMaxScore,
          minimumGpa: universityData.data.minimumGpa,
          tuitionFees: universityData.data.tuitionFees,
          websiteUrl: universityData.data.websiteUrl,
          metaTitle: universityData.data.metaTitle,
          metaDescription: universityData.data.metaDescription,
          whyChooseHighlights: universityData.data.whyChooseHighlights || [],
          isActive: true,
          isFeatured: true,
          updatedAt: new Date()
        },
        create: {
          universityName: config.name,
          slug: this.createSlug(config.name),
          city: universityData.data.city || "Unknown",
          state: universityData.data.state || "Unknown",
          country: "United States",
          fullAddress: universityData.data.fullAddress,
          acceptanceRate: universityData.data.acceptanceRate,
          gmatAverageScore: universityData.data.gmatAverageScore,
          gmatScoreMin: universityData.data.gmatMinScore,
          gmatScoreMax: universityData.data.gmatMaxScore,
          minimumGpa: universityData.data.minimumGpa,
          tuitionFees: universityData.data.tuitionFees,
          websiteUrl: universityData.data.websiteUrl || config.baseUrl,
          metaTitle: universityData.data.metaTitle,
          metaDescription: universityData.data.metaDescription,
          whyChooseHighlights: universityData.data.whyChooseHighlights || [],
          isActive: true,
          isFeatured: true
        }
      });
      
      // Create essay prompts if extracted
      if (universityData.data.essayPrompts && universityData.data.essayPrompts.length > 0) {
        for (const [index, prompt] of universityData.data.essayPrompts.entries()) {
          await prisma.essayPrompt.create({
            data: {
              promptTitle: `Essay ${index + 1}`,
              promptText: prompt.promptText,
              wordLimit: prompt.wordLimit || 500,
              minWordCount: Math.floor((prompt.wordLimit || 500) * 0.8),
              isMandatory: index < 2,
              isActive: true
            }
          });
        }
      }
      
      // Create scholarships if extracted
      if (universityData.data.scholarships && universityData.data.scholarships.length > 0) {
        for (const scholarship of universityData.data.scholarships) {
          const scholarshipSlug = this.createSlug(`${config.name}-${scholarship.name}`);
          
          await prisma.scholarship.upsert({
            where: {
              universityId_scholarshipSlug: {
                universityId: university.id,
                scholarshipSlug: scholarshipSlug
              }
            },
            update: {
              scholarshipName: scholarship.name,
              scholarshipType: scholarship.amount ? "FIXED_AMOUNT" : "PERCENTAGE",
              description: scholarship.description,
              amount: scholarship.amount,
              percentage: scholarship.percentage,
              isActive: true
            },
            create: {
              universityId: university.id,
              scholarshipName: scholarship.name,
              scholarshipSlug: scholarshipSlug,
              scholarshipType: scholarship.amount ? "FIXED_AMOUNT" : "PERCENTAGE",
              description: scholarship.description,
              amount: scholarship.amount,
              percentage: scholarship.percentage,
              applicationRequired: true,
              isActive: true
            }
          });
        }
      }
      
      return university;
      
    } catch (error) {
      console.error(`Database creation failed for ${config.name}:`, error);
      throw error;
    }
  }

  createSlug(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("ENHANCED SCRAPING REPORT");
    console.log("=".repeat(60));
    
    console.log(`\nSuccessfully scraped: ${this.successfulScrapes.size} universities`);
    for (const [name, data] of this.successfulScrapes.entries()) {
      console.log(`✅ ${name}:`);
      const d = data.data;
      if (d.tuitionFees) console.log(`   - Tuition: ${d.tuitionFees.toLocaleString()}`);
      if (d.acceptanceRate) console.log(`   - Acceptance Rate: ${d.acceptanceRate}%`);
      if (d.gmatAverageScore) console.log(`   - GMAT Average: ${d.gmatAverageScore}`);
      if (d.essayPrompts?.length) console.log(`   - Essay Prompts: ${d.essayPrompts.length}`);
      if (d.scholarships?.length) console.log(`   - Scholarships: ${d.scholarships.length}`);
    }
    
    if (this.failedScrapes.size > 0) {
      console.log(`\nFailed scrapes: ${this.failedScrapes.size} universities`);
      for (const [name, error] of this.failedScrapes.entries()) {
        console.log(`❌ ${name}: ${error}`);
      }
    }
  }
}

// Enhanced execution with real data validation
async function main() {
  const scraper = new EnhancedMBADataScraper();
  
  try {
    await scraper.initialize();
    
    // Process universities with their specific configurations
    for (const [slug, config] of Object.entries(UNIVERSITY_CONFIGS)) {
      try {
        console.log(`\n${"=".repeat(50)}`);
        console.log(`Processing ${config.name}`);
        console.log("=".repeat(50));
        
        const universityData = await scraper.scrapeUniversityWithRealData(config);
        
        if (universityData && Object.keys(universityData.data).length > 0) {
          // Only create database records if we have real data
          const dataQuality = {
            hasLocation: !!(universityData.data.city && universityData.data.state),
            hasTuition: !!universityData.data.tuitionFees,
            hasAdmissionData: !!(universityData.data.gmatAverageScore || universityData.data.minimumGpa),
            hasEssays: !!(universityData.data.essayPrompts && universityData.data.essayPrompts.length > 0),
            hasScholarships: !!(universityData.data.scholarships && universityData.data.scholarships.length > 0)
          };
          
          const qualityScore = Object.values(dataQuality).filter(Boolean).length;
          console.log(`Data Quality Score: ${qualityScore}/5`);
          
          // Only proceed if we have decent data quality
          if (qualityScore >= 2) {
            await scraper.createDatabaseRecords(universityData, config);
            console.log(`✅ Successfully processed ${config.name} with real data`);
          } else {
            console.log(`⚠️ Skipping ${config.name} - insufficient real data extracted`);
          }
        }
        
        // Add delay between universities
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Failed to process ${config.name}:`, error.message);
      }
    }
    
    scraper.generateReport();
    
  } catch (error) {
    console.error("Fatal error in enhanced scraper:", error);
  } finally {
    await scraper.cleanup();
    await prisma.$disconnect();
  }
}

// Additional utility functions for data validation
class DataValidator {
  static validateTuition(amount) {
    return amount && amount >= 20000 && amount <= 250000;
  }
  
  static validateGMAT(score) {
    return score && score >= 400 && score <= 800;
  }
  
  static validateGPA(gpa) {
    return gpa && gpa >= 2.0 && gpa <= 4.0;
  }
  
  static validateAcceptanceRate(rate) {
    return rate && rate >= 1 && rate <= 100;
  }
  
  static validateEssayPrompt(prompt) {
    return prompt && 
           prompt.promptText && 
           prompt.promptText.length >= 50 && 
           prompt.promptText.includes('?');
  }
}

// Export for use
export { EnhancedMBADataScraper, DataValidator, UNIVERSITY_CONFIGS };

// Run the enhanced scraper
if (import.meta.main) {
  main().catch(console.error);
}