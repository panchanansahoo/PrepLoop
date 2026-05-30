// WebSocket handler for real-time job updates
import { fetchAllIndianJobs } from './indianJobApis.js';
import { getCachedJobs, setCachedJobs } from './jobCache.js';

const connectedClients = new Set();
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
let updateTimer = null;

export function setupJobWebSocket(wss) {
  wss.on('connection', (ws, _req) => {
    console.log('New WebSocket client connected for job updates');
    connectedClients.add(ws);

    // Send initial jobs
    sendJobUpdate(ws, 'software developer');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          const query = data.query || 'software developer';
          await sendJobUpdate(ws, query);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      connectedClients.delete(ws);
      
      if (connectedClients.size === 0 && updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });

    // Start periodic updates if not already running
    if (!updateTimer && connectedClients.size > 0) {
      startPeriodicUpdates();
    }
  });
}

async function sendJobUpdate(ws, query) {
  try {
    const cacheKey = `jobs_${query}_1`;
    let jobs = getCachedJobs(cacheKey);

    if (!jobs) {
      jobs = await fetchAllIndianJobs(query, 'India');
      setCachedJobs(cacheKey, jobs);
    }

    ws.send(JSON.stringify({
      type: 'job_update',
      query,
      jobs: jobs.slice(0, 20),
      timestamp: new Date().toISOString(),
      cached: !!getCachedJobs(cacheKey)
    }));
  } catch (error) {
    console.error('Error sending job update:', error);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to fetch jobs' 
    }));
  }
}

function startPeriodicUpdates() {
  updateTimer = setInterval(async () => {
    if (connectedClients.size === 0) {
      clearInterval(updateTimer);
      updateTimer = null;
      return;
    }

    console.log(`Broadcasting job updates to ${connectedClients.size} clients`);
    
    const queries = ['software developer', 'data analyst', 'frontend developer'];
    
    for (const query of queries) {
      try {
        const jobs = await fetchAllIndianJobs(query, 'India');
        const cacheKey = `jobs_${query}_1`;
        setCachedJobs(cacheKey, jobs);

        const message = JSON.stringify({
          type: 'job_update',
          query,
          jobs: jobs.slice(0, 20),
          timestamp: new Date().toISOString(),
          cached: false
        });

        connectedClients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      } catch (error) {
        console.error(`Error updating jobs for ${query}:`, error);
      }
    }
  }, UPDATE_INTERVAL);
}

export function broadcastJobUpdate(jobs, query) {
  const message = JSON.stringify({
    type: 'job_update',
    query,
    jobs,
    timestamp: new Date().toISOString()
  });

  connectedClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}
