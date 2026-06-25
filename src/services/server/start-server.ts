/**
 * Start Server
 * Initializes and starts the Express server on 127.0.0.1 only.
 */

import { Express } from 'express';

type ServerConfig = {
  port: number;
  environment: string;
  onListen?: () => void;
};

/**
 * Binds the Express app to localhost.
 */
export const startServer = (app: Express, config: ServerConfig): void => {
  const { port, environment, onListen } = config;

  app.listen(port, '127.0.0.1', () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 Local Scheduler Express Server');
    console.log('='.repeat(50));
    console.log(`Environment: ${environment}`);
    console.log(`Port: ${port}`);
    console.log(`URL: http://127.0.0.1:${port}`);
    console.log(`Health Check: http://127.0.0.1:${port}/api/health`);
    console.log('='.repeat(50));
    console.log('');

    onListen?.();
  });
};
