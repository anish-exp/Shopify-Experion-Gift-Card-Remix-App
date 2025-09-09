import crypto from "crypto";
import prisma from '../db.server'

export function verifyShopifyProxyRequest(url, secret) {
  try {
    const params = Object.fromEntries(url.searchParams.entries());
    const signature = params.signature;

    if (!signature) {
      return false;
    }

    delete params.signature;

    const sortedParams = Object.keys(params)
      .sort()
      .map((key) =>
        `${key}=${Array.isArray(params[key]) ? params[key].join(",") : params[key]}`
      )
      .join("");

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(sortedParams)
      .digest("hex");

    const result = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "hex"),
      Buffer.from(signature, "hex")
    );

    return result;
  } catch (error) {
    return false;
  }
}

/**
 * Get access token for a shop
 */
export async function getAccessTokenByShop(shopify, shop) {
  const sessions = await shopify.sessionStorage.findSessionsByShop(shop);
  const session = sessions?.[0];
  if (!session) {
    throw new Error(`No session found for shop: ${shop}`);
  }
  return session.accessToken;
}

/**
 * Get setup progress for a configuration page
 */
export async function getSetupProgress(shop) {
  try {
    if (!prisma) {
      console.error("Prisma client is not initialized");
      return null;
    }

    const setup = await prisma.setupProgress.findUnique({
      where: { shop }
    });

    return setup;
  } catch (error) {
    return {
      appBlockDone: false,
      productTypeDone: false,
      checkoutRuleDone: false,
      collectionDone: false,
      isComplete: false
    };
  }
}

/**
 * Update setup progress for a configuration page
 */
export async function updateSetupProgress(shop, step) {
  try {
    if (!prisma) {
      console.error("Prisma client is not initialized");
      throw new Error("Database connection not available");
    }

    const stepFieldMap = {
      appBlockDone: { appBlockDone: true },
      productTypeDone: { productTypeDone: true },
      checkoutRuleDone: { checkoutRuleDone: true },
      collectionDone: { collectionDone: true },
    };

    const updateData = stepFieldMap[step];

    if (!updateData) {
      console.error("Invalid step:", step);
      throw new Error(`Invalid step: ${step}`);
    }

    const existing = await prisma.setupProgress.findUnique({
      where: { shop }
    });

    const merged = {
      appBlockDone: existing?.appBlockDone || false,
      productTypeDone: existing?.productTypeDone || false,
      checkoutRuleDone: existing?.checkoutRuleDone || false,
      collectionDone: existing?.collectionDone || false,
      ...updateData,
    };
    
    const isComplete =
      merged.appBlockDone &&
      merged.productTypeDone &&
      merged.checkoutRuleDone &&
      merged.collectionDone;

    return await prisma.setupProgress.upsert({
      where: { shop },
      update: { ...updateData, isComplete },
      create: { shop, ...merged, isComplete },
    });
  } catch (error) {
    console.error("Error in updateSetupProgress:", error);
    throw error;
  }
}