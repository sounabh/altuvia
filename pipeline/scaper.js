const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

class MBAScraper {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async initBrowser() {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: config.puppeteer.headless,
          args: config.puppeteer.args,
          executablePath: config.puppeteer.executablePath,
          timeout: config.puppeteer.timeout
        });
        
        logger.scraper('Browser initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize browser', { error: error.message });
        throw error;
      }
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.scraper('Browser closed successfully');
      } catch (error) {
        logger.error('Error closing browser', { error: error.message });
      }
    }
  }

  // US News MBA Rankings Scraper
  async scrapeUSNewsMBARankings() {
    const url = 'https://www.usnews.com/best-graduate-schools/top-business-schools/mba-rankings';
    
    return await rateLimiter.executeWithRateLimit(url, async () => {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      try {
        await page.setUserAgent(this.userAgent);
        await page.setViewport({ width: 1920, height: 1080 });
        
        logger.scraper('Navigating to US News MBA rankings', { url });
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: config.puppeteer.timeout 
        });

        // Wait for content to load
        await page.waitForSelector('.SearchResult, .Flex, [data-testid]', { timeout: 10000 });

        const mbaPrograms = await page.evaluate(() => {
          // Try multiple selectors as US News changes their structure
          const selectors = [
            '.SearchResult',
            '[data-testid="search-result"]',
            '.RankingsPage-item',
            '.institution-card'
          ];

          let items = [];
          for (const selector of selectors) {
            items = document.querySelectorAll(selector);
            if (items.length > 0) break;
          }

          return Array.from(items).slice(0, 50).map((item, index) => {
            // Extract basic info
            const nameElement = item.querySelector('h3 a, .institution-name, [data-testid="institution-name"]') ||
                               item.querySelector('a[href*="best-graduate-schools"]');
            const locationElement = item.querySelector('.location, .institution-location, [data-testid="location"]');
            const rankElement = item.querySelector('.rank, .ranking, [data-testid="rank"]') ||
                               item.querySelector('*[class*="rank"]');

            // Extract metrics
            const getMetricValue = (labels) => {
              for (const label of labels) {
                const element = Array.from(item.querySelectorAll('*')).find(el => 
                  el.textContent && el.textContent.toLowerCase().includes(label.toLowerCase())
                );
                if (element) {
                  const parent = element.parentNode;
                  const value = parent.querySelector('[class*="value"], [class*="score"], .metric-value');
                  if (value) return value.textContent.trim();
                }
              }
              return null;
            };

            const name = nameElement?.textContent?.trim() || `MBA Program ${index + 1}`;
            const location = locationElement?.textContent?.trim() || '';
            const rank = rankElement?.textContent?.trim() || (index + 1).toString();

            return {
              name: name,
              rank: parseInt(rank.replace(/[^0-9]/g, '')) || (index + 1),
              location: location,
              city: location.split(',')[0]?.trim() || '',
              state: location.split(',')[1]?.trim() || '',
              country: 'United States',
              tuition: getMetricValue(['tuition', 'cost']),
              enrollment: getMetricValue(['enrollment', 'students']),
              gmatAverage: getMetricValue(['gmat', 'average gmat']),
              acceptanceRate: getMetricValue(['acceptance rate', 'admit rate']),
              averageGPA: getMetricValue(['gpa', 'average gpa']),
              workExperience: getMetricValue(['work experience', 'experience']),
              employmentRate: getMetricValue(['employment', 'job placement']),
              averageSalary: getMetricValue(['salary', 'starting salary']),
              websiteUrl: nameElement?.href || null,
              source: 'usnews_mba',
              scrapedAt: new Date().toISOString()
            };
          });
        });

        logger.scraper(`Scraped ${mbaPrograms.length} MBA programs from US News`, {
          count: mbaPrograms.length
        });

        return mbaPrograms.filter(program => program.name && program.name !== 'MBA Program');

      } catch (error) {
        logger.error('Error scraping US News MBA rankings', { error: error.message });
        return [];
      } finally {
        await page.close();
      }
    });
  }

  // QS MBA Rankings Scraper
  async scrapeQSMBARankings() {
    const url = 'https://www.topuniversities.com/university-rankings/mba-rankings/global/2024';
    
    return await rateLimiter.executeWithRateLimit(url, async () => {
      try {
        logger.scraper('Fetching QS MBA rankings', { url });
        const response = await axios.get(url, {
          headers: { 
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          timeout: 30000
        });

        const $ = cheerio.load(response.data);
        const programs = [];

        $('.ranking-data-table tbody tr, .uni-link, .ranking-item').each((index, element) => {
          if (index >= 50) return false; // Limit to top 50

          const $el = $(element);
          const name = $el.find('.uni-link, .university-name, h3 a').first().text().trim();
          const location = $el.find('.location, .country').text().trim();
          const rank = $el.find('.rank, .position').first().text().trim();

          if (name && location.toLowerCase().includes('united states')) {
            programs.push({
              name: name.replace(/\s+/g, ' '),
              rank: parseInt(rank.replace(/[^0-9]/g, '')) || (index + 1),
              location: location,
              country: 'United States',
              source: 'qs_mba',
              scrapedAt: new Date().toISOString()
            });
          }
        });

        // If table structure fails, try alternative selectors
        if (programs.length === 0) {
          $('.search-result, .ranking-institution').each((index, element) => {
            if (index >= 50) return false;

            const $el = $(element);
            const name = $el.find('h3, .title, .name').first().text().trim();
            const location = $el.find('.location, .country, .region').text().trim();

            if (name && (location.toLowerCase().includes('united states') || location.toLowerCase().includes('usa'))) {
              programs.push({
                name: name.replace(/\s+/g, ' '),
                rank: index + 1,
                location: location,
                country: 'United States',
                source: 'qs_mba',
                scrapedAt: new Date().toISOString()
              });
            }
          });
        }

        logger.scraper(`Scraped ${programs.length} MBA programs from QS Rankings`, {
          count: programs.length
        });

        return programs;

      } catch (error) {
        logger.error('Error scraping QS MBA rankings', { error: error.message });
        return [];
      }
    });
  }

  // Financial Times Global MBA Ranking
  async scrapeFTMBARankings() {
    const url = 'https://rankings.ft.com/rankings/2859/global-mba-2024';
    
    return await rateLimiter.executeWithRateLimit(url, async () => {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
        await page.setUserAgent(this.userAgent);
        logger.scraper('Navigating to FT MBA rankings', { url });
        
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: config.puppeteer.timeout 
        });

        await page.waitForSelector('.table, .ranking-table, tbody tr', { timeout: 15000 });

        const programs = await page.evaluate(() => {
          const rows = document.querySelectorAll('tbody tr, .ranking-row');
          
          return Array.from(rows).slice(0, 50).map((row, index) => {
            const cells = row.querySelectorAll('td, .cell');
            
            if (cells.length === 0) return null;

            const rank = cells[0]?.textContent?.trim() || (index + 1).toString();
            const schoolName = cells[1]?.textContent?.trim() || cells[1]?.querySelector('a')?.textContent?.trim();
            const country = cells[2]?.textContent?.trim() || '';
            const salary = cells[3]?.textContent?.trim() || '';
            const salaryIncrease = cells[4]?.textContent?.trim() || '';

            // Only include US schools
            if (!country.toLowerCase().includes('us') && !country.toLowerCase().includes('united states')) {
              return null;
            }

            return {
              name: schoolName,
              rank: parseInt(rank.replace(/[^0-9]/g, '')) || (index + 1),
              country: 'United States',
              averageSalary: salary.replace(/[^0-9]/g, '') || null,
              salaryIncrease: salaryIncrease.replace(/[^0-9]/g, '') || null,
              source: 'ft_mba',
              scrapedAt: new Date().toISOString()
            };
          }).filter(item => item && item.name);
        });

        logger.scraper(`Scraped ${programs.length} MBA programs from Financial Times`, {
          count: programs.length
        });

        return programs;

      } catch (error) {
        logger.error('Error scraping FT MBA rankings', { error: error.message });
        return [];
      } finally {
        await page.close();
      }
    });
  }

  // BusinessWeek MBA Rankings
  async scrapeBusinessWeekRankings() {
    const url = 'https://www.bloomberg.com/business-school-rankings/2022-mba';
    
    return await rateLimiter.executeWithRateLimit(url, async () => {
      try {
        logger.scraper('Fetching BusinessWeek MBA rankings', { url });
        const response = await axios.get(url, {
          headers: { 
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml',
          },
          timeout: 30000
        });

        const $ = cheerio.load(response.data);
        const programs = [];

        $('.ranking-table tbody tr, .school-item').slice(0, 50).each((index, element) => {
          const $el = $(element);
          const name = $el.find('.school-name, .name, td:nth-child(2)').first().text().trim();
          const location = $el.find('.location, td:nth-child(3)').text().trim();
          const rank = $el.find('.rank, td:first-child').text().trim();

          if (name) {
            programs.push({
              name: name.replace(/\s+/g, ' '),
              rank: parseInt(rank.replace(/[^0-9]/g, '')) || (index + 1),
              location: location,
              country: 'United States',
              source: 'businessweek_mba',
              scrapedAt: new Date().toISOString()
            });
          }
        });

        logger.scraper(`Scraped ${programs.length} MBA programs from BusinessWeek`, {
          count: programs.length
        });

        return programs;

      } catch (error) {
        logger.error('Error scraping BusinessWeek MBA rankings', { error: error.message });
        return [];
      }
    });
  }

  // Generic university website scraper for detailed information
  async scrapeUniversityDetails(universityUrl, universityName) {
    if (!universityUrl) return null;

    return await rateLimiter.executeWithRateLimit(universityUrl, async () => {
      try {
        logger.scraper(`Scraping university details for ${universityName}`, { url: universityUrl });
        
        const response = await axios.get(universityUrl, {
          headers: { 'User-Agent': this.userAgent },
          timeout: 20000
        });

        const $ = cheerio.load(response.data);

        return {
          overview: this.extractOverview($),
          admissionRequirements: this.extractAdmissionRequirements($),
          tuitionDetails: this.extractTuitionDetails($),
          programDetails: this.extractProgramDetails($),
          contactInfo: this.extractContactInfo($),
          deadlines: this.extractDeadlines($)
        };

      } catch (error) {
        logger.error(`Error scraping university details for ${universityName}`, { 
          url: universityUrl, 
          error: error.message 
        });
        return null;
      }
    });
  }

  // Helper methods for extracting specific data
  extractOverview($) {
    const selectors = [
      '.program-overview',
      '.mba-overview', 
      '.about-program',
      '.program-description',
      '[data-section="overview"]',
      '.overview'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 100) {
        return text.substring(0, 2000);
      }
    }

    // Fallback to meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    return metaDesc && metaDesc.length > 50 ? metaDesc : null;
  }

  extractAdmissionRequirements($) {
    const requirements = {};
    const text = $.text().toLowerCase();

    // GMAT score extraction
    const gmatMatch = text.match(/gmat.*?(\d{3})/i);
    if (gmatMatch) {
      requirements.gmatMinScore = parseInt(gmatMatch[1]);
    }

    // GPA extraction  
    const gpaMatch = text.match(/gpa.*?(\d\.?\d?)/i);
    if (gpaMatch) {
      requirements.minimumGpa = parseFloat(gpaMatch[1]);
    }

    // Work experience
    const workExpMatch = text.match(/(\d+)\s*years?\s*.*?experience/i);
    if (workExpMatch) {
      requirements.minWorkExperience = parseInt(workExpMatch[1]) * 12; // Convert to months
    }

    return requirements;
  }

  extractTuitionDetails($) {
    const text = $.text();
    const tuitionMatch = text.match(/\$[\d,]+/g);
    
    if (tuitionMatch) {
      const amounts = tuitionMatch.map(amount => 
        parseInt(amount.replace(/[$,]/g, ''))
      ).filter(amount => amount > 10000 && amount < 200000);
      
      return amounts.length > 0 ? Math.max(...amounts) : null;
    }
    
    return null;
  }

  extractProgramDetails($) {
    const details = {};
    
    // Duration
    const durationMatch = $.text().match(/(\d+)\s*(months?|years?)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      details.duration = unit.startsWith('year') ? value * 12 : value;
    }

    // Specializations
    const specializations = [];
    $('.specializations li, .concentrations li, .tracks li').each((i, el) => {
      const spec = $(el).text().trim();
      if (spec && spec.length > 3) {
        specializations.push(spec);
      }
    });
    details.specializations = specializations;

    return details;
  }

  extractContactInfo($) {
    const contact = {};
    const text = $.text();

    // Phone
    const phoneMatch = text.match(/(\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      contact.phone = phoneMatch[1];
    }

    // Email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      contact.email = emailMatch[1];
    }

    return contact;
  }

  extractDeadlines($) {
    const deadlines = [];
    const text = $.text();
    
    // Look for common deadline patterns
    const deadlinePatterns = [
      /(\w+\s+\d{1,2},?\s+\d{4})/g,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g
    ];

    for (const pattern of deadlinePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(dateStr => {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime()) && date.getFullYear() >= new Date().getFullYear()) {
            deadlines.push(date.toISOString());
          }
        });
      }
    }

    return deadlines.slice(0, 5); // Limit to 5 deadlines
  }

  // Utility method to clean and normalize university names
  normalizeUniversityName(name) {
    if (!name) return '';
    
    return name
      .replace(/\s*-\s*MBA.*$/i, '') // Remove MBA suffix
      .replace(/\s*Business School.*$/i, '') // Remove Business School
      .replace(/\s*School of Business.*$/i, '') // Remove School of Business
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Get browser status for monitoring
  async getBrowserStatus() {
    return {
      isRunning: !!this.browser,
      pages: this.browser ? (await this.browser.pages()).length : 0,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MBAScraper;