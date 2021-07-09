import { EntityMap, JovoRequest, JovoRequestType } from '@jovotech/framework';
import { UnknownObject } from '@jovotech/framework/src';
import { Context, Request, RequestBodyText } from './interfaces';

export class CorePlatformRequest extends JovoRequest {
  version?: string;
  type?: 'jovo-platform-core' | string;
  request?: Request;
  context?: Context;

  getEntities(): EntityMap | undefined {
    return this.request?.nlu?.inputs;
  }

  getIntentName(): string | undefined {
    return this.request?.nlu?.intent;
  }

  getLocale(): string | undefined {
    return this.request?.locale;
  }

  getRawText(): string | undefined {
    return (this.request?.body as RequestBodyText | undefined)?.text;
  }

  getRequestType(): JovoRequestType | undefined {
    return this.request?.type ? { type: this.request.type } : undefined;
  }

  getSessionData(): UnknownObject | undefined {
    return this.context?.session?.data;
  }

  getSessionId(): string | undefined {
    return this.context?.session?.id;
  }

  isNewSession(): boolean | undefined {
    return this.context?.session?.new;
  }
}
