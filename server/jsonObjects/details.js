const details = (orderProduct, date_created, date_shipped) => {
  const {
    id: invoice_number,
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
  } = orderProduct;

  return {
    invoice_number,
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
    discount,
  };
};

module.exports = { details };
