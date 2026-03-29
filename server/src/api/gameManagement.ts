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

    if(game && currentUser){
        const { id, players } = game;
        const message = getAnswerString('game_joined', { gameId: id });
        const player = {
            name: currentUser.name,
            index: currentUser.index,
            score: 0,
            ws: ws,
            hasAnswered: false,
            answerTime: 0,
            answeredCorrectly: false,
        }

        players.push(player);
        ws.send(message);
        playerJoined(game);
    }
};

function playerJoined(game: Game){
    const { players, hostId } = game;
    const host = fakeDb.getUser('index', hostId);
    const message = getAnswerString('player_joined', {
        playerName: players[players.length - 1].name,
        playerCount: players.length
    });

    if(host) {
        players.forEach(player => player.ws?.send(message));
        host.ws?.send(message);
        updatePlayers(host, players);
    }
}

export function updatePlayers(host: User, players: Player[]){
    const message = getAnswerString('update_players', players.map(player => ({
        name: player.name,
        index: player.index,
        score: player.score
    })))

    players.forEach(player => player.ws?.send(message));
    host?.ws?.send(message);
}