package com.example.bidwhist.models

data class PlayerDTO(
    val id: String,
    val name: String,
    val hands: List<HandDTO>
)

data class HandDTO(
    val id: String,
    val cards: List<CardDTO>
)

data class CardDTO(
    val suit: String,
    val rank: String
)

data class RoomDTO(
    val roomCode: String,
    val players: List<PlayerDTO>,
    val gameState: GameStateDTO
)

data class GameStateDTO(
    val currentTurn: String,
    val handsPlayed: Int,
    val scores: Map<String, Int>
)