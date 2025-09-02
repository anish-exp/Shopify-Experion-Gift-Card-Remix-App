import { authenticate } from "../shopify.server";
import { ShopifyClient } from "../utils/client";
import {
  METAFIELD_DEFINITION_QUERY,
  METAFIELD_DEFINITION_CREATE,
  METAFIELD_DEFINITION_PIN,
  GIFT_CARD_CODE_CREATE_MUTATION,
  METAFIELDS_SET_MUTATION
} from "../utils/graphql";

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

    const NAMESPACE = "physical_gift_card";
    const KEY = "codes";
    const OWNER_TYPE = "ORDER";

    // Check if metafield definition exists
    const definitionRes = await clientQuery(client, METAFIELD_DEFINITION_QUERY, {
      namespace: NAMESPACE,
      key: KEY,
      ownerType: OWNER_TYPE,
    });

    const existingDefinitions = definitionRes?.metafieldDefinitions?.nodes || [];
    let definitionId = existingDefinitions[0]?.id;

    if (existingDefinitions.length === 0) {
      // Create the metafield definition if it does not exist
      const definition = {
        name: "Physical Gift Cards",
        namespace: NAMESPACE,
        key: KEY,
        description: "List of gift card codes for physical gift cards in this order.",
        type: "list.single_line_text_field",
        ownerType: OWNER_TYPE
      };

      const createMetafieldRes = await clientQuery(client, METAFIELD_DEFINITION_CREATE, { definition });

      if (createMetafieldRes?.metafieldDefinitionCreate?.userErrors?.length > 0) {
        console.error("Metafield definition creation errors:", createMetafieldRes.metafieldDefinitionCreate.userErrors);
        return new Response("Failed to create metafield definition");
      }

      definitionId = createMetafieldRes?.metafieldDefinitionCreate?.createdDefinition?.id;

      // Pin the metafield definition
      if (definitionId) {
        const pinMetafieldRes = await clientQuery(client, METAFIELD_DEFINITION_PIN, { definitionId });
        if (pinMetafieldRes?.metafieldDefinitionPin?.userErrors?.length > 0) {
          console.error("Metafield definition pin errors:", pinMetafieldRes.metafieldDefinitionPin.userErrors);
          return new Response("Failed to pin metafield definition");
        }
      }
    }

    // Find all physical gift card line items with properties _type = physical
    const physicalGiftCards = payload.line_items.filter(item =>
      Array.isArray(item.properties) &&
      item.properties.some(prop => prop.name === "_type" && prop.value === "physical")
    );

    if (physicalGiftCards.length === 0) {
      return new Response();
    }

    const orderId = payload.admin_graphql_api_id;
    const orderNumber = payload.name;
    const giftCardCodes = [];

    // Create gift cards code
    for (const item of physicalGiftCards) {
      const amount = parseFloat(item.price);
      const input = {
        initialValue: amount,
        note: `Physical gift card for order ${orderNumber}`
      };

      const response = await clientQuery(client, GIFT_CARD_CODE_CREATE_MUTATION, { input });

      if (response?.giftCardCreate?.giftCard) {
        giftCardCodes.push(response.giftCardCreate?.giftCard?.lastCharacters);
      }
    }

    // Storing gift card codes as order metafield
    if (giftCardCodes.length > 0) {
      const metafields = [
        {
          ownerId: orderId,
          namespace: NAMESPACE,
          key: KEY,
          type: "list.single_line_text_field",
          value: JSON.stringify(giftCardCodes)
        }
      ];

      const setRes = await clientQuery(client, METAFIELDS_SET_MUTATION, { metafields });

      if (setRes?.metafieldsSet?.userErrors?.length > 0) {
        console.error("Metafield set errors:", setRes.metafieldsSet.userErrors);
        return new Response("Failed to set metafield");
      }
    }

    return new Response();
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response("Internal server error");
  }
};