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
  Banner
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

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

export async function loader({ request }) {
  const { billing } = await authenticate.admin(request);

  try {
    // Attempt to check if the shop has an active payment for any plan
    const billingCheck = await billing.require({
      plans: [MONTHLY_PLAN, ANNUAL_PLAN],
      isTest: process.env.NODE_ENV !== "production",
      onFailure: () => {
        throw new Error('No active paid plan');
      },
    });

    const subscription = billingCheck.appSubscriptions[0];
    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);
    return json({ plan: subscription });

  } catch (error) {
    if (error.message === 'No active paid plan') {
      console.log('Shop does not have any active paid plans.');
      return json({ billing, plan: { name: "Basic Plan" } });
    }
    throw error;
  }
}

export default function Pricing() {
  const { plan } = useLoaderData();
  console.log('plan', plan);

  const plans = [
    {
      name: "Basic Plan",
      subtitle: "Get started with basic features for free",
      price: "Free",
      features: [true, true, true, true, true, false, false],
      action: "Start For Free",
      url: "/app/cancel",
      planId: "free",
      isFree: true,
      highlight: "No credit card required",
    },
    {
      name: "Monthly Plan",
      subtitle: "Unlock all features with monthly billing",
      price: "$19/month",
      features: [true, true, true, true, true, true, true],
      action: "Start Monthly Plan",
      url: "/app/upgrade?plan=monthly",
      planId: "monthly",
    },
    {
      name: "Annual Plan",
      subtitle: "Save more with annual billing",
      price: "$190/year",
      features: [true, true, true, true, true, true, true],
      action: "Start Annual Plan",
      url: "/app/upgrade?plan=annual",
      planId: "annual",
      highlight: "Save 17%",
    },
  ];

  const currentPlanName = (plan?.name === "Monthly Plan" || plan?.name === "Annual Plan") ? plan.name : "Basic Plan";

  return (
    <Page>
      <TitleBar title="Experion Gift Cards & Hamper" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingXl" as="h1">
              Pricing Plans
            </Text>

            <Text as="p" variant="bodyMd" alignment="center">
              Select the plan that works best for your business. The paid plans include a 14-day free trial.
            </Text>
          </BlockStack>

          <Box paddingBlockStart="400" paddingBlockEnd="400">
            <Banner title="Your Current Subscription" tone="info">
              <InlineStack align="space-between" blockAlign="center">
                {currentPlanName === "Basic Plan" ? (
                  <Text>You're currently on the <b>Basic plan</b>. Upgrade to unlock premium features.</Text>
                ) : (
                  <Text>You're currently on the <b>{currentPlanName}</b>. All features are unlocked.</Text>
                )}
                {currentPlanName !== "Basic Plan" && (
                  <Button url="/app/cancel">Cancel plan</Button>
                )}
              </InlineStack>
            </Banner>
          </Box>

          <InlineStack gap="200" wrap={false} align="stretch">
            {plans.map((plan_item) => (
              <Box key={plan_item.planId} width="33.333%">
                <Card>
                  <BlockStack gap="200">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">                  
                        <Text variant="headingLg" as="h2">
                          {plan_item.name}
                        </Text>
                        {plan_item.highlight && (
                          <Badge tone="info" size="small">
                            {plan_item.highlight}
                          </Badge>
                        )}
                      </InlineStack>

                      {plan_item.subtitle && (
                        <Text variant="bodySm" as="p" tone="subdued">
                          {plan_item.subtitle}
                        </Text>
                      )}
                    </BlockStack>

                    <Text variant="headingXl" as="h1">
                      {plan_item.price}
                    </Text>

                    <BlockStack gap="200">
                      <Text variant="headingMd" as="h1">
                        Features:
                      </Text>
                      <BlockStack gap="300">
                        {FEATURES.map((feature, fIdx) => (
                          <InlineStack key={fIdx} gap="200">
                            <Box minWidth="20px">
                              <Icon
                                source={plan_item.features[fIdx] ? CheckIcon : XIcon}
                                tone={plan_item.features[fIdx] ? "success" : "critical"}
                              />
                            </Box>
                            <Box>
                              <Tooltip content={feature.description}>
                                <Text
                                  as="span"
                                  tone={plan_item.features[fIdx] ? "base" : "subdued"}
                                >
                                  {feature.label}
                                </Text>
                              </Tooltip>
                            </Box>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    </BlockStack>

                    <BlockStack gap="300">
                      <Divider />

                      {plan_item.name === currentPlanName ? (
                        <Button disabled>Current Plan</Button>
                      ) : (
                        <Button variant="primary" url={plan_item.url}>
                          {plan_item.action}
                        </Button>
                      )}

                      {plan_item.isFree && (
                        <Box minHeight="1.8rem">
                          <Text as="p" variant="bodySm" tone="subdued">
                            Upgrade to a paid plan to unlock gift hampers and priority support
                            features.
                          </Text>
                        </Box>
                      )}
                      {!plan_item.isFree && (
                        <Box minHeight="1.8rem" />
                      )}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Box>
            ))}
          </InlineStack>

          <Box paddingBlockStart="500">
            <Card>
              <BlockStack gap="300" align="center">
                <Text variant="headingMd" as="h2" alignment="center">
                  Need assistance?
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  If you face any issues with the pricing plan, our team is here to help.
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
