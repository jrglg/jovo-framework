import { HandleRequest } from '@jovotech/framework';
import { JovoDebugger, JovoDebuggerConfig } from './JovoDebugger';

declare module '@jovotech/framework/dist/types/Extensible' {
  interface ExtensiblePluginConfig {
    JovoDebugger?: JovoDebuggerConfig;
  }

  interface ExtensiblePlugins {
    JovoDebugger?: JovoDebugger;
  }
}

declare module '@jovotech/framework/dist/types/HandleRequest' {
  interface HandleRequest {
    debuggerRequestId: number | string;
  }
}

HandleRequest.prototype.debuggerRequestId = 0;

export * from './errors/LanguageModelDirectoryNotFoundError';
export * from './errors/SocketConnectionFailedError';
export * from './errors/SocketNotConnectedError';
export * from './errors/WebhookIdNotFoundError';

export * from './DebuggerButton';
export * from './DebuggerConfig';
export * from './JovoDebugger';
