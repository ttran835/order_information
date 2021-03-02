const headers = (order) => {
  const {
    id: invoice_number,
    customer_id,
    date_created,
    date_shipped,
    subtotal_ex_tax,
    subtotal_inc_tax,
    subtotal_tax,
    coupon_discount,
    total_ex_tax,
    total_inc_tax,
    total_tax,
    status,
    refunded_amount,
    billing_address: { first_name, last_name, street_1, street_2, city, state, zip, phone },
  } = order;

  // Assuming only street_2 and phone have a possibility of being empty
  const customer_name = `${first_name} ${last_name}`;
  const customer_address = `${street_1}, ${street_2 || ''}, ${city}, ${state}, ${zip}`;
  const customer_number = phone || '';

  return {
    invoice_number,
    customer_id,
    customer_name,
    customer_number,
    customer_address,
    date_created,
    date_shipped,
    subtotal_ex_tax,
    subtotal_inc_tax,
    subtotal_tax,
    coupon_discount,
    total_ex_tax,
    total_inc_tax,
    total_tax,
    status,
    refunded_amount,
  };
};

module.exports = headers;
