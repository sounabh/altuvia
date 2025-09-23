const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('../config/config');
const logger = require('./logger');

class RateLimiter {
  constructor() {
    // Create rate limiters for different domains
    this.rateLimiters = new Map();
    
    // Default rate limiter
    this.defaultLimiter = new RateLimiterMemory({
      keyPrefix: 'default',
      points: config.rateLimit.requestsPerMinute,
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if limit exceeded
    });

    // Domain-specific rate limiters
    this.initializeDomainLimiters();
  }

  initializeDomainLimiters() {
    const domainConfigs = {
      'usnews.com': {
        points: 15, // 15 requests per minute
        duration: 60,
        blockDuration: 120,
        name: 'US News'
      },
      'topuniversities.com': {
        points: 20, // 20 requests per minute
        duration: 60,
        blockDuration: 90,
        name: 'QS Rankings'
      },
      'timeshighereducation.com': {
        points: 10, // 10 requests per minute
        duration: 60,
        blockDuration: 180,
        name: 'THE Rankings'
      },
      'poetsandquants.com': {
        points: 8, // 8 requests per minute
        duration: 60,
        blockDuration: 240,
        name: 'Poets&Quants'
      },
      'aacsb.edu': {
        points: 12, // 12 requests per minute
        duration: 60,
        blockDuration: 120,
        name: 'AACSB'
      },
      'businessweek.com': {
        points: 10,
        duration: 60,
        blockDuration: 180,
        name: 'BusinessWeek'
      },
      'ft.com': {
        points: 8,
        duration: 60,
        blockDuration: 300,
        name: 'Financial Times'
      }
    };

    for (const [domain, config] of Object.entries(domainConfigs)) {
      this.rateLimiters.set(domain, {
        limiter: new RateLimiterMemory({
          keyPrefix: domain,
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration,
        }),
        name: config.name,
        config: config
      });
    }
  }

  getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Find matching domain pattern
      for (const domain of this.rateLimiters.keys()) {
        if (hostname.includes(domain)) {
          return domain;
        }
      }
      
      return hostname;
    } catch (error) {
      logger.error('Error parsing URL for rate limiting', { url, error: error.message });
      return 'unknown';
    }
  }

  async checkRateLimit(url) {
    const domain = this.getDomainFromUrl(url);
    const limiterInfo = this.rateLimiters.get(domain);
    const limiter = limiterInfo ? limiterInfo.limiter : this.defaultLimiter;
    const limiterName = limiterInfo ? limiterInfo.name : 'Default';

    try {
      const resRateLimiter = await limiter.consume(domain);
      
      logger.debug(`Rate limit check passed for ${limiterName}`, {
        domain,
        remainingPoints: resRateLimiter.remainingPoints,
        totalHits: resRateLimiter.totalHits
      });

      return {
        allowed: true,
        remainingPoints: resRateLimiter.remainingPoints,
        totalHits: resRateLimiter.totalHits,
        limiterName
      };

    } catch (rateLimiterRes) {
      const waitTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
      
      logger.rateLimit(`Rate limit exceeded for ${limiterName}`, {
        domain,
        waitTimeSeconds: waitTime,
        totalHits: rateLimiterRes.totalHits
      });

      return {
        allowed: false,
        waitTimeMs: rateLimiterRes.msBeforeNext,
        waitTimeSeconds: waitTime,
        totalHits: rateLimiterRes.totalHits,
        limiterName
      };
    }
  }

  async waitForRateLimit(url, maxWaitTime = 300000) { // Max 5 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const rateLimitResult = await this.checkRateLimit(url);
      
      if (rateLimitResult.allowed) {
        return true;
      }

      const waitTime = Math.min(rateLimitResult.waitTimeMs, 30000); // Max 30 seconds per check
      logger.rateLimit(`Waiting ${waitTime}ms before retry for ${rateLimitResult.limiterName}`, {
        url,
        waitTime
      });

      await this.delay(waitTime);
    }

    logger.error('Rate limit wait timeout exceeded', { url, maxWaitTime });
    return false;
  }

  async executeWithRateLimit(url, requestFunction, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // Check rate limit
        const rateLimitAllowed = await this.waitForRateLimit(url);
        if (!rateLimitAllowed) {
          throw new Error(`Rate limit exceeded for ${url} - max wait time reached`);
        }

        // Add additional delay based on configuration
        await this.delay(config.pipeline.requestDelayMs);

        // Execute the request
        const result = await requestFunction();
        
        logger.debug('Request executed successfully with rate limiting', {
          url,
          retryCount
        });

        return result;

      } catch (error) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          logger.error('Max retries exceeded for rate-limited request', {
            url,
            retryCount,
            error: error.message
          });
          throw error;
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        logger.warn(`Request failed, retrying in ${backoffDelay}ms`, {
          url,
          retryCount,
          error: error.message
        });

        await this.delay(backoffDelay);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get current status of all rate limiters
  async getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      limiters: {}
    };

    for (const [domain, limiterInfo] of this.rateLimiters) {
      try {
        // Get current usage without consuming a point
        const res = await limiterInfo.limiter.get(domain);
        
        status.limiters[domain] = {
          name: limiterInfo.name,
          config: limiterInfo.config,
          currentUsage: res ? res.totalHits : 0,
          remainingPoints: res ? (limiterInfo.config.points - res.totalHits) : limiterInfo.config.points,
          isBlocked: res ? (res.totalHits >= limiterInfo.config.points) : false
        };
      } catch (error) {
        status.limiters[domain] = {
          name: limiterInfo.name,
          config: limiterInfo.config,
          error: error.message
        };
      }
    }

    return status;
  }

  // Reset rate limiter for a specific domain (useful for testing)
  async resetDomain(domain) {
    const limiterInfo = this.rateLimiters.get(domain);
    if (limiterInfo) {
      try {
        await limiterInfo.limiter.delete(domain);
        logger.info(`Rate limiter reset for domain: ${limiterInfo.name}`, { domain });
        return true;
      } catch (error) {
        logger.error('Error resetting rate limiter', { domain, error: error.message });
        return false;
      }
    }
    return false;
  }

  // Reset all rate limiters
  async resetAll() {
    const results = {};
    
    for (const domain of this.rateLimiters.keys()) {
      results[domain] = await this.resetDomain(domain);
    }

    logger.info('All rate limiters reset', { results });
    return results;
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;