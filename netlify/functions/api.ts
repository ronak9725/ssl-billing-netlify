import serverless from 'serverless-http';
import { app } from '../../server/app.js';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  return await serverlessHandler(event, context);
};
