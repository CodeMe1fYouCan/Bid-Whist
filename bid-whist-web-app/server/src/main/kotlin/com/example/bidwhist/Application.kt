package com.example.bidwhist

import io.ktor.application.*
import io.ktor.features.ContentNegotiation
import io.ktor.features.CORS
import io.ktor.features.StatusPages
import io.ktor.http.HttpStatusCode
import io.ktor.http.cio.websocket.*
import io.ktor.jackson.jackson
import io.ktor.response.respond
import io.ktor.response.respondText
import io.ktor.routing.*
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.websocket.WebSockets
import io.ktor.websocket.webSocket
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}

// Data classes for WebSocket messages
data class Player @JsonCreator constructor(
    @JsonProperty("id") val id: String,
    @JsonProperty("name") val name: String,
    @JsonProperty("isAI") val isAI: Boolean = false
)

data class WebSocketMessage @JsonCreator constructor(
    @JsonProperty("type") val type: String,
    @JsonProperty("player") val player: Player? = null,
    @JsonProperty("handId") val handId: String? = null,
    @JsonProperty("card") val card: String? = null,
    @JsonProperty("aiPlayers") val aiPlayers: List<Player>? = null
)

// Room management
private val activeRooms = mutableMapOf<String, RoomState>()
private val objectMapper = ObjectMapper()

data class RoomState(
    val roomCode: String,
    val players: MutableList<Player> = mutableListOf(),
    val connections: MutableMap<String, DefaultWebSocketSession> = mutableMapOf(),
    val createdAt: Long = System.currentTimeMillis()
)

fun Application.module() {
    install(ContentNegotiation) {
        jackson { }
    }

    install(CORS) {
        anyHost()
    }

    install(StatusPages) {
        exception<Throwable> { cause ->
            call.respond(HttpStatusCode.InternalServerError, cause.localizedMessage)
        }
    }

    install(WebSockets)

    routing {
        get("/") {
            call.respondText("Welcome to Bid Whist Server!")
        }

        // Check if a room exists
        get("/api/room/{roomCode}/exists") {
            val roomCode = call.parameters["roomCode"]?.uppercase() ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing room code")
            val exists = activeRooms.containsKey(roomCode)
            call.respond(mapOf("exists" to exists, "roomCode" to roomCode))
        }

        webSocket("/room/{roomCode}") {
            val roomCode = call.parameters["roomCode"]?.uppercase() ?: return@webSocket close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Missing room code"))
            
            // Get or create room
            val room = activeRooms.getOrPut(roomCode) { RoomState(roomCode) }
            println("Client connected to room = $roomCode. Current players = ${room.players.size}")
            
            try {
                for (message in incoming) {
                    if (message is Frame.Text) {
                        try {
                            val msgText = message.readText()
                            val wsMessage = objectMapper.readValue(msgText, WebSocketMessage::class.java)
                            
                            when (wsMessage.type) {
                                "GET_ROOM_STATE" -> {
                                    // Send current room state to the requesting client
                                    val roomStateMessage = objectMapper.writeValueAsString(
                                        mapOf(
                                            "type" to "ROOM_STATE",
                                            "players" to room.players,
                                            "playerCount" to room.players.size
                                        )
                                    )
                                    try {
                                        this.send(Frame.Text(roomStateMessage))
                                    } catch (e: Exception) {
                                        println("Error sending room state: ${e.message}")
                                    }
                                }
                                "PLAYER_JOINED" -> {
                                    if (wsMessage.player != null) {
                                        val player = wsMessage.player
                                        println("PLAYER_JOINED received: ${player.name} (ID: ${player.id}) in room $roomCode")
                                        
                                        // Add player to room if not already there
                                        val playerExists = room.players.any { it.id == player.id }
                                        if (!playerExists) {
                                            room.players.add(player)
                                            println("  → Player ${player.name} added to room. Total players: ${room.players.size}")
                                        } else {
                                            println("  → Player ${player.name} already exists in room")
                                        }
                                        
                                        // Always update/add connection
                                        room.connections[player.id] = this
                                        println("  → Connection registered for ${player.name}. Total connections: ${room.connections.size}")
                                        
                                        // Broadcast updated room state to all players
                                        val roomStateMessage = objectMapper.writeValueAsString(
                                            mapOf(
                                                "type" to "ROOM_STATE",
                                                "players" to room.players,
                                                "playerCount" to room.players.size
                                            )
                                        )
                                        println("  → Broadcasting ROOM_STATE to ${room.connections.size} connections: ${room.players.map { it.name }}")
                                        room.connections.values.forEach { session ->
                                            try {
                                                session.send(Frame.Text(roomStateMessage))
                                            } catch (e: Exception) {
                                                println("  ⚠ Error sending ROOM_STATE: ${e.message}")
                                            }
                                        }
                                    }
                                }
                                "START_GAME" -> {
                                    // Add AI players if provided
                                    if (wsMessage.aiPlayers != null) {
                                        for (aiPlayer in wsMessage.aiPlayers) {
                                            if (!room.players.any { it.id == aiPlayer.id }) {
                                                room.players.add(aiPlayer)
                                            }
                                        }
                                    }

                                    // Broadcast game start with all players
                                    val gameStartMessage = objectMapper.writeValueAsString(
                                        mapOf(
                                            "type" to "GAME_STARTED",
                                            "players" to room.players,
                                            "message" to "Game is starting! 🎮"
                                        )
                                    )
                                    room.connections.values.forEach { session ->
                                        try {
                                            session.send(Frame.Text(gameStartMessage))
                                        } catch (e: Exception) {
                                            // Connection might be closed
                                        }
                                    }
                                }
                                "PLAY_CARD" -> {
                                    // Broadcast play card action to other players
                                    room.connections.values.forEach { session ->
                                        if (session != this) {
                                            try {
                                                session.send(message)
                                            } catch (e: Exception) {
                                                // Connection might be closed
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            println("Error parsing message: ${e.message}")
                        }
                    }
                }
            } catch (e: Exception) {
                println("WebSocket error: ${e.message}")
            } finally {
                // Remove only the disconnected player, but keep the room alive
                val roomCode = call.parameters["roomCode"]?.uppercase()
                if (roomCode != null) {
                    val room = activeRooms[roomCode]
                    if (room != null) {
                        val playersToRemove = room.players.filter { player ->
                            room.connections[player.id] == this
                        }
                        playersToRemove.forEach { player ->
                            room.connections.remove(player.id)
                            room.players.remove(player)
                            println("Player ${player.name} disconnected from room $roomCode. Remaining players: ${room.players.size}")
                        }
                        // DO NOT delete empty rooms - they may be rejoined later
                        // Only log that the room is now empty
                        if (room.players.isEmpty()) {
                            println("Room $roomCode is now empty but kept alive for late joiners")
                        }
                    }
                }
            }
        }

        // Additional routes for game sessions and matchmaking can be added here
    }
}