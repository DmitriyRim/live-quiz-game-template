import { type WebSocket } from 'ws';
import { AnswerData, StartGameData } from '../types';
import { fakeDb } from '../db/fakeDb';
import { getAnswerString } from '../utils/utils';

export function startGame(data: StartGameData, ws: WebSocket){
    const game = fakeDb.getGame('id', data.gameId);

    if(game) {
        const { currentQuestion, questions, players } = game;
        const nextQuestion = currentQuestion + 1;

        if(!questions[nextQuestion]) {
            return gameFinished(data.gameId, ws);
        }

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

        setTimeout(() => questionResult(data.gameId, ws), questions[nextQuestion].timeLimitSec * 1000);
    }
}

export function answerAccepted(data: AnswerData, ws: WebSocket) {
    const time = Date.now();
    const game = fakeDb.getGame('id', data.gameId);

    if(game) {
        const { questionStartTime, questions, players, currentQuestion } = game;
        const currentUserIndex = players.findIndex(player => player.ws === ws);

        if (questionStartTime) {
            const currentPlayer = players[currentUserIndex];

            players[currentUserIndex] = {
                ...currentPlayer,
                hasAnswered: true,
                answerTime: Math.floor((time - questionStartTime) / 1000),
                answeredCorrectly: questions[data.questionIndex + 1].correctIndex === data.answerIndex,
            }
        }

        ws.send(getAnswerString('answer_accepted', {
            "questionIndex": currentQuestion
        }))
    }
}

function questionResult(gameId: string, hostWs: WebSocket){
    const game = fakeDb.getGame('id', gameId);

    if(game) {
        const { players, currentQuestion, questions, questionStartTime } = game;
        const playerResults: { name: string; answered: boolean | undefined; correct: boolean | undefined; pointsEarned: number; totalScore: number; }[] = [];
        const updatePlayers = players.map(player => {
            const { name, hasAnswered, answeredCorrectly, answerTime, score } = player;

            if (questionStartTime && answerTime) {
                const timeLimit = questions[currentQuestion].timeLimitSec;
                const timeRemaining = Math.max(timeLimit - answerTime, 0)
                const pointsEarned = answeredCorrectly ? 1000 * ( timeRemaining / timeLimit) : 0;
                const totalScore = score + +pointsEarned.toFixed(2);

                playerResults.push({
                    name,
                    answered: hasAnswered,
                    correct: answeredCorrectly,
                    pointsEarned: +pointsEarned.toFixed(2),
                    totalScore
                })

                return {
                    ...player,
                    score: totalScore,
                    hasAnswered: false,
                    answerTime: 0,
                    answeredCorrectly: false,
                }
            }
            return player;
        })
        
        const message = getAnswerString('question_result', {
            questionIndex: currentQuestion,
            correctIndex: questions[currentQuestion].correctIndex,
            playerResults
        })

        fakeDb.updateGame(gameId, {...game, players: updatePlayers})
        players.forEach(player => player.ws?.send(message));
        hostWs.send(message);
        setTimeout(() => startGame({ gameId }, hostWs), 2000);
    }
}

function gameFinished(gameId: string, hostWs: WebSocket){
    const game = fakeDb.getGame('id', gameId);

    if(game) {
        const { players } = game;
        const scoreboard = players.sort((a, b) => b.score - a.score).map((player, index) => {
            return {
                name: player.name,
                score: player.score,
                rank: index + 1
            }
        });
        const message = getAnswerString('game_finished', { scoreboard });
        
        players.forEach(player => player.ws?.send(message));
        hostWs.send(message);
    }
}