import { WebSocketServer } from 'ws';
import { loginUser } from './api/authUsers';
import { createGame, joinGame } from './api/gameManagement';
import { startGame } from './api/gamePlay';

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
        loginUser(data, ws);
        break;
      case 'create_game':
        createGame(data, ws);
        break;
      case 'join_game':
        joinGame(data, ws);
        break;
      case 'start_game':
        startGame(data, ws);
        break;
      default:
        break;
    }
  });
});