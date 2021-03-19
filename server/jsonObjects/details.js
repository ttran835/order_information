const { convertToRFC2822 } = require('../helpers');

const details = (orderProduct) => {
  const {
    order_id: invoice_number,
    date_created,
    date_shipped,
    base_total,
    id,
    is_refunded,
    name,
    price_ex_tax,
    price_inc_tax,
    price_tax,
    quantity,
    quantity_refunded,
    sku,
    total_ex_tax,
    total_inc_tax,
    total_tax,
    applied_discounts,
    // Self tacked on property to tell difference between original and refunded
    original,
  } = orderProduct;

  // Convert dates to local time from and RFC2822
  const convertedDateCreated = date_created ? convertToRFC2822(date_created) : '';
  const convertedDateShipped = date_shipped ? convertToRFC2822(date_shipped) : '';

  const discount = applied_discounts.reduce((acc, { amount }) => {
    acc += +amount;
    return acc;
  }, 0);

  // Actual refund line items
  const refundLineItem = is_refunded && !original;

  // If refunded AND not original, the total_inc_tax is already accounted for from the refund orders
  // api in the controller
  const totalExTaxWithDiscount = refundLineItem
    ? +total_inc_tax - +total_tax
    : +total_ex_tax - discount;

  const totalIncTaxWithDiscount = refundLineItem
    ? total_inc_tax
    : +totalExTaxWithDiscount + +total_tax;

  return {
    invoice_number,
    date_created: convertedDateCreated,
    date_shipped: convertedDateShipped,
    base_total,
    id,
    is_refunded,
    name,
    price_ex_tax,
    price_inc_tax,
    price_tax,
    quantity,
    quantity_refunded,
    sku,
    total_ex_tax: refundLineItem ? totalExTaxWithDiscount * -1 : totalExTaxWithDiscount,
    total_inc_tax: refundLineItem ? totalIncTaxWithDiscount * -1 : totalIncTaxWithDiscount,
    total_tax: refundLineItem ? total_tax * -1 : total_tax,
    discount: refundLineItem ? discount * -1 : discount,
  };
};

module.exports = details;
