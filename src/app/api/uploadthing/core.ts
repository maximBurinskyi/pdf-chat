import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { db } from '@/db/index';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getPineconeClient, pinecone } from '@/lib/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

import { Pinecone } from '@pinecone-database/pinecone';

const f = createUploadthing();

// const auth = (req: Request) => ({ id: 'fakeId' }); // Fake auth function

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id) throw new Error('Unathorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
          uploadStatus: 'PROCESSING',
        },
      });

      try {
        const response = await fetch(
          `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
        );
        const blob = await response.blob();

        const loader = new PDFLoader(blob);

        let pageLevelDocs = await loader.load();

        // pageLevelDocs = pageLevelDocs.map((doc) => {
        //   doc.metadata = {
        //     ...doc.metadata,
        //     fileId: createdFile.id, // map over the docs and add the file id.
        //   };
        //   return doc;
        // });

        const pagesAmt = pageLevelDocs.length;

        // vectorize and index entire document

        const pinecone = await getPineconeClient();
        // const pineconeIndex = pinecone.Index('pdf-reader');

        // const embeddings = new OpenAIEmbeddings({
        //   openAIApiKey: process.env.OPENAI_API_KEY,
        // });

        // await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
        //   pineconeIndex,
        //   namespace: createdFile.id,
        // });

        // const pinecone = new Pinecone();
        // await pinecone.init({
        //   environment: 'us-east1-gcp',
        //   apiKey: '0f42c7e1-d43f-428f-9d9e-92349cdaccd7',
        // });
        const index = pinecone.Index('pdf-reader');

        //const pinecone = await getPineconeClient();
        // const pineconeIndex = pinecone.Index('pdf-reader');

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });

        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          index,
          namespace: createdFile.id,
        });

        await db.file.update({
          data: {
            uploadStatus: 'SUCCESS',
          },
          where: {
            id: createdFile.id,
          },
        });
      } catch (err) {
        await db.file.update({
          data: {
            uploadStatus: 'FAILED',
          },
          where: {
            id: createdFile.id,
          },
        });
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
