// This file manages the player hands for the Bid Whist game.

interface Hand {
    cards: string[];
    playerId: string;
}

class HandManager {
    private hands: Map<string, Hand[]>;

    constructor() {
        this.hands = new Map();
    }

    addHand(playerId: string, hand: Hand) {
        if (!this.hands.has(playerId)) {
            this.hands.set(playerId, []);
        }
        this.hands.get(playerId)?.push(hand);
    }

    removeHand(playerId: string, handIndex: number) {
        const playerHands = this.hands.get(playerId);
        if (playerHands && handIndex >= 0 && handIndex < playerHands.length) {
            playerHands.splice(handIndex, 1);
        }
    }

    getHands(playerId: string): Hand[] | undefined {
        return this.hands.get(playerId);
    }

    getAllHands(): Map<string, Hand[]> {
        return this.hands;
    }
}

export { HandManager, Hand };