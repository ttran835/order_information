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

  // Get rid of +0000 for dates
  const [date_created_no_zeros] = date_created.split(' +0000');
  const [date_shipped_no_zeros] = date_shipped.split(' +0000');

  const discount = applied_discounts.reduce((acc, { amount }) => {
    acc += +amount;
    return acc;
  }, 0);

  return {
    invoice_number,
    date_created: date_created_no_zeros,
    date_shipped: date_shipped_no_zeros,
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
    discount,
  };
};

module.exports = details;
