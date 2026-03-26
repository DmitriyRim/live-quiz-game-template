import { randomUUID } from "node:crypto";
import { CreateGameData, Game, JoinGameData, Question, RegData, User } from "../types";
import { type WebSocket } from 'ws';
import { getAnswerString, randomPassword } from "../utils/utils";

const games: Game[] = [];
const usersOnline = new Map<WebSocket, User>();

export default {
    loginUser(data: RegData, ws: WebSocket){
        const user = [...usersOnline.values()].find(user => user.name === data.name);

        if(!user){
            this.userRegistration(data, ws);
            return;
        }

        if(user?.name !== data.name || user.password !== data.password) {
            ws.send(getAnswerString('reg', {
                name: '',
                index: '',
                error: true,
                errorText: 'Invalid username or password'
            }));

            return;
        }

        usersOnline.set(ws, user);
        ws.send(getAnswerString('reg', {
            name: user.name,
            index: user.index,
            error: false,
            errorText: ''
        }));
    },
    userRegistration(data: RegData, ws: WebSocket) {
        usersOnline.set(ws, {
            index: randomUUID(),
            ...data,
            ws
        });

        this.loginUser(data, ws);
    },
    createGame(data: CreateGameData, ws: WebSocket){
        const code = randomPassword(6);
        const gameId = randomUUID();

        if(usersOnline.has(ws)){
            games.push({
                id: gameId,
                code,
                hostId: usersOnline.get(ws)!.index,
                questions: data.questions,
                players: [],
                currentQuestion: 0,
                status: 'waiting',
                //   questionStartTime?: number,
                //   questionTimer?: NodeJS.Timeout;
                playerAnswers: new Map<string, { answerIndex: number; timestamp: number }>
            })

            ws.send(getAnswerString('game_created', { code, gameId }))
        }
    },
    joinGame(data: JoinGameData, ws: WebSocket){
        const gameIndex = games.findIndex(game => game.code === data.code);
        const currentUser = usersOnline.get(ws);

        if(gameIndex !== -1 && currentUser){
            const { id, players } = games[gameIndex];
            const message = getAnswerString('game_joined', { gameId: id });
            const player = {
                name: currentUser.name,
                index: currentUser.index,
                score: 0,
                ws: ws,
                // hasAnswered?: boolean;
                // answerTime?: number;
                // answeredCorrectly?: boolean;
            }

            players.push(player);
            ws.send(message);
            this.playerJoined(games[gameIndex]);
        }
    },
    playerJoined(game: Game){
        const { players, hostId } = game;
        const host = [...usersOnline.values()].find(user => user.index === hostId);
        const message = getAnswerString('player_joined', {
            playerName: players[players.length - 1].name,
            playerCount: players.length
        });

        players.forEach(player => player.ws?.send(message));
        host?.ws?.send(message);
        this.updatePlayers(game);
    },
    updatePlayers(game: Game){
        const { players, hostId } = game;
        const host = [...usersOnline.values()].find(user => user.index === hostId);
        const message = getAnswerString('update_players', players.map(player => ({
            name: player.name,
            index: player.index,
            score: player.score
        })))

        players.forEach(player => player.ws?.send(message));
        host?.ws?.send(message);
    }
}