import {
  ActionSet,
  BaseApp,
  ErrorCode,
  ExtensibleConfig,
  HandleRequest,
  Jovo,
  JovoError,
  Platform,
  TestSuite,
} from 'jovo-core';
import _merge = require('lodash.merge');

import { BusinessMessagesBot } from './core/BusinessMessagesBot';
import { BusinessMessagesRequest } from './core/BusinessMessagesRequest';
import { BusinessMessagesRequestBuilder } from './core/BusinessMessagesRequestBuilder';
import { BusinessMessagesResponse } from './core/BusinessMessagesResponse';
import { BusinessMessagesResponseBuilder } from './core/BusinessMessagesResponseBuilder';
import { BusinessMessagesTestSuite } from './index';
import { BusinessMessagesCore } from './modules/BusinessMessagesCore';
import { Cards } from './modules/Cards';
import { ApiCallOptions, BusinessMessagesAPI } from './services/BusinessMessagesAPI';

export class BusinessMessages extends Platform<BusinessMessagesRequest, BusinessMessagesResponse> {
  static type = 'BusinessMessages';
  static appType = 'BusinessMessagesBot';

  constructor(config?: ExtensibleConfig) {
    super(config);

    if (config) {
      this.config = _merge(this.config, config);
    }

    this.actionSet = new ActionSet(
      [
        'setup',
        '$init',
        '$request',
        '$session',
        '$user',
        '$type',
        '$nlu',
        '$inputs',
        '$tts',
        '$output',
        '$response',
      ],
      this,
    );
  }

  getAppType(): string {
    return BusinessMessages.appType;
  }

  install(app: BaseApp) {
    if (!app.config.user?.sessionData) {
      app.$plugins.get('JovoUser')!.config!.sessionData = {
        data: true,
        enabled: true,
      };
    }

    app.$platform.set(this.constructor.name, this);
    app.middleware('setup')!.use(this.setup.bind(this));
    app.middleware('platform.init')!.use(this.initialize.bind(this));
    app.middleware('platform.nlu')!.use(this.nlu.bind(this));
    app.middleware('after.user.load')!.use(this.session.bind(this));
    app.middleware('tts')!.use(this.tts.bind(this));
    app.middleware('platform.output')!.use(this.output.bind(this));
    app.middleware('response')!.use(this.response.bind(this));

    this.use(new BusinessMessagesCore(), new Cards());

    Jovo.prototype.$businessMessagesBot = undefined;
    Jovo.prototype.businessMessagesBot = function () {
      if (this.constructor.name !== BusinessMessages.appType) {
        throw new JovoError(
          `Can't handle request. Please use this.isLindenbaumBot()`,
          ErrorCode.ERR_PLUGIN,
          'jovo-platform-lindenbaum',
        );
      }
      return this as BusinessMessagesBot;
    };
  }

  async initialize(handleRequest: HandleRequest) {
    handleRequest.platformClazz = BusinessMessages;
    await this.middleware('$init')!.run(handleRequest);

    if (handleRequest.jovo?.constructor.name !== BusinessMessages.appType) {
      return Promise.resolve();
    }

    await this.middleware('$request')!.run(handleRequest.jovo);
    await this.middleware('$type')!.run(handleRequest.jovo);
    await this.middleware('$session')!.run(handleRequest.jovo);

    if (this.config.handlers) {
      handleRequest.app.config.handlers = _merge(
        handleRequest.app.config.handlers,
        this.config.handlers,
      );
    }
  }

  async nlu(handleRequest: HandleRequest) {
    if (handleRequest.jovo?.constructor.name !== BusinessMessages.appType) {
      return Promise.resolve();
    }

    await this.middleware('$nlu')!.run(handleRequest.jovo);
    await this.middleware('$inputs')!.run(handleRequest.jovo);
  }

  async session(handleRequest: HandleRequest) {
    if (!handleRequest.jovo!.$session) {
      handleRequest.jovo!.$session = { $data: {} };
    }

    handleRequest.jovo!.$session.$data = { ...handleRequest.jovo!.$user.$session.$data };
  }

  async tts(handleRequest: HandleRequest) {
    if (handleRequest.jovo?.constructor.name !== BusinessMessages.appType) {
      return Promise.resolve();
    }
    await this.middleware('$tts')!.run(handleRequest.jovo);
  }

  async output(handleRequest: HandleRequest) {
    if (handleRequest.jovo?.constructor.name !== BusinessMessages.appType) {
      return Promise.resolve();
    }
    await this.middleware('$output')!.run(handleRequest.jovo);
  }

  async response(handleRequest: HandleRequest) {
    if (handleRequest.jovo?.constructor.name !== BusinessMessages.appType) {
      return Promise.resolve();
    }
    await this.middleware('$response')!.run(handleRequest.jovo);

    const options: ApiCallOptions = {
      data: (handleRequest.jovo.$response as BusinessMessagesResponse).response,
      endpoint: 'https://businessmessages.googleapis.com/v1',
      path: `/conversations/${handleRequest.jovo.$request?.getSessionId()}/messages`,
      serviceAccount: this.config.serviceAccount,
    };

    try {
      await BusinessMessagesAPI.apiCall(options);
    } catch (e) {
      Promise.reject(
        new JovoError(e.message, ErrorCode.ERR_PLUGIN, 'jovo-platform-google-business-messages')
      );
    }

    await handleRequest.host.setResponse(handleRequest.jovo.$response);
  }

  makeTestSuite(): BusinessMessagesTestSuite {
    return new TestSuite(
      new BusinessMessagesRequestBuilder(),
      new BusinessMessagesResponseBuilder(),
    );
  }
}
