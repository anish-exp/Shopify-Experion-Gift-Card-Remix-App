// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  let physicalGiftcardQty = 0;
  let giftboxQty = 0;
  let physicalGiftcardName = '';
  let giftboxName = '';

  for (const line of input.cart.lines) {
    let productTitle = '';
    let variantTitle = '';
    if (line.merchandise?.__typename === "ProductVariant") {
      variantTitle = line.merchandise.title ?? '';
      productTitle = (line.merchandise.product && line.merchandise.product.title) ?? '';
    }

    if (line.type && line.type.value === "physical") {
      physicalGiftcardQty += line.quantity;
      if (!physicalGiftcardName) {
        physicalGiftcardName = productTitle || variantTitle || 'Physical Gift Card';
      }
    }
    if (line.giftbox && line.giftbox.value === "true") {
      giftboxQty += line.quantity;
      if (!giftboxName) {
        giftboxName = productTitle || variantTitle || 'Gift Hamper';
      }
    }
  }

  const errors = [];
  if (giftboxQty > physicalGiftcardQty) {
    errors.push({
      localizedMessage: `The quantity of "${giftboxName}" cannot exceed the quantity of "${physicalGiftcardName}"`,
      target: "cart",
    });
  }

  return { errors };
}