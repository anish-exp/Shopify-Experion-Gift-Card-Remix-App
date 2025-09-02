import { ShopifyClient } from "../utils/client";
import { createResponseHelpers } from "../utils/response";
import shopify from "../shopify.server";
import {
    CREATE_GIFTCARD_PRODUCT_WITH_METAFIELD,
    BULK_UPDATE_VARIANTS,
    BULK_CREATE_VARIANTS,
    GET_PRODUCT_WITH_VARIANTS,
    SHOP_SETTINGS_QUERY,
    PRODUCT_IMAGE_SET_MUTATION
} from "../utils/graphql";
import { verifyShopifyProxyRequest, getAccessTokenByShop } from "../utils/helper";

const allowedTypes = ["digital", "physical"];

const getPriceBucket = (price) => {
    const num = Number(price);
    const min = Math.floor(num / 100) * 100;
    const max = min + 99;
    const priceStr = num.toFixed(2);
    return { min, max, priceStr };
};

const clientQuery = async (client, query, variables) => {
    try {
        return await client.query({ query, variables });
    } catch (error) {
        console.error("[Shopify Query Error]:", error);
        throw error;
    }
};

export const loader = async ({ request }) => {
    const url = new URL(request.url);
    const storeDomain = url.searchParams.get("shop");
    const { jsonResponse, errorResponse } = createResponseHelpers(storeDomain);

    if (!storeDomain)
        return errorResponse(new Error("Missing required parameters"), 400);

    if (request.method === "OPTIONS") return jsonResponse(200);
    if (request.method === "GET")
        return jsonResponse(200, { message: "API Proxy ready for POST" });
    return jsonResponse(405);
};

export const action = async ({ request }) => {
    const url = new URL(request.url);
    const storeDomain = url.searchParams.get("shop");
    const { jsonResponse, errorResponse } = createResponseHelpers(storeDomain);

    if (!storeDomain)
        return errorResponse(new Error("Missing required parameters"), 400);

    try {
        const secret = process.env.SHOPIFY_API_SECRET; // Client secret of the app obtained from partner portal
        if (!secret)
            return errorResponse(new Error("Missing Shopify API secret"), 500);

        const accessToken = await getAccessTokenByShop(shopify, storeDomain);
        if (!accessToken)
            return errorResponse(new Error("No access token found for this shop"), 401);

        const client = new ShopifyClient(accessToken, storeDomain);

        if (!verifyShopifyProxyRequest(url, secret))
            return errorResponse(new Error("Unauthorized request"), 403);

        const { amount, type, productTitle, productHandle } = await request.json();

        if (!amount || !allowedTypes.includes(type) || !productTitle || !productHandle)
            return errorResponse(new Error("Invalid gift card input"), 400);

        const settingsRes = await clientQuery(client, SHOP_SETTINGS_QUERY);
        const metafields = settingsRes?.shop?.metafields?.edges || [];

        const metaMap = Object.fromEntries(
            metafields.map(edge => [edge.node.key, edge.node.value])
        );

        const minPrice = parseInt(metaMap["min_price"] ?? "1", 10);
        const maxPrice = parseInt(metaMap["max_price"] ?? "1000", 10);

        const amountNum = Number(amount);
        if (amountNum < minPrice || amountNum > maxPrice) {
            return errorResponse(
                new Error(`Amount must be between ${minPrice} and ${maxPrice}`),
                400
            );
        }

        const { min, max, priceStr } = getPriceBucket(amount);
        const isPhysical = type === "physical";
        const handle = `${isPhysical ? "exp-giftcard-physical" : "exp-giftcard-digital"}-${productHandle}-${min}-${max}`;
        const sku = `${isPhysical ? "GIFT-PHYSICAL" : "GIFT-DIGITAL"}-${priceStr.replace(".", "-")}`;

        const productRes = await clientQuery(client, GET_PRODUCT_WITH_VARIANTS, {
            handle,
        });

        const product = productRes?.productByHandle;

        // If product doesn't exist, create it with seo.hidden product metafield
        if (!product) {
            // Get the default gift card product by handle
            const giftCardProductRes = await clientQuery(client, GET_PRODUCT_WITH_VARIANTS, { handle: productHandle });
            const giftCardProduct = giftCardProductRes?.productByHandle;
            const giftCardImageId = giftCardProduct?.media?.nodes?.[0]?.id;

            const createRes = await clientQuery(client, CREATE_GIFTCARD_PRODUCT_WITH_METAFIELD, {
                input: {
                    title: productTitle,
                    handle,
                    productType: "exp gift card",
                    giftCard: !isPhysical,
                    status: "ACTIVE",
                    published: true,
                    metafields: [{
                        namespace: "seo",
                        key: "hidden",
                        value: "1",
                        type: "number_integer"
                    }],
                    productOptions: [{
                        name: "Denominations",
                        position: 1,
                        values: [{ name: priceStr }],
                    }],
                },
            });

            const createdProduct = createRes?.productCreate?.product;
            console.log("Created metafield:", createdProduct?.metafields?.edges?.[0]?.node);
            const creationErrors = createRes?.productCreate?.userErrors || [];

            if (!createdProduct || creationErrors.length > 0) {
                return errorResponse(
                    new Error("Failed to create product"),
                    500,
                    creationErrors
                );
            }

            // Add the actual gift card image to the new gift card product
            if (giftCardImageId) {
                await clientQuery(client, PRODUCT_IMAGE_SET_MUTATION, {
                    input: {
                        id: createdProduct.id,
                        files: [{ id: giftCardImageId }]
                    }
                });
            }

            const variantId = createdProduct?.variants?.edges?.[0]?.node?.id;

            await clientQuery(client, BULK_UPDATE_VARIANTS, {
                productId: createdProduct.id,
                variants: [{
                    id: variantId,
                    price: priceStr,
                    inventoryItem: {
                        sku,
                        tracked: false,
                    },
                }],
            });

            return jsonResponse(201, {
                variant: { id: variantId, price: priceStr },
                created: true,
                message: "Gift card created successfully",
            });
        }

        // Product exists, check for existing variant with same SKU
        const variant = product?.variants?.edges?.find(
            (v) => v.node.sku === sku
        )?.node;

        if (variant) {
            return jsonResponse(200, {
                variant: { id: variant.id, price: variant.price },
                created: false,
                message: "Existing gift card variant found",
            });
        }

        // Variant doesn't exist — create a new one
        const option = product.options?.[0];
        if (!option) {
            return errorResponse(
                new Error("Product has no options to assign variant"),
                400
            );
        }

        const createVariantRes = await clientQuery(client, BULK_CREATE_VARIANTS, {
            productId: product.id,
            variants: [{
                price: priceStr,
                optionValues: [{ name: priceStr, optionId: option.id }],
                inventoryItem: {
                    sku,
                    tracked: false,
                },
                inventoryQuantities: [],
            }],
        });

        const newVariant =
            createVariantRes?.productVariantsBulkCreate?.productVariants?.[0];
        const userErrors =
            createVariantRes?.productVariantsBulkCreate?.userErrors || [];

        if (!newVariant || userErrors.length > 0) {
            return errorResponse(
                new Error("Failed to create variant"),
                400,
                userErrors
            );
        }

        return jsonResponse(201, {
            variant: { id: newVariant.id, price: priceStr },
            created: true,
            message: "Gift card variant created successfully",
        });
    } catch (error) {
        console.error("[action] Unhandled error:", error);
        return errorResponse(error, 500);
    }
};