// dealer.ts
import { Card } from '../components/Card';
import { shuffleDeck } from '../lib/shuffle';
import { Player } from '../types/index';

export class Dealer {
    private deck: Card[];
    private players: Player[];

    constructor(players: Player[]) {
        this.players = players;
        this.deck = this.createDeck();
    }

    private createDeck(): Card[] {
        // Logic to create a standard deck of cards for Bid Whist
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck: Card[] = [];

        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }

        return deck;
    }

    public dealHands(numHands: number): Card[][] {
        this.deck = shuffleDeck(this.deck);
        const hands: Card[][] = Array.from({ length: numHands }, () => []);

        for (let i = 0; i < this.deck.length; i++) {
            hands[i % numHands].push(this.deck[i]);
        }

        return hands;
    }
}