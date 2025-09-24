import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  Divider,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Box,
  Thumbnail,
  EmptyState,
  Checkbox,
  Tooltip,
  Icon
} from "@shopify/polaris";
import { ToggleOffIcon, ToggleOnIcon, InfoIcon } from '@shopify/polaris-icons';
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";
import { useState, useEffect } from "react";
import { METAFIELDS_SET_MUTATION, SHOP_SETTINGS_QUERY } from "../utils/graphql";

export const loader = async ({ request }) => {
  const { admin, billing } = await authenticate.admin(request);

  const settingsResponse = await admin.graphql(SHOP_SETTINGS_QUERY);

  const settingsData = await settingsResponse.json();
  const metafields = settingsData.data?.shop?.metafields?.edges || [];

  const settings = {
    enabled: false,
    digital_enabled: false,
    physical_enabled: false,
    physical_giftbox_enabled: false,
    custom_amount_enabled: false,
    min_price: "1",
    max_price: "1000",
    selected_product: null,
  };

  metafields.forEach(({ node }) => {
    if (node.key === "enabled") settings.enabled = node.value === "true";
    if (node.key === "digital_enabled") settings.digital_enabled = node.value === "true";
    if (node.key === "physical_enabled") settings.physical_enabled = node.value === "true";
    if (node.key === "physical_giftbox_enabled") settings.physical_giftbox_enabled = node.value === "true";
    if (node.key === "custom_amount_enabled") settings.custom_amount_enabled = node.value === "true";
    if (node.key === "min_price") settings.min_price = node.value;
    if (node.key === "max_price") settings.max_price = node.value;
    if (node.key === "selected_product") {
      try {
        settings.selected_product = JSON.parse(node.value);
      } catch (e) {
        settings.selected_product = null;
      }
    }
  });

  // Check current billing plan
  let planName = "Basic Plan";
  try {
    const billingCheck = await billing.check({
      plans: [MONTHLY_PLAN, ANNUAL_PLAN],
      isTest: process.env.NODE_ENV !== "production",
    });
    if (billingCheck?.appSubscriptions?.length > 0) {
      planName = billingCheck.appSubscriptions[0].name;
    }
  } catch (e) {
    planName = "Basic Plan";
  }

  return json({
    shopId: settingsData.data.shop.id,
    currencyCode: settingsData.data.shop.currencyCode,
    settings,
    planName
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  if (!admin) return json({ success: false, error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "saveSettings") {
    const enabled = formData.get("enabled");
    const digitalEnabled = formData.get("digitalEnabled");
    const physicalEnabled = formData.get("physicalEnabled");
    const physicalGiftboxEnabled = formData.get("physicalGiftboxEnabled");
    const customAmountEnabled = formData.get("customAmountEnabled");
    const minAmount = formData.get("minAmount");
    const maxAmount = formData.get("maxAmount");
    const selectedProduct = formData.get("selectedProduct");
    const shopId = formData.get("shopId");

    const minAmountNum = parseInt(minAmount, 10);
    const maxAmountNum = parseInt(maxAmount, 10);

    if (isNaN(minAmountNum) || isNaN(maxAmountNum) || minAmountNum >= maxAmountNum) {
      return json({ success: false, error: "Invalid input values" }, { status: 400 });
    }

    if (minAmountNum < 1 || maxAmountNum < 1) {
      return json({ success: false, error: "Amounts must be positive numbers" }, { status: 400 });
    }

    try {
      // Save settings
      const metafieldsToSet = [
        {
          namespace: "gift_card_settings",
          key: "enabled",
          type: "boolean",
          value: enabled === "true" ? "true" : "false",
          ownerId: shopId,
        },
        {
          namespace: "gift_card_settings",
          key: "digital_enabled",
          type: "boolean",
          value: digitalEnabled === "true" ? "true" : "false",
          ownerId: shopId,
        },
        {
          namespace: "gift_card_settings",
          key: "physical_enabled",
          type: "boolean",
          value: physicalEnabled === "true" ? "true" : "false",
          ownerId: shopId,
        },
        {
          namespace: "gift_card_settings",
          key: "physical_giftbox_enabled",
          type: "boolean",
          value: physicalGiftboxEnabled === "true" ? "true" : "false",
          ownerId: shopId,
        },
        {
          namespace: "gift_card_settings",
          key: "custom_amount_enabled",
          type: "boolean",
          value: customAmountEnabled === "true" ? "true" : "false",
          ownerId: shopId,
        },
        {
          namespace: "gift_card_settings",
          key: "min_price",
          type: "number_integer",
          value: minAmountNum.toString(),
          ownerId: shopId,
        },
        {
          namespace: "gift_card_settings",
          key: "max_price",
          type: "number_integer",
          value: maxAmountNum.toString(),
          ownerId: shopId,
        },
      ];

      if (selectedProduct && selectedProduct !== "null") {
        metafieldsToSet.push({
          namespace: "gift_card_settings",
          key: "selected_product",
          type: "json",
          value: selectedProduct,
          ownerId: shopId,
        });
      }

      const res = await admin.graphql(METAFIELDS_SET_MUTATION, {
        variables: {
          metafields: metafieldsToSet,
        },
      });

      const resultJson = await res.json();
      const errors = resultJson.errors || resultJson.data?.metafieldsSet?.userErrors;

      if (errors?.length > 0) {
        return json({ success: false, error: "Failed to save settings", details: errors }, { status: 500 });
      }

      return json({ success: true });
    } catch (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }
  return json({ success: false, error: "Invalid action type" }, { status: 400 });
};

export default function GiftCardSettings() {
  const { settings, shopId, currencyCode, planName } = useLoaderData();
  const saveFetcher = useFetcher();
  const isPremiumPlan = planName !== "Basic Plan";

  const [minAmount, setMinAmount] = useState(settings.min_price);
  const [maxAmount, setMaxAmount] = useState(settings.max_price);
  const [selectedProduct, setSelectedProduct] = useState(settings.selected_product);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [digitalEnabled, setDigitalEnabled] = useState(settings.digital_enabled);
  const [physicalEnabled, setPhysicalEnabled] = useState(settings.physical_enabled);
  const [physicalGiftboxEnabled, setPhysicalGiftboxEnabled] = useState(settings.physical_giftbox_enabled);
  const [customAmountEnabled, setCustomAmountEnabled] = useState(settings.custom_amount_enabled);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSelectingProduct, setIsSelectingProduct] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [error, setError] = useState(null);

  // Reset hamper if on Basic Plan
  useEffect(() => {
    if (!isPremiumPlan) {
      setPhysicalGiftboxEnabled(false);
      setPendingProduct(null);
    }
  }, [isPremiumPlan]);

  useEffect(() => {
    setHasChanges(
      minAmount !== settings.min_price ||
      maxAmount !== settings.max_price ||
      enabled !== settings.enabled ||
      digitalEnabled !== settings.digital_enabled ||
      physicalEnabled !== settings.physical_enabled ||
      physicalGiftboxEnabled !== settings.physical_giftbox_enabled ||
      customAmountEnabled !== settings.custom_amount_enabled ||
      pendingProduct && pendingProduct.id !== settings.selected_product?.id
    );
  }, [
    minAmount,
    maxAmount,
    enabled,
    digitalEnabled,
    physicalEnabled,
    physicalGiftboxEnabled,
    customAmountEnabled,
    pendingProduct,
    settings
  ]);

  useEffect(() => {
    if (saveFetcher.state === "idle" && saveFetcher.data) {
      if (saveFetcher.data.success) {
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 4000);
        setHasChanges(false);
        setError(null);
        if (pendingProduct) {
          setSelectedProduct(pendingProduct);
          setPendingProduct(null);
        }
      } else {
        setError(saveFetcher.data.error || "Failed to save settings");
      }
    }
  }, [saveFetcher.state, saveFetcher.data]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(price) || 0);
  };

  const getInventoryStatus = (inventory) => {
    if (inventory === null || inventory === undefined) return null;
    if (inventory === 0) return { tone: 'critical', text: 'Out of stock' };
    if (inventory < 10) return { tone: 'warning', text: 'Low stock' };
    return { tone: 'success', text: 'In stock' };
  };

  const handleSelectProduct = async () => {
    setIsSelectingProduct(true);
    try {
      const selected = await window.shopify.resourcePicker({
        type: 'product',
        action: 'select',
        multiple: false,
        filter: {
          query: 'product_type:exp gift hamper'
        }
      });

      if (!selected || selected.length === 0) {
        setIsSelectingProduct(false);
        return;
      }

      const product = selected[0];

      // Verify tag
      if (!product.tags || !product.productType.includes('exp gift hamper')) {
        setError('Selected product must be of "exp gift hamper" type');
        setIsSelectingProduct(false);
        return;
      }

      // Just update local state
      setPendingProduct({
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: product.variants?.[0]?.price || '0',
        image: product.images?.[0]?.originalSrc || null,
        totalInventory: product.totalInventory || 0
      });
      setError(null);
    } catch (error) {
      console.error('Error selecting product:', error);
      setError(error.message);
    } finally {
      setIsSelectingProduct(false);
    }
  };

  const handleClearProduct = () => {
    setPendingProduct(null);
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append("actionType", "saveSettings");
    formData.append("minAmount", minAmount);
    formData.append("maxAmount", maxAmount);
    formData.append("enabled", enabled.toString());
    formData.append("digitalEnabled", digitalEnabled.toString());
    formData.append("physicalEnabled", physicalEnabled.toString());
    formData.append("physicalGiftboxEnabled", physicalGiftboxEnabled.toString());
    formData.append("customAmountEnabled", customAmountEnabled.toString());
    formData.append("selectedProduct", pendingProduct ? JSON.stringify(pendingProduct) : "null");
    formData.append("shopId", shopId);

    saveFetcher.submit(formData, { method: "POST" });
  };

  const isInvalidRange = parseInt(minAmount) >= parseInt(maxAmount);
  const isInvalidMinAmount = parseInt(minAmount) < 1 || minAmount === '';
  const isInvalidMaxAmount = parseInt(maxAmount) < 1 || parseInt(maxAmount) > 10000 || maxAmount === '';

  const anyTypeEnabled = digitalEnabled || physicalEnabled || physicalGiftboxEnabled;
  const displayProduct = pendingProduct || selectedProduct;

  return (
    <Page>
      <TitleBar title="Experion Gift Cards & Hamper" />
      <Layout>
        <Layout.Section>
          {showSuccessBanner && (
            <Box paddingBlockEnd="400">
              <Banner
                title="Settings saved successfully!"
                tone="success"
                onDismiss={() => setShowSuccessBanner(false)}
              />
            </Box>
          )}

          {error && (
            <Box paddingBlockEnd="400">
              <Banner
                title="Something went wrong"
                tone="critical"
                onDismiss={() => setError(null)}
              >
                {error}
              </Banner>
            </Box>
          )}

          {!isPremiumPlan && (
            <Box paddingBlockEnd="400">
              <Banner title="Upgrade to Unlock More Features" tone="warning">
                <b>Gift Hamper</b> feature is available only in Premium plans. Please upgrade to unlock this feature.
              </Banner>
            </Box>
          )}

          <Card>
            <BlockStack gap="400">
              <Box padding="400" >
                <InlineStack gap="400" align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <Text variant="headingLg" as="h1">Experion Gift Cards & Hamper</Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Checkbox
                      label=""
                      checked={enabled}
                      onChange={(value) => setEnabled(value)}
                      ariaLabel="Enable gift cards"
                    />
                    {enabled ? (
                      <Badge tone="success">Enabled</Badge>
                    ) : (
                      <Badge tone="critical">Disabled</Badge>
                    )}
                  </InlineStack>
                </InlineStack>
              </Box>

              {enabled && (
                <Box padding="400">
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">Gift Card Types</Text>

                    <InlineStack gap="400" wrap>
                      <Box minWidth="280px">
                        <Card padding="400">
                          <BlockStack gap="300">
                            <InlineStack gap="200" blockAlign="center">
                              <Checkbox
                                checked={digitalEnabled}
                                onChange={(value) => setDigitalEnabled(value)}
                                label="Digital Gift Card"
                              />
                              {digitalEnabled && <Badge tone="success">Active</Badge>}
                            </InlineStack>
                            <Text variant="bodySm" as="p" tone="subdued">
                              Sent via email instantly
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      <Box minWidth="280px">
                        <Card padding="400">
                          <BlockStack gap="300">
                            <InlineStack gap="200" blockAlign="center">
                              <Checkbox
                                checked={physicalEnabled}
                                onChange={(value) => setPhysicalEnabled(value)}
                                label="Physical Gift Card"
                              />
                              {physicalEnabled && <Badge tone="success">Active</Badge>}
                            </InlineStack>
                            <Text variant="bodySm" as="p" tone="subdued">
                              Shipped to recipient
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      <Box minWidth="280px">
                        <Card
                          padding="400"
                          background={planName === "Basic Plan" ? "bg-surface-disabled" : "bg-surface"}
                        >
                          <BlockStack gap="300">
                            <InlineStack gap="200" blockAlign="center">
                              <Checkbox
                                checked={physicalGiftboxEnabled}
                                onChange={(value) => setPhysicalGiftboxEnabled(value)}
                                label="Gift Card + Gift Hamper"
                                disabled={planName === "Basic Plan"}
                              />
                              {planName === "Basic Plan" ? (
                                <Badge tone="critical">Unavailable</Badge>
                              ) : (
                                physicalGiftboxEnabled && <Badge tone="success">Active</Badge>
                              )}
                            </InlineStack>
                            <Text variant="bodySm" as="p" tone="subdued">
                              {planName === "Basic Plan"
                                ? "Upgrade your plan to include gift hampers"
                                : "Includes selected product"}
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>
                    </InlineStack>

                    {!anyTypeEnabled && (
                      <Banner tone="warning">
                        Please enable at least one gift card type
                      </Banner>
                    )}
                  </BlockStack>
                </Box>
              )}

              {enabled && anyTypeEnabled && <Divider />}

              {enabled && anyTypeEnabled && (
                <Box padding="400">
                  <BlockStack gap="400">
                    <InlineStack blockAlign="center" align="space-between">
                      <InlineStack gap="400" blockAlign="center">
                        <Text variant="headingMd" as="h2">Custom Amount Range</Text>
                        <Button
                          icon={customAmountEnabled ? ToggleOnIcon : ToggleOffIcon}
                          onClick={() => setCustomAmountEnabled(!customAmountEnabled)}
                          variant="plain"
                        />
                        {customAmountEnabled ? (
                          <Badge tone="success">Enabled</Badge>
                        ) : (
                          <Badge tone="critical">Disabled</Badge>
                        )}
                      </InlineStack>

                      {customAmountEnabled && (
                        <Text variant="bodyLg" as="p" tone="subdued">
                          Range: <Text variant="bodyLg" as="span" tone="base" fontWeight="semibold">
                            {formatPrice(minAmount)} - {formatPrice(maxAmount)}
                          </Text>
                        </Text>
                      )}
                    </InlineStack>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Set the range of custom gift card amounts that the customers can purchase
                    </Text>

                    <InlineStack gap="400" align="start" wrap>
                      <Box minWidth="220px">
                        <TextField
                          label={
                            <InlineStack gap="100" blockAlign="center">
                              <span>Minimum amount</span>
                              <Tooltip content="The minimum amount must be less than or equal to the lowest denomination available for the gift card.">
                                <Icon source={InfoIcon} tone="base" />
                              </Tooltip>
                            </InlineStack>
                          }
                          type="number"
                          value={minAmount}
                          onChange={(value) => setMinAmount(value.replace(/\D/g, ""))}
                          min={1}
                          error={isInvalidMinAmount ? "Invalid amount" : undefined}
                          size="slim"
                          disabled={!customAmountEnabled}
                        />
                      </Box>
                      <Box minWidth="220px">
                        <TextField
                          label="Maximum amount"
                          type="number"
                          value={maxAmount}
                          onChange={(value) => setMaxAmount(value.replace(/\D/g, ""))}
                          min={1}
                          max={10000}
                          error={isInvalidMaxAmount ? "Invalid amount" : undefined}
                          size="slim"
                          disabled={!customAmountEnabled}
                        />
                      </Box>
                    </InlineStack>

                    {isInvalidRange && !isInvalidMinAmount && !isInvalidMaxAmount && (
                      <Banner tone="warning">
                        Minimum must be less than maximum
                      </Banner>
                    )}
                  </BlockStack>
                </Box>
              )}

              {enabled && planName !== "Basic Plan" && physicalGiftboxEnabled && <Divider />}

              {enabled && planName !== "Basic Plan" && physicalGiftboxEnabled && (
                <Box padding="400">
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingMd" as="h2">Gift Hamper Product</Text>
                      <InlineStack gap="200">
                        <Button
                          onClick={handleClearProduct}
                          tone="critical"
                          size="slim"
                          disabled={
                            !pendingProduct ||
                            pendingProduct?.id === settings.selected_product?.id ||
                            isSelectingProduct ||
                            saveFetcher.state === "submitting"
                          }
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleSelectProduct}
                          size="slim"
                          loading={isSelectingProduct}
                          disabled={isSelectingProduct || saveFetcher.state === "submitting"}
                        >
                          {displayProduct ? 'Change' : 'Select'}
                        </Button>
                      </InlineStack>
                    </InlineStack>

                    {displayProduct && (
                      <Text variant="bodySm" as="p" tone="subdued">
                        The selected product will be included as a gift hamper with gift cards - only products with type "<strong>exp gift hamper</strong>" will be selected
                      </Text>
                    )}

                    {!displayProduct ? (
                      <Card padding="800">
                        <EmptyState
                          heading="No gift hamper product selected"
                          action={{
                            content: 'Select Product',
                            onAction: handleSelectProduct,
                            loading: isSelectingProduct,
                            disabled: isSelectingProduct || saveFetcher.state === "submitting",
                            size: 'large',
                          }}
                          image="https://cdn.shopify.com/files/1/0757/9955/files/empty-state.svg"
                        >
                          <Text variant="bodyLg" as="p">
                            Choose a product that customers can purchase with their gift cards.
                            Make sure the product has the <strong>"exp gift hamper"</strong> product type.
                          </Text>
                        </EmptyState>
                      </Card>
                    ) : (
                      <Card padding="300" >
                        <InlineStack gap="300" blockAlign="center">
                          <Thumbnail
                            source={displayProduct.image || ""}
                            alt={displayProduct.title}
                            size="medium"
                          />
                          <BlockStack gap="100">
                            <Text variant="bodyMd" fontWeight="medium">{displayProduct.title}</Text>
                            <InlineStack gap="200" align="space-between" blockAlign="center">
                              <Text variant="bodySm" tone="subdued">
                                {formatPrice(displayProduct.price)}
                              </Text>
                              <Badge tone={getInventoryStatus(displayProduct.totalInventory)?.tone || 'subdued'}>
                                {displayProduct.totalInventory} in stock
                              </Badge>
                            </InlineStack>
                          </BlockStack>
                        </InlineStack>
                      </Card>
                    )}
                  </BlockStack>
                </Box>
              )}

              <Box padding="400">
                <InlineStack align="end">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={
                      !anyTypeEnabled ||
                      isInvalidRange ||
                      isInvalidMinAmount ||
                      isInvalidMaxAmount ||
                      !hasChanges ||
                      (isPremiumPlan && physicalGiftboxEnabled && displayProduct === null) ||
                      saveFetcher.state === "submitting" ||
                      isSelectingProduct
                    }
                    loading={saveFetcher.state === "submitting"}
                    size="medium"
                  >
                    Save Settings
                  </Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}