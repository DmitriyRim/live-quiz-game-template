import { type WebSocket } from 'ws';
import { StartGameData } from '../types';
import { fakeDb } from '../db/fakeDb';
import { getAnswerString } from '../utils/utils';

export function startGame(data: StartGameData, ws: WebSocket){
    const game = fakeDb.getGame('id', data.gameId);

    if(game) {
        const { currentQuestion, questions, players } = game;
        const nextQuestion = currentQuestion + 1;

        const message = getAnswerString('question', {
            questionNumber: nextQuestion,
            totalQuestions: questions.length,
            text: questions[nextQuestion].text,
            options: questions[nextQuestion].options,
            timeLimitSec: questions[nextQuestion].timeLimitSec
        })
        
        fakeDb.updateGame(data.gameId, {...game, currentQuestion: nextQuestion})
        ws.send(message);
        players.forEach(player => player.ws?.send(message));
    }
}