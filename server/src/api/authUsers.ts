import { randomUUID } from "node:crypto";
import { fakeDb } from "../db/fakeDb";
import { RegData } from "../types";
import { getAnswerString } from "../utils/utils";
import { type WebSocket } from 'ws';

export function loginUser(data: RegData, ws: WebSocket){
    const user = fakeDb.getUser('name', data.name);

    if(user && user.password !== data.password) {
        ws.send(getAnswerString('reg', {
            name: '',
            index: '',
            error: true,
            errorText: 'Invalid username or password'
        }));

        return;
    }

    if(!user) {
        userRegistration(data, ws);
        return;
    }

    ws.send(getAnswerString('reg', {
        name: user.name,
        index: user.index,
        error: false,
        errorText: ''
    }));
};

function userRegistration(data: RegData, ws: WebSocket) {
    fakeDb.addNewUser({
        index: randomUUID(),
        ...data,
        ws
    });

    loginUser(data, ws);
};