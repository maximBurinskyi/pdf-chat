// import { Pinecone } from '@pinecone-database/pinecone';

// export const pinecone = new Pinecone({
//   apiKey: process.env.PINCECONE_API_KEY!,
//   environment: 'gcp-starter',
// });

import { PineconeClient } from '@pinecone-database/pinecone';

export const getPineconeClient = async () => {
  const client = new PineconeClient();

  await client.init({
    apiKey: '0f42c7e1-d43f-428f-9d9e-92349cdaccd7',
    environment: 'us-east1-gcp',
  });

  return client;
};

// import { Pinecone } from '@pinecone-database/pinecone';
// export const pinecone = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY!,
//   environment: 'gcp-starter',
// });
