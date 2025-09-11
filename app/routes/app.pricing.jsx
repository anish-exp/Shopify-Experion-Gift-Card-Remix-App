import {
  Page,
  Card,
  Text,
  Button,
  BlockStack,
  Badge,
  Tooltip,
  Icon,
  Box,
  Layout,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";

const PAID_PRICING = {
  monthly: { price: "$19", period: "month" },
  annual: { price: "$190", period: "year", savings: "Save 17%" },
};

const FEATURES = [
  {
    label: "Unlimited digital & physical gift cards",
    description: "Sell as many digital and physical gift cards as you want, with no limits.",
  },
  {
    label: "Custom amount gift cards",
    description: "Let customers choose their preferred amount for every gift card purchase.",
  },
  {
    label: "Schedule sending gift cards",
    description: "Schedule gift cards to be sent at a future date for special occasions.",
  },
  {
    label: "Send gift card to a friend",
    description: "Allow customers to send gift cards directly to recipients.",
  },
  {
    label: "Basic analytics",
    description: "Track sales, issued and redeemed gift cards with basic reporting.",
  },
  {
    label: "Gift cards with hampers",
    description: "Bundle curated gift hampers with gift cards for a premium gifting experience.",
  },
  {
    label: "Priority support",
    description: "Get faster responses and dedicated support from our team on paid plans.",
  },
];

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      subtitle: "Perfect for testing the waters",
      price: "Free for 14 days",
      features: [true, true, true, true, true, false, false],
      action: "Start Free Trial",
      planId: "trial",
      isTrial: true,
      highlight: "No credit card required",
    },
    {
      name: "Professional",
      subtitle: "For growing businesses",
      price: `${PAID_PRICING.monthly.price}/month`,
      features: [true, true, true, true, true, true, true],
      action: "Choose Monthly",
      planId: "monthly",
    },
    {
      name: "Enterprise",
      subtitle: "For high-volume stores",
      price: `${PAID_PRICING.annual.price}/year`,
      features: [true, true, true, true, true, true, true],
      action: "Choose Annual",
      planId: "annual",
      highlight: PAID_PRICING.annual.savings,
    },
  ];

  const handleSelectPlan = (planId) => {
    alert(`Selected plan: ${planId}`);
  };

  return (
    <Page>
      <TitleBar title="Experion Gift Cards & Hamper" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingXl" as="h1">
              Pricing Plan
            </Text>
            <Text as="p" variant="bodyMd" alignment="center">
              Select the plan that works best for your business. The trial plan include a 14-day
              free trial with no commitment.
            </Text>
          </BlockStack>
          <InlineStack gap="400" wrap align="center" blockAlign="start">
            {plans.map((plan) => (
              <Box key={plan.planId} minWidth="280px" maxWidth="340px" flex="1">
                <Card padding="400">
                  <BlockStack gap="400">
                    {/* Title & Subtitle */}
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h2">
                        {plan.name}
                      </Text>
                      {plan.subtitle && (
                        <Text variant="bodySm" as="p" tone="subdued">
                          {plan.subtitle}
                        </Text>
                      )}
                    </BlockStack>

                    {/* Price */}
                    <Text variant="headingXl" as="p">
                      {plan.price}
                    </Text>

                    {/* Highlight badge */}
                    {plan.highlight && (
                      <Badge tone="info" size="small">
                        {plan.highlight}
                      </Badge>
                    )}

                    {/* CTA button */}
                    <Button
                      variant="primary"
                      onClick={() => handleSelectPlan(plan.planId)}
                      fullWidth
                    >
                      {plan.action}
                    </Button>

                    <Divider />

                    {/* Features */}
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">
                        Features:
                      </Text>
                      <BlockStack gap="200">
                        {FEATURES.map((feature, fIdx) => (
                          <InlineStack
                            key={fIdx}
                            gap="200"
                            blockAlign="start"
                            align="start"
                          >
                            <Icon
                              source={plan.features[fIdx] ? CheckIcon : XIcon}
                              tone={plan.features[fIdx] ? "success" : "critical"}
                            />
                            <Tooltip content={feature.description}>
                              <Text
                                as="span"
                                tone={plan.features[fIdx] ? "base" : "subdued"}
                              >
                                {feature.label}
                              </Text>
                            </Tooltip>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    </BlockStack>

                    {/* Trial note */}
                    {plan.isTrial && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Upgrade to a paid plan to unlock gift hampers and priority support
                        features.
                      </Text>
                    )}
                  </BlockStack>
                </Card>
              </Box>
            ))}
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
