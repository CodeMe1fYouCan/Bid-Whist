// This file contains the game rules and logic for Bid Whist.

export const rules = {
    gameName: "Bid Whist",
    players: 2,
    maxHandsPerPlayer: 3,
    minHandsPerPlayer: 1,
    handSize: 13,
    trumpSuit: null,
    bidding: {
        minBid: 1,
        maxBid: 7,
        bidIncrement: 1,
    },
    scoring: {
        pointsPerTrick: 1,
        bonusForWinningBid: 2,
        penaltyForUnderbidding: -2,
    },
    // Add more rules and logic as needed
};