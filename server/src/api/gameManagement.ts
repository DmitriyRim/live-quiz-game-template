import { randomUUID } from "node:crypto";
import { CreateGameData, Game, JoinGameData, Player, User } from "../types";
import { randomPassword } from "../utils/utils";
import { fakeDb } from "../db/fakeDb";
import { type WebSocket } from 'ws';
import { getAnswerString } from "../utils/utils";

export function createGame(data: CreateGameData, ws: WebSocket){
    const code = randomPassword(6);
    const gameId = randomUUID();
    const host = fakeDb.getUser('ws', ws);

    if(host){
        fakeDb.addGame({
            id: gameId,
            code,
            hostId: host.index,
            questions: data.questions,
            players: [],
            currentQuestion: -1,
            status: 'waiting',
            questionStartTime: 0,
        //   questionTimer?: NodeJS.Timeout;
            playerAnswers: new Map<string, { answerIndex: number; timestamp: number }>
        })

        ws.send(getAnswerString('game_created', { code, gameId }))
    }
}

export function joinGame(data: JoinGameData, ws: WebSocket){
    const game = fakeDb.getGame('code', data.code);
    const currentUser = fakeDb.getUser('ws', ws);

    if (!game || !currentUser) return;

    const alreadyInGame = game.players.some(player => player.index === currentUser.index);

    if (alreadyInGame) return;

    const newPlayer: Player = {
        name: currentUser.name,
        index: currentUser.index,
        score: 0,
        ws: ws,
        hasAnswered: false,
        answerTime: 0,
        answeredCorrectly: false,
    }
    const updatedGame: Game = {
        ...game,
        players: [...game.players, newPlayer]
    };

    fakeDb.updateGame(game.id, updatedGame);
    ws.send(getAnswerString('game_joined', { gameId: game.id }));
    setTimeout(() => { playerJoined(updatedGame, newPlayer.name) }, 50)
};

function playerJoined(game: Game, name: string){
    const { players, hostId } = game;
    const host = fakeDb.getUser('index', hostId);
    const message = getAnswerString('player_joined', {
        playerName: name,
        playerCount: players.length
    });

    if(host) {
        players.forEach(player => player.ws?.send(message));
        host.ws?.send(message);
        updatePlayers(game);
    }
}

export function updatePlayers(game: Game){
    const message = getAnswerString('update_players', game.players.map(player => ({
        name: player.name,
        index: player.index,
        score: player.score
    })))
    const host = fakeDb.getUser('index', game.hostId);

    const clients = [
        ...game.players.map(player => player.ws),
        host?.ws
    ];

    clients.forEach(ws => {
        if (ws && ws.readyState === ws.OPEN) {
            ws.send(message);
        }
    });
}