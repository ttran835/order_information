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
  } = orderProduct;

  // Convert dates to local time from and RFC2822
  const convertedDateCreated = date_created ? convertToRFC2822(date_created) : '';
  const convertedDateShipped = date_shipped ? convertToRFC2822(date_shipped) : '';

  const discount = applied_discounts.reduce((acc, { amount }) => {
    acc += +amount;
    return acc;
  }, 0);

  const totalExTaxWithDiscount = (+total_ex_tax - discount).toFixed(2);
  // If refunded, the total_inc_tax is already accounted for from the refund orders
  // api in the controller
  const totalIncTaxWithDiscount = is_refunded
    ? total_inc_tax
    : (+totalExTaxWithDiscount + +total_tax).toFixed(2);

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
    total_ex_tax: is_refunded ? totalExTaxWithDiscount * -1 : totalExTaxWithDiscount,
    total_inc_tax: is_refunded ? totalIncTaxWithDiscount * -1 : totalIncTaxWithDiscount,
    total_tax: is_refunded ? total_tax * -1 : total_tax,
    discount: is_refunded ? discount * -1 : discount,
  };
};

module.exports = details;
