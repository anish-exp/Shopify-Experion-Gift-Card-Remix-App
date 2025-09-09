import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { getSetupProgress } from "../utils/helper";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { session, redirect } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const pathname = url.pathname;

  const progress = await getSetupProgress(shop);
  const isConfigComplete = progress?.isComplete || false;

  if (!isConfigComplete && pathname === "/app") {
    return redirect("/app/configuration");
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY,
    isConfigComplete,
  };
};

export default function App() {
  const { apiKey, isConfigComplete } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to={isConfigComplete ? "/app" : "/app/configuration"} rel="home">
          Home
        </Link>
        <Link to="/app/configuration">Configuration</Link>
        <Link to="/app/pricing">Pricing</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};