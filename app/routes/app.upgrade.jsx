import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
    const { billing, session } = await authenticate.admin(request);
    const { shop } = session;
    const myShop = shop.replace(".myshopify.com", "");

    const url = new URL(request.url);
    const planType = url.searchParams.get("plan") || "monthly";
    const planName = planType === "annual" ? ANNUAL_PLAN : MONTHLY_PLAN;

    // Always request a new subscription, regardless of current plan
    const confirmationUrl = await billing.request({
        plan: planName,
        isTest: process.env.NODE_ENV !== "production",
        returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
    });

    // Redirect merchant to approve the new plan
    return redirect(confirmationUrl);
};