import http from 'http';
import { LiveUpdate } from './types';
declare const app: import("express-serve-static-core").Express;
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
declare function broadcastLiveUpdate(update: LiveUpdate): void;
export { app, server, broadcastLiveUpdate };
//# sourceMappingURL=index.d.ts.map