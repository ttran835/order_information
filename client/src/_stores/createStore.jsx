import React, { createContext, useContext, useState, useMemo, ReactChild, useEffect } from 'react';

/**
 *
 * @param {Object} apiFactory
 * provide an argument for apiFactory
 * Api takes arguements of state & setState
 * @param {Object} initialState
 * Passes the initial state of component
 * @return {Object[]} StoreProvider (React create & useContext, useStore)
 * useStore provides us with the ability to use context values
 * This comonents use CreateContext in order to ensure that components are getting their api information
 * function useStore returns useContext to provide prop values
 * storeProvider is a react Component
 * General store creator
 */
const useApi = (apiFactory, initialState) => {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    (async () => {
      setState(await initialState);
    })();
  }, [initialState]);
  return useMemo(() => apiFactory({ state, setState }), [state, setState, apiFactory]);
};

const createStore = (apiFactory, initialState) => {
  const StoreContext = createContext();

  const StoreProvider = ({ children }) => {
    const store = useApi(apiFactory, initialState);
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
  };

  const useStore = () => {
    return useContext(StoreContext);
  };

  return [StoreProvider, useStore];
};

export default createStore;
