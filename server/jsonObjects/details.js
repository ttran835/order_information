const { getDateWithZeroUTCOffest } = require('../helpers');

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

  // Convert dates to local time from UTC
  const convertedDateCreated = date_created ? getDateWithZeroUTCOffest(new Date(date_created)) : '';
  const convertedDateShipped = date_shipped ? getDateWithZeroUTCOffest(new Date(date_shipped)) : '';

  const discount = applied_discounts.reduce((acc, { amount }) => {
    acc += +amount;
    return acc;
  }, 0);

  const totalExTaxWithDiscount = total_ex_tax - discount;
  const totalIncTaxWithDiscount = total_inc_tax - discount;

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
