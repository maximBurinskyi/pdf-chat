// // import { createUploadthing, type FileRouter } from 'uploadthing/next';
// import { createUploadthing, type FileRouter } from 'uploadthing/next';
// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
// import { db } from '@/db';
// // import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
// import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

// import { getPineconeClient, pinecone } from '@/lib/pinecone';
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// // import { PineconeStore } from 'langchain/vectorstores/pinecone';
// import { PineconeStore } from 'langchain/vectorstores/pinecone';

// import { Pinecone } from '@pinecone-database/pinecone';

// const f = createUploadthing();

// // const auth = (req: Request) => ({ id: 'fakeId' }); // Fake auth function

// export const ourFileRouter = {
//   pdfUploader: f({ pdf: { maxFileSize: '4MB' } })
//     .middleware(async ({ req }) => {
//       const { getUser } = getKindeServerSession();
//       const user = getUser();

//       if (!user || !user.id) throw new Error('Unathorized');
//       return { userId: user.id };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       const createdFile = await db.file.create({
//         data: {
//           key: file.key,
//           name: file.name,
//           userId: metadata.userId,
//           url: file.url,
//           uploadStatus: 'PROCESSING',
//         },
//       });

//       try {
//         const response = await fetch(
//           `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
//         );
//         const blob = await response.blob();

//         const loader = new PDFLoader(blob);

//         let pageLevelDocs = await loader.load();

//         // pageLevelDocs = pageLevelDocs.map((doc) => {
//         //   doc.metadata = {
//         //     ...doc.metadata,
//         //     fileId: createdFile.id, // map over the docs and add the file id.
//         //   };
//         //   return doc;
//         // });

//         const pagesAmt = pageLevelDocs.length;

//         // vectorize and index entire document

//         // const pinecone = await getPineconeClient();
//         // const pineconeIndex = pinecone.Index('pdf-reader');

//         // const embeddings = new OpenAIEmbeddings({
//         //   openAIApiKey: process.env.OPENAI_API_KEY,
//         // });

//         // await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
//         //   pineconeIndex,
//         //   namespace: createdFile.id,
//         // });

//         const pinecone = new Pinecone();
//         await pinecone.init({
//           environment: 'us-east1-gcp-free',
//           apiKey: '0f42c7e1-d43f-428f-9d9e-92349cdaccd7',
//         });
//         const index = pinecone.Index('pdf-reader');

//         //const pinecone = await getPineconeClient();
//         // const pineconeIndex = pinecone.Index('pdf-reader');

//         const embeddings = new OpenAIEmbeddings({
//           openAIApiKey: process.env.OPENAI_API_KEY,
//         });

//         await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
//           index,
//           namespace: createdFile.id,
//         });

//         await db.file.update({
//           data: {
//             uploadStatus: 'SUCCESS',
//           },
//           where: {
//             id: createdFile.id,
//           },
//         });
//       } catch (err) {
//         await db.file.update({
//           data: {
//             uploadStatus: 'FAILED',
//           },
//           where: {
//             id: createdFile.id,
//           },
//         });
//       }
//     }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;

import { db } from '@/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createUploadthing, type FileRouter } from 'uploadthing/next';

import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { getPineconeClient } from '@/lib/pinecone';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = getUser();

  if (!user || !user.id) throw new Error('Unauthorized');

  const subscriptionPlan = await getUserSubscriptionPlan();

  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  console.log('metadat:', metadata);
  console.log('file:', file);
  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExist) return;

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: file.url,
      uploadStatus: 'PROCESSING',
    },
  });

  try {
    const response = await fetch(file.url);

    const blob = await response.blob();

    const loader = new PDFLoader(blob);

    const pageLevelDocs = await loader.load();

    const pagesAmt = pageLevelDocs.length;

    const { subscriptionPlan } = metadata;
    const { isSubscribed } = subscriptionPlan;

    const isProExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf;
    const isFreeExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === 'Free')!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.file.update({
        data: {
          uploadStatus: 'FAILED',
        },
        where: {
          id: createdFile.id,
        },
      });
    }

    // vectorize and index entire document
    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index('pdf-reader');

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
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
};

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
