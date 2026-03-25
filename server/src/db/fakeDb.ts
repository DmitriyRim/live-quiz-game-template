import { randomUUID } from "node:crypto";
import { RegData, User } from "../types";
import { type WebSocket } from 'ws';
import { getAnswerString } from "../utils/utils";

const users: User[] = [];

export default {
    loginUser(data: RegData, ws: WebSocket){
        const user = users.find(user => user.name === data.name);

        if(!user){
            this.userRegistration(data, ws);
            return;
        }

        if(user?.name !== data.name || user.password !== data.password) {
            ws.send(getAnswerString({
                name: '',
                index: '',
                error: true,
                errorText: 'Invalid username or password'
            }));

            return;
        }

        ws.send(getAnswerString({
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
    }
}