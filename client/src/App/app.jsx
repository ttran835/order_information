import React from 'react';
import Main from '../components/Main';
import { OrderStoreProvider } from '../_stores/bcStore/bcStore';
import Workers from '../components/Workers';

export default function App() {
  return (
    <>
      <OrderStoreProvider>
        <Main />
      </OrderStoreProvider>
      <div style={{ marginTop: '25px' }}>
        <Workers />
      </div>
    </>
  );
}
