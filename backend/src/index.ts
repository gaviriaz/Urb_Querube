import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { connectDB } from './utils/db';
import { logger } from './utils/logger';

import loteRouter from './routes/lote';
import reservaRouter from './routes/reserva';
import overridesRouter from './routes/overrides';
import analyticsRouter from './routes/analytics';
import loginRouter from './routes/login';

dotenv.config();

const app = express();

// Configure CORS to support local frontend and production domains
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const httpServer = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });

// WebSocket clients broadcast helper
wsServer.broadcast = (event: string, data: any) => {
  const payload = JSON.stringify({ event, data });
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// Handle upgrading standard HTTP connections to WebSockets
httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  if (pathname === '/ws') {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsServer.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Store wsServer in Express settings so routes can easily broadcast
app.set('wsServer', wsServer);

// WebSocket connection events
wsServer.on('connection', (ws) => {
  logger.info('Cliente conectado a WebSockets');
  console.log('Cliente conectado a WebSockets');

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      logger.info(`WebSocket msg recibido: ${JSON.stringify(parsed)}`);
    } catch {
      logger.warn(`Mensaje WebSocket no JSON recibido: ${message}`);
    }
  });

  ws.on('close', () => {
    logger.info('Cliente desconectado de WebSockets');
    console.log('Cliente desconectado de WebSockets');
  });
});

// Mount routes
app.use('/api/lote', loteRouter);
app.use('/api/reserva', reservaRouter);
app.use('/api/overrides', overridesRouter);
app.use('/api/login', loginRouter);

// Mount tracking/clicks/metrics on analytics router
app.use('/api', analyticsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

// Connect database then start server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });
