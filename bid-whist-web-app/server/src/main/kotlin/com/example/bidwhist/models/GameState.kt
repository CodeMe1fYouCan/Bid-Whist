package com.example.bidwhist.models

data class GameState(
    val roomCode: String = "",
    val players: List<PlayerState> = emptyList(),
    val hands: Map<String, List<Card>> = emptyMap(),
    val currentPlayer: String = "",
    val round: Int = 0,
    val scores: Map<String, Int> = emptyMap(),
    val gameStatus: GameStatus = GameStatus.WAITING_FOR_PLAYERS
)

data class PlayerState(
    val playerId: String,
    val playerName: String,
    val handsControlled: Int
)

data class Card(
    val suit: String,
    val rank: String
)

enum class GameStatus {
    WAITING_FOR_PLAYERS,
    IN_PROGRESS,
    FINISHED
}