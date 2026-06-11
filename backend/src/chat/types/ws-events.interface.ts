import { MessagePayload } from '../../common/mappers/message.mapper';

export interface SyncProgressPayload {
  chatForkId: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  fetched?: number;
  saved?: number;
  error?: string;
}

export interface WsEvents {
  'message:new': MessagePayload;
  'message:updated': MessagePayload;
  'sync:progress': SyncProgressPayload;
}
