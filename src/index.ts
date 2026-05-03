import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import logger from 'jet-logger';

import parcoursRouter from './routes/api/parcours';
import resourceRouter from './routes/api/resources';
import orderRouter from './routes/api/orders';
import testPrintRouter from './routes/api/test-print';
import bulletinRouter from './routes/api/bulletin';
import { DeploymentService } from './services/deployment.service';
import { errorHandler } from './util/error-handler';

// Load env vars
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-service';
mongoose.connect(mongoUri)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((err) => logger.err('MongoDB connection error: ' + err));

// Routes
app.use('/api/parcours', parcoursRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/commandes', orderRouter);
app.use('/api/test-print', testPrintRouter);
app.use('/api/bulletin', bulletinRouter);

// Route de déploiement (Server Action)
app.post('/api/admin/deploy', async (req: Request, res: Response) => {
  try {
    const result = await DeploymentService.buildAndPush();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Student Service API is running');
});

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ... après les autres routes ...

// Endpoint pour lancer les tests et voir le résultat
app.get('/api/run-tests', async (req: Request, res: Response) => {
  try {
    // On utilise une commande qui fonctionne même si certains tests échouent
    // et on capture stdout/stderr pour l'affichage
    const { stdout, stderr } = await execAsync('npm test', { 
      cwd: process.cwd(), // Utilise le répertoire courant du processus
      env: { ...process.env, CI: 'true' } // Force le mode non-interactif
    });
    res.type('text/plain').send(`STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`);
  } catch (error: any) {
    // En cas d'échec des tests (exit code != 0), execAsync lance une exception
    // mais contient quand même les sorties stdout/stderr
    res.status(200).type('text/plain').send(`TESTS FINISHED WITH ERRORS:\n\nSTDOUT:\n${error.stdout || ''}\n\nSTDERR:\n${error.stderr || ''}`);
  }
});

// Error handling
app.use(errorHandler);



// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Student Service started on port ${port}`);
  });
}

export default app;
