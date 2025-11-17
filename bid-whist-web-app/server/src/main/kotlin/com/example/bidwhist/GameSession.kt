package com.example.bidwhist

import com.example.bidwhist.models.GameState
import java.util.UUID

class GameSession(val roomCode: String, val players: MutableList<String> = mutableListOf()) {
    private val hands: MutableMap<String, MutableList<String>> = mutableMapOf() // Player ID to hands mapping
    private var currentState: GameState = GameState()

    init {
        // Initialize the game session
    }

    fun addPlayer(playerId: String) {
        hands[playerId] = mutableListOf()
    }

    fun removePlayer(playerId: String) {
        hands.remove(playerId)
    }

    fun dealCards() {
        // Logic to deal cards to players
    }

    fun playCard(playerId: String, handIndex: Int, card: String) {
        // Logic for a player to play a card from a specific hand
    }

    fun getGameState(): GameState {
        return currentState
    }

    fun updateGameState(newState: GameState) {
        currentState = newState
    }

    fun getHands(): Map<String, List<String>> {
        return hands.mapValues { it.value.toList() }
    }
}