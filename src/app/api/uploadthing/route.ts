import { createNextRouteHandler } from 'uploadthing/next';

import { ourFileRouter } from './core';

// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
  config: {
    uploadthingId: 'booye6lool',
    uploadthingSecret:
      'sk_live_2087cbd679cda3c0f9c5afb96b4bc126ec3da28c023b4552f17409e7b76aa9d9',
    callbackUrl: 'https://pdf-chat-2mpk.vercel.app/',
  },
});

// Your app is running behind a reverse proxy such as Nginx.
// The automatic URL inference unfortunately breaks for certain reverse proxy setups. In this case, set either
//  the config.callbackUrl when you're creating the server entrypoints or the UPLOADTHING_URL environment variable to
//  the public URL of your application.

// You will get a warning in the console if we detect a localhost URL is being used as the callback URL in production.
