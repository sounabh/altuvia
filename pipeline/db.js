const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Log database queries in debug mode
    this.prisma.$on('query', (e) => {
      logger.debug('Database query executed', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`
      });
    });

    // Log database errors
    this.prisma.$on('error', (e) => {
      logger.error('Database error', {
        message: e.message,
        target: e.target
      });
    });

    // Log database info
    this.prisma.$on('info', (e) => {
      logger.database(e.message, { target: e.target });
    });

    // Log database warnings
    this.prisma.$on('warn', (e) => {
      logger.warn(`Database warning: ${e.message}`, { target: e.target });
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      logger.database('Connected to database successfully');
      return true;
    } catch (error) {
      logger.error('Failed to connect to database', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      logger.database('Disconnected from database');
    } catch (error) {
      logger.error('Error disconnecting from database', { error: error.message });
    }
  }

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }

  async getStats() {
    try {
      const [
        universityCount,
        programCount,
        applicationCount,
        activeAdmissionCount,
        scholarshipCount
      ] = await Promise.all([
        this.prisma.university.count(),
        this.prisma.program.count(),
        this.prisma.application.count(),
        this.prisma.admission.count({ where: { isActive: true } }),
        this.prisma.scholarship.count({ where: { isActive: true } })
      ]);

      return {
        universities: universityCount,
        programs: programCount,
        applications: applicationCount,
        activeAdmissions: activeAdmissionCount,
        activeScholarships: scholarshipCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching database stats', { error: error.message });
      return null;
    }
  }

  // Transaction wrapper with proper error handling
  async transaction(operations) {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      logger.error('Database transaction failed', { error: error.message });
      throw error;
    }
  }

  // Batch operations with error handling
  async batchCreate(model, data, batchSize = 100) {
    const results = [];
    const errors = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.allSettled(
          batch.map(item => this.prisma[model].create({ data: item }))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              index: i + index,
              data: batch[index],
              error: result.reason.message
            });
          }
        });

        logger.database(`Batch ${Math.floor(i / batchSize) + 1} processed`, {
          model,
          batchSize: batch.length,
          successful: batchResults.filter(r => r.status === 'fulfilled').length,
          failed: batchResults.filter(r => r.status === 'rejected').length
        });

      } catch (error) {
        logger.error(`Batch operation failed for ${model}`, {
          batch: i / batchSize + 1,
          error: error.message
        });
        
        batch.forEach((item, index) => {
          errors.push({
            index: i + index,
            data: item,
            error: error.message
          });
        });
      }
    }

    return { results, errors };
  }

  // Safe upsert operation
  async safeUpsert(model, where, create, update = {}) {
    try {
      return await this.prisma[model].upsert({
        where,
        create,
        update: { ...update, updatedAt: new Date() }
      });
    } catch (error) {
      logger.error(`Safe upsert failed for ${model}`, {
        where,
        error: error.message
      });
      throw error;
    }
  }

  // Clean up old data
  async cleanupOldData(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const cleanupResults = await this.prisma.$transaction([
        // Clean up old application documents
        this.prisma.applicationDocument.deleteMany({
          where: {
            uploadedAt: { lt: cutoffDate },
            application: {
              applicationStatus: { in: ['REJECTED', 'WITHDRAWN'] }
            }
          }
        }),
        
        // Clean up old essay submissions
        this.prisma.essaySubmission.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            status: 'DRAFT'
          }
        }),
        
        // Clean up old calendar events
        this.prisma.calendarEvent.deleteMany({
          where: {
            endDate: { lt: cutoffDate },
            eventStatus: { in: ['completed', 'cancelled'] }
          }
        })
      ]);

      logger.database('Old data cleanup completed', {
        documentsDeleted: cleanupResults[0].count,
        essaysDeleted: cleanupResults[1].count,
        eventsDeleted: cleanupResults[2].count,
        cutoffDate: cutoffDate.toISOString()
      });

      return cleanupResults;
    } catch (error) {
      logger.error('Data cleanup failed', { error: error.message });
      throw error;
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;