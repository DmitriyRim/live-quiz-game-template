import { type WebSocket } from 'ws';
import { AnswerData, StartGameData } from '../types';
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
        
        fakeDb.updateGame(data.gameId, {...game, currentQuestion: nextQuestion, questionStartTime: Date.now()})
        ws.send(message);
        players.forEach(player => player.ws?.send(message));
    }
}

export function answerAccepted(data: AnswerData, ws: WebSocket) {
    const time = Date.now();
    const game = fakeDb.getGame('id', data.gameId);

    if(game) {
        const { questionStartTime, questions, players, currentQuestion } = game;
        const currentUserIndex = players.findIndex(player => player.ws === ws);

        if(currentQuestion !== -1 && questions[data.questionIndex + 1].correctIndex === data.answerIndex + 1 && questionStartTime) {
            const timeRemaining = questionStartTime / time;

            players[currentUserIndex].score += 1000 * (timeRemaining / questions[currentQuestion].timeLimitSec)
            fakeDb.updateGame(data.gameId, {...game, players})
        }

        ws.send(getAnswerString('answer_accepted', {
            "questionIndex": currentQuestion
        }))
    }
}