import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { WA_WINDOW } from '@ng-web-apis/common';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const ssrWindowMock = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'matchMedia') {
        return () => ({
          matches: false,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
          addListener: () => {},
          removeListener: () => {},
          media: '',
          onchange: null,
        });
      }
      if (prop === 'localStorage' || prop === 'sessionStorage') {
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          length: 0,
          key: () => null,
        };
      }
      return undefined;
    },
  },
);

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: WA_WINDOW, useValue: ssrWindowMock },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
