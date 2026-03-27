import { Game, User } from "../types";
import { type WebSocket } from 'ws';

type DB = {
    games: Game[];
    users: User[];
    addNewUser(userData: User): void;
    getUser(key: 'ws' | 'name' | 'index', value: string | WebSocket): User | null;
    addGame(game: Game): void;
    getGameByCode(code: string): Game | null;
}

export const fakeDb: DB = {
    games: [],
    users: [],
    getUser(key, value){
        const user = this.users.find(user => user[key] === value);

        return user ?? null;
    },
    addNewUser(userData){
        this.users.push(userData);
    },
    addGame(game){
        this.games.push(game);
    },
    getGameByCode(code){
        const game = this.games.find(game => game.code === code);

        return game ?? null;
    }
}