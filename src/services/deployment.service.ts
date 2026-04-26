import { exec } from 'child_process';
import { promisify } from 'util';
import logger from 'jet-logger';

const execAsync = promisify(exec);

export class DeploymentService {
  private static readonly REPO = 'inbtp/elmesacad-student';

  /**
   * Build and push Docker image to Docker Hub
   */
  static async buildAndPush() {
    try {
      logger.info('Starting Docker build and push process...');

      // 1. Build the image
      logger.info(`Building image ${this.REPO}:latest...`);
      await execAsync(`docker build -t ${this.REPO}:latest .`);

      // 2. Push to Docker Hub
      // Note: Assumes 'docker login' has been performed on the host
      logger.info(`Pushing image ${this.REPO}:latest to Docker Hub...`);
      await execAsync(`docker push ${this.REPO}:latest`);

      logger.info('Deployment successful!');
      return { success: true, message: 'Image built and pushed successfully' };
    } catch (error: any) {
      logger.err('Deployment failed: ' + error.message);
      throw error;
    }
  }
}
