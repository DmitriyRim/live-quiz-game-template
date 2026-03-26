import { WebSocketServer } from 'ws';
import db from './db/fakeDb';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(buffer) {
    const { type, data } = JSON.parse(buffer.toString());
    console.log(type, data)
    switch (type) {
      case 'reg':
        db.loginUser(data, ws);
        break;
      case 'create_game':
        db.createGame(data, ws);
        break;
      case 'join_game':
        db.joinGame(data, ws);
        break;
      default:
        break;
    }
  });
});