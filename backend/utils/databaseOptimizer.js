import pool from '../config/db.js';

class DatabaseOptimizer {
  constructor() {
    this.queriesExecuted = 0;
  }

  executeQuery(query, params = []) {
    this.queriesExecuted++;
    return pool.query(query, params);
  }

  getQueryStats() {
    return {
      queriesExecuted: this.queriesExecuted,
      poolSize: pool.totalCount || 0,
    };
  }
}

const databaseOptimizer = new DatabaseOptimizer();
export default databaseOptimizer;
