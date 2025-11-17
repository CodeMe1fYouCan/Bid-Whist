package com.example.bidwhist

import java.util.UUID

data class PlayerConnection(
    val id: UUID,
    val username: String,
    var hands: MutableList<Hand> = mutableListOf()
) {
    fun addHand(hand: Hand) {
        hands.add(hand)
    }

    fun removeHand(hand: Hand) {
        hands.remove(hand)
    }

    fun getHandCount(): Int {
        return hands.size
    }
}

data class Hand(
    val id: UUID,
    val cards: List<Card>
)

data class Card(
    val suit: String,
    val rank: String
)