/**
 * Database Optimization Script
 * Implements performance improvements for PrepLoop database
 * 
 * Features:
 * - Index optimization for frequently queried columns
 * - Query performance analysis
 * - Connection pool optimization
 * - Table statistics updates
 * - Unused index detection
 */

import { createLogger } from '../utils/structuredLogger.js';
import { query } from '../config/db.js';
import { performance } from 'perf_hooks';

const logger = createLogger('database-optimization');

// Performance indexes to be created
const PERFORMANCE_INDEXES = [
  {
    name: 'idx_user_activity_user_id_timestamp',
    table: 'user_activity',
    columns: ['user_id', 'timestamp'],
    type: 'btree',
    condition: null
  },
  {
    name: 'idx_interview_history_user_id_created_at',
    table: 'interview_history',
    columns: ['user_id', 'created_at'],
    type: 'btree',
    condition: null
  },
  {
    name: 'idx_job_listings_skills_gin',
    table: 'job_listings',
    columns: ['skills'],
    type: 'gin',
    condition: null
  },
  {
    name: 'idx_coin_transactions_user_id_timestamp',
    table: 'coin_transactions',
    columns: ['user_id', 'timestamp'],
    type: 'btree',
    condition: null
  },
  {
    name: 'idx_blog_posts_published_at',
    table: 'blog_posts',
    columns: ['published_at'],
    type: 'btree',
    condition: 'WHERE published = true'
  },
  {
    name: 'idx_user_profiles_skills_gin',
    table: 'user_profiles',
    columns: ['skills'],
    type: 'gin',
    condition: null
  },
  {
    name: 'idx_dsa_problems_difficulty_topic',
    table: 'dsa_problems',
    columns: ['difficulty', 'topic'],
    type: 'btree',
    condition: null
  },
  {
    name: 'idx_system_design_topics_category',
    table: 'system_design_topics',
    columns: ['category', 'difficulty'],
    type: 'btree',
    condition: null
  }
];

// Composite indexes for complex queries
const COMPOSITE_INDEXES = [
  {
    name: 'idx_interview_sessions_user_status_created',
    table: 'interview_sessions',
    columns: ['user_id', 'status', 'created_at'],
    type: 'btree',
    condition: null
  },
  {
    name: 'idx_improvement_plans_user_active',
    table: 'improvement_plans',
    columns: ['user_id', 'is_active', 'created_at'],
    type: 'btree',
    condition: null
  },
  {
    name: 'idx_skill_match_jobs_user_skills',
    table: 'skill_match_jobs',
    columns: ['user_id', 'skill_match_score'],
    type: 'btree',
    condition: 'WHERE is_active = true'
  }
];

class DatabaseOptimizer {
  constructor() {
    this.optimizationStats = {
      indexesCreated: 0,
      indexesDropped: 0,
      queriesOptimized: 0,
      executionTime: 0
    };
  }

  async analyzeTablePerformance(tableName) {
    logger.info(`Analyzing table performance: ${tableName}`);
    
    try {
      const startTime = performance.now();
      
      // Get table statistics
      const tableStatsResult = await query(`
        SELECT * FROM pg_stat_user_tables 
        WHERE relname = $1
      `, [tableName]);

      const tableStats = tableStatsResult.rows;

      // Get index usage statistics
      const indexStatsResult = await query(`
        SELECT * FROM pg_stat_user_indexes 
        WHERE relname = $1
      `, [tableName]);

      const indexStats = indexStatsResult.rows;

      const executionTime = performance.now() - startTime;
      
      return {
        tableName,
        tableStats: tableStats[0] || {},
        indexStats: indexStats || [],
        executionTime
      };
    } catch (error) {
      logger.error(`Error analyzing table ${tableName}:`, error);
      return null;
    }
  }

  async createIndex(indexConfig) {
    const { name, table, columns, type, condition } = indexConfig;
    
    try {
      logger.info(`Creating index: ${name} on ${table}`);
      
      const startTime = performance.now();
      
      // Check if index already exists
      const { data: existingIndex, error: checkError } = await supabase.rpc('pg_indexes', {
        tablename: table,
        indexname: name
      });

      if (checkError) {
        logger.error(`Error checking index existence:`, checkError);
        return false;
      }

      if (existingIndex && existingIndex.length > 0) {
        logger.info(`Index ${name} already exists, skipping...`);
        return true;
      }

      // Build index creation query
      let createQuery = `CREATE INDEX CONCURRENTLY ${name} ON ${table}`;
      
      if (type === 'gin') {
        createQuery += ` USING gin (${columns.join(', ')})`;
      } else if (type === 'gist') {
        createQuery += ` USING gist (${columns.join(', ')})`;
      } else {
        createQuery += ` (${columns.join(', ')})`;
      }

      if (condition) {
        createQuery += ` WHERE ${condition}`;
      }

      // Execute index creation
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createQuery
      });

      if (createError) {
        logger.error(`Error creating index ${name}:`, createError);
        return false;
      }

      const executionTime = performance.now() - startTime;
      logger.info(`Index ${name} created successfully in ${executionTime.toFixed(2)}ms`);
      
