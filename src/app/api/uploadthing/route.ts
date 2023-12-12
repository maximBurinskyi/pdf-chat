import { createNextRouteHandler } from 'uploadthing/next';

import { ourFileRouter } from './core';

// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
  config: {
    uploadthingId: process.env.UPLOADTHING_APP_ID,
    uploadthingSecret: process.env.UPLOADTHING_SECRET,
    callbackUrl: `${process.env.URL}/api/uploadthing`,
  },
});

// Your app is running behind a reverse proxy such as Nginx.
// The automatic URL inference unfortunately breaks for certain reverse proxy setups. In this case, set either
//  the config.callbackUrl when you're creating the server entrypoints or the UPLOADTHING_URL environment variable to
//  the public URL of your application.

// You will get a warning in the console if we detect a localhost URL is being used as the callback URL in production.
