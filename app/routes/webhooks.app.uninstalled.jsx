import { authenticate } from "../shopify.server";
import db from "../db.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  await prisma.setupProgress.deleteMany({
    where: { shop },
  });
  console.log("SetupProgress table cleared successfully...");

  if (session) {
    await db.session.deleteMany({ where: { shop } });
    console.log("Session table cleared successfully...");
  }

  return new Response("Webhook processed", { status: 200 });
};
