import React from 'react';

import { ServiceProvider, ApplicationEvents } from '@luminix/support';
import { App, AppFacade, AppConfiguration, Route } from '@luminix/core';


import Fallback from './Fallback';

import { RouteObject, RouterProvider, RouterProviderProps, createBrowserRouter } from 'react-router-dom';
import LuminixContext, { LuminixContextState, luminixInitialState } from '../contexts/LuminixContext';
import ReactServiceProvider from '../ReactServiceProvider';

interface DOMRouterOpts {
    basename?: string;
    window?: Window;
}

declare module '@luminix/core' {
    interface RouteReducers {
        domRouterOptions(options: DOMRouterOpts): DOMRouterOpts;
    }
}

export type LuminixProviderProps = Omit<RouterProviderProps, "router"> & {
    routes: (app: AppFacade) => RouteObject[],
    config?: AppConfiguration,
    onInit?: ApplicationEvents['init'],
    onBooting?: ApplicationEvents['booting'],
    onBooted?: ApplicationEvents['booted'],
    onReady?: ApplicationEvents['ready'],
    onFlushing?: ApplicationEvents['flushing'],
    onFlushed?: ApplicationEvents['flushed'],
    providers?: (typeof ServiceProvider)[],
    fallbackElement?: React.ReactElement,
};

const LuminixProvider: React.FunctionComponent<LuminixProviderProps> = ({
    routes, config, providers,
    onInit, onBooting, onBooted, onFlushing,
    onFlushed, onReady, fallbackElement = <Fallback />,
    ...props
}) => {

    const [state, setState] = React.useState<LuminixContextState>(luminixInitialState);

    React.useEffect(() => {

        const app = App.withProviders([
            ReactServiceProvider,
            ...(providers || []),
        ]);

        if (config) {
            app.withConfiguration(config);
        }

        if (onInit) {
            app.on('init', onInit);
        }

        if (onBooting) {
            app.on('booting', onBooting);
        }

        if (onBooted) {
            app.on('booted', onBooted);
        }

        if (onReady) {
            app.on('ready', onReady);
        }

        if (onFlushing) {
            app.on('flushing', onFlushing);
        }

        if (onFlushed) {
            app.on('flushed', onFlushed);
        }

        app.on('ready', () => {
            const options = Route.domRouterOptions({});

            setState({
                booted: true,
                router: createBrowserRouter(routes(app), options)
            });
        });

        app.create();

        return () => {
            app.down();
        };
    }, [config, onBooted, onBooting, onFlushed, onFlushing, onInit, onReady, providers, routes]);

    return (
        <LuminixContext.Provider value={state}>
            {state.router
                ? (
                    <RouterProvider
                        router={state.router}
                        // react-router 6 shows it while the router initializes; 7 dropped the prop
                        {...{ fallbackElement }}
                        {...props}
                    />
                )
                : fallbackElement}
        </LuminixContext.Provider>
    );
};


export default LuminixProvider;

