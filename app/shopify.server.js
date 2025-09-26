import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  BillingInterval
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { ACTIVE_SUBSCRIPTIONS_QUERY, METAFIELDS_SET_MUTATION } from "./utils/graphql";

export const MONTHLY_PLAN = 'Monthly Plan';
export const ANNUAL_PLAN = 'Annual Plan';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  billing: {
    [MONTHLY_PLAN]: {
      amount: 19,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      trialDays: 14,
    },
    [ANNUAL_PLAN]: {
      amount: 190,
      currencyCode: 'USD',
      interval: BillingInterval.Annual,
      trialDays: 14,
    },
  },
  hooks: {
    afterAuth: async ({ admin }) => {
      try {
        const response = await admin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
        const result = await response.json();

        const shopId = result?.data?.shop?.id;
        const activeSubs = result?.data?.currentAppInstallation?.activeSubscriptions || [];

        let planName = "Basic Plan";
        if (Array.isArray(activeSubs) && activeSubs.length > 0) {
          planName = activeSubs[0].name || "Basic Plan";
        }

        const metafieldResponse = await admin.graphql(METAFIELDS_SET_MUTATION, {
          variables: {
            metafields: [
              {
                namespace: "gift_card_settings",
                key: "plan_name",
                type: "single_line_text_field",
                value: planName,
                ownerId: shopId,
              }
            ]
          }
        });
        const metafieldResult = await metafieldResponse.json();
        console.log("Metafield set result:", metafieldResult.data.metafieldsSet.metafields);

      } catch (err) {
        console.error("afterAuth error:", err);
      }
    }
  }
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;