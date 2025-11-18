package com.example.bidwhist.models

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

data class Player @JsonCreator constructor(
    @JsonProperty("id") val id: String,
    @JsonProperty("name") val name: String,
    @JsonProperty("isReady") var isReady: Boolean = false,
    @JsonProperty("handCount") var handCount: Int = 1,
    @JsonProperty("handTeams") var handTeams: MutableMap<Int, String> = mutableMapOf(0 to "Us"),
    @JsonProperty("handNames") var handNames: MutableMap<Int, String> = mutableMapOf(0 to name)
)

data class WebSocketMessage @JsonCreator constructor(
    @JsonProperty("type") val type: String,
    @JsonProperty("player") val player: Player? = null,
    @JsonProperty("playerId") val playerId: String? = null,
    @JsonProperty("handId") val handId: String? = null,
    @JsonProperty("handIndex") val handIndex: Int? = null,
    @JsonProperty("card") val card: Map<String, String>? = null,
    @JsonProperty("isReady") val isReady: Boolean? = null,
    @JsonProperty("handCount") val handCount: Int? = null,
    @JsonProperty("team") val team: String? = null,
    @JsonProperty("handName") val handName: String? = null,
    @JsonProperty("guess") val guess: Int? = null,
    @JsonProperty("bidAmount") val bidAmount: Any? = null,
    @JsonProperty("trumpSuit") val trumpSuit: String? = null
)

data class RoomState(
    val roomCode: String,
    val players: MutableList<Player> = mutableListOf(),
    val connections: MutableMap<String, io.ktor.http.cio.websocket.DefaultWebSocketSession> = mutableMapOf(),
    val createdAt: Long = System.currentTimeMillis(),
    var gameState: MutableMap<String, Any>? = null
)
