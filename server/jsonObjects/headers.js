const { convertToRFC2822 } = require('../helpers');

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
    shipping_cost_inc_tax,
    refunded_amount,
    billing_address: { first_name, last_name, street_1, street_2, city, state, zip, phone },
  } = order;

  // Assuming only street_2 and phone have a possibility of being empty
  const customer_name = `${first_name} ${last_name}`;
  const customer_address = `${street_1}, ${street_2 || ''}, ${city}, ${state}, ${zip}`;
  const customer_number = phone || '';

  // Convert dates to local time and RFC2822
  const convertedDateCreated = date_created ? convertToRFC2822(date_created) : '';
  const convertedDateShipped = date_shipped ? convertToRFC2822(date_shipped) : '';

  // Get shipping Cost
  const total_inc_tax_and_shipping = total_inc_tax;
  const new_total_ex_tax = total_ex_tax - shipping_cost_inc_tax;
  const new_total_inc_tax = total_inc_tax - shipping_cost_inc_tax;

  return {
    invoice_number,
    customer_id,
    customer_name,
    customer_number,
    customer_address,
    date_created: convertedDateCreated,
    date_shipped: convertedDateShipped,
    subtotal_ex_tax,
    subtotal_inc_tax,
    subtotal_tax,
    coupon_discount,
    total_ex_tax: new_total_ex_tax,
    total_inc_tax: new_total_inc_tax,
    total_tax,
    shipping_cost_inc_tax,
    total_inc_tax_and_shipping,
    status,
    refunded_amount,
  };
};

module.exports = headers;
