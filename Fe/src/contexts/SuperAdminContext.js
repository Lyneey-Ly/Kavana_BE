import { createContext, useContext } from 'react';

export const SuperAdminLayoutContext = createContext({ refreshTick: 0 });

export const useSuperAdminLayout = () => useContext(SuperAdminLayoutContext);