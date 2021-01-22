import React from 'react';
import PropTypes from 'prop-types';

export default function Sample({ orders, onClick }) {
  return orders.map(({ text }, i) => (
    <div onClick={onClick} key={i}>
      {text}
    </div>
  ));
}

Sample.defaultProps = {
  orders: [],
};

Sample.propTypes = {
  orders: PropTypes.array,
};
