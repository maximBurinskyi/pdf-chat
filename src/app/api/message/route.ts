import { NextRequest } from '/next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator';
import { db } from '@/db/index';

export const POST = async (req: NextRequest) => {
  // endppoint to ask questions to PDF

  const body = await req.json();

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const { id: userId } = user;

  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { fileId, message } = SendMessageValidator.parse(body);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!file) return new Response('Not found', { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });
};
