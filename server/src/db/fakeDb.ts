import { randomUUID } from "node:crypto";
import { CreateGameData, Question, RegData, User } from "../types";
import { type WebSocket } from 'ws';
import { getAnswerString, randomPassword } from "../utils/utils";

const users: User[] = [];
const games: {
    gameId: string;
    code: string;
    questions: Question[];
    host: WebSocket
    players: WebSocket[]
}[] = []

export default {
    loginUser(data: RegData, ws: WebSocket){
        const user = users.find(user => user.name === data.name);

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

        ws.send(getAnswerString('reg', {
            name: user.name,
            index: user.index,
            error: false,
            errorText: ''
        }));
    },
    userRegistration(data: RegData, ws: WebSocket) {
        users.push({
            index: randomUUID(),
            ...data,
            ws
        });

        this.loginUser(data, ws);
    },
    createGame(data: CreateGameData, ws: WebSocket){
        const code = randomPassword(6);
        const gameId = randomUUID();

        games.push({
            code,
            gameId,
            questions: data.questions,
            host: ws,
            players: []
        })

        ws.send(getAnswerString('game_created', { code, gameId }))
    }
}