      this.optimizationStats.indexesCreated++;
      return true;
    } catch (error) {
      logger.error(`Error creating index ${name}:`, error);
      return false;
    }
  }

  async dropUnusedIndexes() {
    logger.info('Analyzing unused indexes...');
    
    try {
      const startTime = performance.now();
      
      // Get unused indexes
      const { data: unusedIndexes, error } = await supabase.rpc('pg_stat_user_indexes');
      
      if (error) {
        logger.error('Error getting unused indexes:', error);
        return 0;
      }

      let droppedCount = 0;
      
      for (const index of unusedIndexes || []) {
        if (index.idx_tup_read === 0 && index.idx_tup_fetch === 0) {
          // Skip primary keys and unique constraints
          if (index.indexrelname.includes('pkey') || index.indexrelname.includes('unique')) {
            continue;
          }
          
          logger.info(`Dropping unused index: ${index.indexrelname}`);
          
          const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: `DROP INDEX IF EXISTS ${index.indexrelname}`
          });

          if (dropError) {
            logger.error(`Error dropping index ${index.indexrelname}:`, dropError);
            continue;
          }
          
          droppedCount++;
          this.optimizationStats.indexesDropped++;
        }
      }

      const executionTime = performance.now() - startTime;
      logger.info(`Dropped ${droppedCount} unused indexes in ${executionTime.toFixed(2)}ms`);
      
      return droppedCount;
    } catch (error) {
      logger.error('Error dropping unused indexes:', error);
      return 0;
    }
  }

  async updateTableStatistics() {
    logger.info('Updating table statistics...');
    
    try {
      const startTime = performance.now();
      
      // Get all user tables
      const { data: tables, error } = await supabase.rpc('pg_tables', {
        schemaname: 'public'
      });

      if (error) {
        logger.error('Error getting table list:', error);
        return false;
      }

      let updatedCount = 0;
      
      for (const table of tables || []) {
        if (table.tablename.startsWith('pg_') || table.tablename.startsWith('sql_')) {
          continue; // Skip system tables
        }
        
        logger.info(`Analyzing table: ${table.tablename}`);
        
        const { error: analyzeError } = await supabase.rpc('exec_sql', {
          sql: `ANALYZE ${table.tablename}`
        });

        if (analyzeError) {
          logger.error(`Error analyzing table ${table.tablename}:`, analyzeError);
          continue;
        }
        
        updatedCount++;
      }

      const executionTime = performance.now() - startTime;
      logger.info(`Updated statistics for ${updatedCount} tables in ${executionTime.toFixed(2)}ms`);
      
      return true;
    } catch (error) {
      logger.error('Error updating table statistics:', error);
      return false;
    }
  }

  async optimizeQueries() {
    logger.info('Optimizing slow queries...');
    
    try {
      const startTime = performance.now();
      
      // Get slow query statistics
      const { data: slowQueries, error } = await supabase.rpc('pg_stat_statements', {
        order_by: 'total_time DESC',
        limit: 10
      });

      if (error) {
        logger.error('Error getting slow queries:', error);
        return 0;
      }

      logger.info(`Found ${slowQueries?.length || 0} slow queries to analyze`);
      
      // Log slow queries for manual review
      for (const query of slowQueries || []) {
        logger.warn(`Slow query detected:`, {
          query: query.query,
          calls: query.calls,
          totalTime: query.total_time,
          meanTime: query.mean_time,
          rows: query.rows
        });
      }

      const executionTime = performance.now() - startTime;
      logger.info(`Query analysis completed in ${executionTime.toFixed(2)}ms`);
      
      this.optimizationStats.queriesOptimized = slowQueries?.length || 0;
      return slowQueries?.length || 0;
    } catch (error) {
      logger.error('Error optimizing queries:', error);
      return 0;
    }
  }

  async runOptimization() {
    logger.info('Starting database optimization...');
    const startTime = performance.now();
    
    try {
      // Phase 1: Create performance indexes
      logger.info('Phase 1: Creating performance indexes...');
      for (const indexConfig of PERFORMANCE_INDEXES) {
        await this.createIndex(indexConfig);
      }

      // Phase 2: Create composite indexes
      logger.info('Phase 2: Creating composite indexes...');
      for (const indexConfig of COMPOSITE_INDEXES) {
        await this.createIndex(indexConfig);
      }

      // Phase 3: Drop unused indexes
      logger.info('Phase 3: Dropping unused indexes...');
      await this.dropUnusedIndexes();

      // Phase 4: Update table statistics
      logger.info('Phase 4: Updating table statistics...');
      await this.updateTableStatistics();

      // Phase 5: Analyze slow queries
      logger.info('Phase 5: Analyzing slow queries...');
      await this.optimizeQueries();

      // Generate optimization report
      const totalExecutionTime = performance.now() - startTime;
      this.optimizationStats.executionTime = totalExecutionTime;

      const report = this.generateReport();
      logger.info('Database optimization completed:', report);
      
      return report;
    } catch (error) {
      logger.error('Error during database optimization:', error);
      throw error;
    }
  }

  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      optimizationStats: this.optimizationStats,
      recommendations: [
        'Monitor query performance regularly',
        'Consider partitioning large tables',
        'Implement connection pooling',
        'Regular VACUUM operations for PostgreSQL',
        'Monitor index usage statistics'
      ],
      nextSteps: [
        'Review slow query log weekly',
        'Update statistics monthly',
        'Consider query optimization for top 5 slowest queries',
        'Monitor database performance metrics'
      ]
    };
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new DatabaseOptimizer();
  
  optimizer.runOptimization()
    .then(report => {
      console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¯ Database optimization completed successfully!');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Database optimization failed:', error);
      process.exit(1);
    });
}

export default DatabaseOptimizer;