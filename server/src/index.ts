import { WebSocketServer } from 'ws';
import { loginUser } from './api/authUsers';
import { createGame, joinGame, updatePlayers } from './api/gameManagement';
import { answerAccepted, startGame } from './api/gamePlay';
import { fakeDb } from './db/fakeDb';

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
      case 'answer':
        answerAccepted(data, ws);
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    const gameIds = fakeDb.deletePlayerFromGame(ws);

    gameIds.forEach(id => {
      const game = fakeDb.getGame('id', id);

      if(game) {
        const host = fakeDb.getUser('index', game.hostId);

        if(!host) return;
        updatePlayers(game);
      }
    })

  })
});