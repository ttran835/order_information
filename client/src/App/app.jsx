import React from 'react';
import SampleContainer from '../container/SampleContainer';
import { OrderStoreProvider } from '../_stores/bcStore/bcStore';

export default function App() {
  return (
    <OrderStoreProvider>
      <SampleContainer />
    </OrderStoreProvider>
  );
}
