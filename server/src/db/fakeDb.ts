import { Game, User } from "../types";
import { type WebSocket } from 'ws';

type DB = {
    games: Game[];
    users: User[];
    addNewUser(userData: User): void;
    getUser(key: 'ws' | 'name' | 'index', value: string | WebSocket): User | null;
    addGame(game: Game): void;
    getGame(key: 'code' | 'id', value: string): Game | null;
    updateGame(id: string, data: Game): void;
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
    getGame(key, value){
        const game = this.games.find(game => game[key] === value);

        return game ?? null;
    },
    updateGame(id, data){
        const gameIndex = this.games.findIndex(game => game.id === id);

        this.games[gameIndex] = data;
    }
}