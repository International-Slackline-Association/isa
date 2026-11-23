import { createContext, useContext } from 'react';

// How much of the page's left edge the floating panel covers, in px; 0 on phones.
export const PanelInsetContext = createContext(0);

export const usePanelInset = () => useContext(PanelInsetContext);
