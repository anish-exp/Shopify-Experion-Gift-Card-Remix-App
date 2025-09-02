import { authenticate } from "../shopify.server";
import { ShopifyClient } from "../utils/client";
import { METAFIELDS_SET_MUTATION } from "../utils/graphql";

const clientQuery = async (client, query, variables) => {
    try {
        return await client.query({ query, variables });
    } catch (error) {
        console.error("[Shopify Query Error]:", error);
        throw error;
    }
};

export const action = async ({ request }) => {
    try {
        const { payload, shop, topic, session } = await authenticate.webhook(request);
        const client = new ShopifyClient(session.accessToken, shop);
        console.log(`Received ${topic} webhook for ${shop}`);

        if (payload.product_type === "exp gift hamper") {
            const productId = payload.admin_graphql_api_id;

            const metafields = [
                {
                    ownerId: productId,
                    namespace: "seo",
                    key: "hidden",
                    type: "number_integer",
                    value: "1"
                }
            ];

            const response = await clientQuery(client, METAFIELDS_SET_MUTATION, { metafields });

            if (response?.data?.metafieldsSet?.userErrors?.length > 0) {
                console.error("Metafield set error:", response.data.metafieldsSet.userErrors);
                return new Response("Failed to set metafield");
            }

            console.log("Metafield updated successfully...");
        }

        return new Response();
    } catch (error) {
        console.error("Webhook handler error:", error);
        return new Response("Internal server error");
    }
};