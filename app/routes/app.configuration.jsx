import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Text,
  Button,
  InlineStack,
  BlockStack,
  Box,
  List,
  Card,
  Link,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const storeSlug = shop?.replace(".myshopify.com", "") || "";
  const redirectionUrl = `https://admin.shopify.com/store/${storeSlug}`;
  return json({ redirectionUrl });
}

export default function AppSetup() {
  const { redirectionUrl } = useLoaderData();
  const [steps, setSteps] = useState([false, false, false, false]);
  const completedSteps = steps.filter(Boolean).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleStepClick = (index) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
  };
  return (
    <Page>
      <TitleBar title="Experion Gift Cards & Hamper" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="200">
            <Text variant="headingXl" as="h1">
              Gift Card & Hamper Configuration
            </Text>
            <Text as="p" tone="subdued">
              Configure your store to enable custom gift cards and hampers with flexible amount selection
            </Text>

            {/* Custom Progress Bar */}
            <Box paddingBlockStart="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" tone="subdued" fontWeight="medium">
                  Setup {completedSteps}/4
                </Text>
                <Box style={{ flex: 1, marginLeft: 16 }}>
                  <div style={{
                    height: 8,
                    borderRadius: 50,
                    background: "#e0e0e0",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: "#404040",
                      transition: "width 0.3s"
                    }} />
                  </div>
                </Box>
              </InlineStack>
            </Box>
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <Box style={{ marginBlockStart: '1.5rem' }}>
            <BlockStack gap="400">
              {/* Theme Integration */}
              <InlineStack align="start" blockAlign="start" wrap={false} gap="500">
                <Box width="30%">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2" alignment="start">
                      Theme Integration
                    </Text>
                    <Text alignment="start" tone="subdued">
                      Enable custom gift card block on your gift card product page
                    </Text>
                  </BlockStack>
                </Box>
                <Box width="70%">
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text>To enable "Gift card + hamper picker" block on your storefront</Text>
                      <List type="number">
                        <List.Item>
                          <Text as="span" fontWeight="medium">Open Theme Editor:</Text> Click the button below to open theme editor.
                        </List.Item>
                        <List.Item>
                          <Text as="span" fontWeight="medium">Select Gift Card Product Page:</Text> In the editor, navigate to the gift card products page.
                        </List.Item>
                        <List.Item>
                          <Text as="span" fontWeight="medium">Add App Block:</Text> Insert the <Text variant="bodyMd" fontWeight="bold" as="span">Gift Card + Hamper Picker</Text> block inside the product form section.
                        </List.Item>
                      </List>

                      <InlineStack>
                        <Button url={`${redirectionUrl}/themes/current/editor?template=product`}
                          onClick={() => handleStepClick(0)}
                          target="_blank" external primary
                        >
                          Go to Blog Theme Editor
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Box>
              </InlineStack>

              {/* Product Classification */}
              <InlineStack align="start" blockAlign="start" wrap={false} gap="500">
                <Box width="30%">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2" alignment="start">
                      Product Types
                    </Text>
                    <Text alignment="start" tone="subdued">
                      Set product types so as to detect gift cards and hampers correctly
                    </Text>
                  </BlockStack>
                </Box>
                <Box width="70%">
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text>Assign correct product types to enable gift card and hamper features</Text>
                      <List>
                        <List.Item>
                          <Text as="span" fontWeight="medium">For gift card products:</Text> Set product type to <Text variant="bodyMd" fontWeight="bold" as="span">"giftcard"</Text> to display the block only on gift card pages.
                        </List.Item>
                        <List.Item>
                          <Text as="span" fontWeight="medium">For hamper products:</Text> Set product type to <Text variant="bodyMd" fontWeight="bold" as="span">"exp gift hamper"</Text> to identify gift hamper items.
                        </List.Item>
                      </List>

                      <Box>
                        <BlockStack gap="150">
                          <Text as="p" tone="subdued">
                            <Text as="span" fontWeight="medium">Note:</Text> Gift card products you create in the Shopify admin should use the product type <Text as="span" fontWeight="bold">"giftcard"</Text>.
                          </Text>
                          <Text as="p" tone="subdued">
                            Gift card product created by this app (for custom amounts) will automatically use the product type <Text as="span" fontWeight="bold">"exp gift card"</Text>.
                          </Text>
                          <Text as="p" tone="subdued">
                            For details on how to create a gift card product in Shopify, see{" "}
                            <Link url="https://help.shopify.com/en/manual/products/gift-card-products/add-update-gift-card-products#add-a-gift-card-product" target="_blank">
                              Shopify Gift Card Products Guide
                            </Link>.
                          </Text>
                        </BlockStack>
                      </Box>

                      <InlineStack>
                        <Button url={`${redirectionUrl}/products`}
                          onClick={() => handleStepClick(1)}
                          target="_blank" external primary
                        >
                          Manage Products
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Box>
              </InlineStack>

              {/* Checkout Rules */}
              <InlineStack align="start" blockAlign="start" wrap={false} gap="500">
                <Box width="30%">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2" alignment="start">
                      Checkout Validation
                    </Text>
                    <Text alignment="start" tone="subdued">
                      Configure checkout rule to restrict hamper quantity at checkout
                    </Text>
                  </BlockStack>
                </Box>
                <Box width="70%">
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text>
                        Set up checkout rule to ensure hampers dosen't exceeds gift card quantity at cart and checkout
                      </Text>
                      <List type="number">
                        <List.Item>
                          <Text as="span"> Navigate to <Text variant="bodyMd" fontWeight="medium" as="span">Settings &gt; Checkout</Text> using the button below.</Text>
                        </List.Item>
                        <List.Item>
                          <Text as="span">Under <Text variant="bodyMd" fontWeight="medium" as="span">Rules</Text> section, enable and configure the <Text variant="bodyMd" fontWeight="bold" as="span">Gift Hamper Quantity Validation</Text> rule as needed.</Text>
                        </List.Item>
                      </List>

                      <InlineStack>
                        <Button url={`${redirectionUrl}/settings/checkout`}
                          onClick={() => handleStepClick(2)}
                          target="_blank" external primary
                        >
                          Configure Checkout Rule
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Box>
              </InlineStack>

              {/* Collection Filtering */}
              <InlineStack align="start" blockAlign="start" wrap={false} gap="500">
                <Box width="30%">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2" alignment="start">
                      Collection Rules
                    </Text>
                    <Text alignment="start" tone="subdued">
                      Create smart collection to exclude gift card and gift hamper products
                    </Text>
                  </BlockStack>
                </Box>
                <Box width="70%">
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text>
                        <Text as="span" fontWeight="medium">Create a smart collection: </Text>
                        Set the <Text as="span" fontWeight="bold">handle</Text> to <Text variant="bodyMd" fontWeight="bold" as="span">"all"</Text> and set the rules to <Text as="span" fontWeight="bold">match all conditions</Text>
                      </Text>
                      <List>
                        <List.Item>
                          Product type <Text as="span" fontWeight="bold">does not equal</Text> to <Text as="span" fontWeight="bold">"exp gift card"</Text>
                        </List.Item>
                        <List.Item>
                          Product type <Text as="span" fontWeight="bold">does not equal</Text> to <Text as="span" fontWeight="bold">"exp gift hamper"</Text>
                        </List.Item>
                      </List>
                      <Text as="p" tone="subdued">
                        <Text as="span" fontWeight="medium">Note:</Text> This smart collection ensures that extra gift card products created by the app and gift hamper products are excluded from regular storefront listings.
                      </Text>
                      <Text as="p" tone="subdued">
                        Always use this collection instead of “All Products,” since the extra gift card products created by app are not meant for direct display and hampers can only be purchased together with a gift card.
                      </Text>

                      <InlineStack>
                        <Button url={`${redirectionUrl}/collections`}
                          onClick={() => handleStepClick(3)}
                          target="_blank" external primary
                        >
                          Setup Collections
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Box>
              </InlineStack>
            </BlockStack>
          </Box>
        </Layout.Section>

        <Layout.Section>
          <Box paddingBlockStart="200" paddingBlockEnd="800">
            <Card>
              <BlockStack gap="300" align="center">
                <Text variant="headingMd" as="h2" alignment="center">
                  Need assistance?
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  If you face any issues with the configuration, our team is here to help.
                </Text>
                <InlineStack align="center">
                  <Button url="mailto:anish.s@experionglobal.com" target="_blank" external primary>
                    Contact Support
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}