import React from 'react';
import { createBrowserRouter } from 'react-router-dom';


export type LuminixContextState = {
    booted: boolean,
    router: ReturnType<typeof createBrowserRouter> | null,

};

export const luminixInitialState: LuminixContextState = {
    booted: false,
    router: null,
};


const LuminixContext = React.createContext<LuminixContextState>(luminixInitialState);

export default LuminixContext;
