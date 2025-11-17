// This file contains logic for scoring in the game.

export interface Scoring {
    calculateScore: (handsWon: number, pointsPerHand: number) => number;
    determineWinner: (scores: Record<string, number>) => string;
}

export const scoring: Scoring = {
    calculateScore: (handsWon, pointsPerHand) => {
        return handsWon * pointsPerHand;
    },
    determineWinner: (scores) => {
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    }
};