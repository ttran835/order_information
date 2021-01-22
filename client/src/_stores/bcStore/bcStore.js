import getOrders from '../../_requests/getOrders';
import createStore from '../createStore';

// const setInitialState = async () => {
//   const orders = await getOrders();
//   return { orders };
// };
// const initialState = setInitialState();

const initialState = {
  orders: [{ text: 'order 1' }, { text: 'order 2' }, { text: 'order 3' }, { text: 'order 4' }],
};

const orderApi = ({ state, setState }) => {
  const onClickAction = () => console.log('Hello there, from your oder');
  return { onClickAction, state };
};

const [OrderStoreProvider, useOrderApi] = createStore(orderApi, initialState);

export { OrderStoreProvider, useOrderApi };
