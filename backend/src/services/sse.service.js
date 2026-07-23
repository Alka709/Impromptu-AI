const logger = require('../telemetry/logger');

class SSEService {
  constructor() {
    this.clients = new Map();
  }

  addClient(sessionId, res) {
    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }
    this.clients.get(sessionId).add(res);
    logger.info('SSE Client connected', { session_id: sessionId, total_clients: this.clients.get(sessionId).size });
  }

  removeClient(sessionId, res) {
    if (this.clients.has(sessionId)) {
      const sessionClients = this.clients.get(sessionId);
      sessionClients.delete(res);
      logger.info('SSE Client disconnected', { session_id: sessionId, remaining_clients: sessionClients.size });
      if (sessionClients.size === 0) {
        this.clients.delete(sessionId);
      }
    }
  }

  notifyClient(sessionId, data) {
    if (this.clients.has(sessionId)) {
      const sessionClients = this.clients.get(sessionId);
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      sessionClients.forEach(res => {
        res.write(payload);
      });
      logger.info('SSE Notification sent', { session_id: sessionId, clients_notified: sessionClients.size });
    }
  }
}

const sseService = new SSEService();
module.exports = sseService;
