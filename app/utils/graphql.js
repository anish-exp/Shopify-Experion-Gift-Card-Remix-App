export const SHOP_SETTINGS_QUERY = `#graphql
  query {
    shop {
      id
      currencyCode
      metafields(namespace: "gift_card_settings", first: 20) {
        edges {
          node {
            key
            value
          }
        }
      }
    }
  }
`;

export const METAFIELDS_SET_MUTATION = `#graphql
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { message }
    }
  }
`;

export const GET_PRODUCT_WITH_VARIANTS = `#graphql
  query GetProductWithVariants($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      tags
      variants(first: 100) {
        edges {
          node {
            id
            sku
            price
          }
        }
      }
      options {
        id
        name
        position
        values
      }
      media(first: 1, query: "media_type:IMAGE") {
        nodes {
          ... on MediaImage {
            id
            preview {
              image {
                url
              }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_GIFTCARD_PRODUCT_WITH_METAFIELD = `#graphql
  mutation CreateGiftCardProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        status
        tags
        metafields(namespace: "seo", first: 1) {
          edges {
            node {
              id
              key
              value
            }
          }
        }
        options {
          id
          name
          position
          optionValues {
            id
            name
            hasVariants
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              price
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const BULK_UPDATE_VARIANTS = `#graphql
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      productVariants {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const BULK_CREATE_VARIANTS = `#graphql
  mutation BulkCreateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
        selectedOptions {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_IMAGE_SET_MUTATION = `#graphql
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
        id
        media(first: 5) {
          nodes {
            ... on MediaImage {
              id
              preview {
                image {
                  url
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const METAFIELD_DEFINITION_QUERY = `#graphql
  query metafieldDefinitions($namespace: String!, $key: String!, $ownerType: MetafieldOwnerType!) {
    metafieldDefinitions(first: 1, namespace: $namespace, key: $key, ownerType: $ownerType) {
      nodes {
        id
        name
        namespace
        key
        type { name }
      }
    }
  }
`;

export const METAFIELD_DEFINITION_CREATE = `#graphql
  mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        namespace
        key
        type { name }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export const METAFIELD_DEFINITION_PIN = `#graphql
  mutation metafieldDefinitionPin($definitionId: ID!) {
    metafieldDefinitionPin(definitionId: $definitionId) {
      pinnedDefinition {
        id
        name
        key
        namespace
        pinnedPosition
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GIFT_CARD_CODE_CREATE_MUTATION = `#graphql
  mutation giftCardCreate($input: GiftCardCreateInput!) {
    giftCardCreate(input: $input) {
      giftCard {
        id
        lastCharacters
        initialValue {
          amount
          currencyCode
        }
        note
      }
      userErrors {
        message
        field
        code
      }
    }
  }
`;