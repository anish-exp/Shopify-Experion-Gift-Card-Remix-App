import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {
    const { billing } = await authenticate.admin(request);
    const billingCheck = await billing.require({
        plans: [MONTHLY_PLAN, ANNUAL_PLAN],
        isTest: process.env.NODE_ENV !== "production",
        onFailure: () => {
            throw new Error("No active subscription found");
        },
    });

    const subscription = billingCheck?.appSubscriptions?.[0];
    if (subscription) {
        await billing.cancel({
            subscriptionId: subscription.id,
            isTest: process.env.NODE_ENV !== "production",
            prorate: true,
        });
    }

    return redirect("/app/pricing");
};