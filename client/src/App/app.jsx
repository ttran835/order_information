import React from 'react';
// import SampleContainer from '../container/SampleContainer';
import Main from '../components/Main';
import { OrderStoreProvider } from '../_stores/bcStore/bcStore';

export default function App() {
  return (
    <OrderStoreProvider>
      <Main />
    </OrderStoreProvider>
  );
}
