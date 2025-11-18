package com.example.bidwhist

import com.example.bidwhist.game.*
import com.example.bidwhist.handlers.*
import com.example.bidwhist.managers.RoomManager
import com.example.bidwhist.models.WebSocketMessage
import com.fasterxml.jackson.databind.ObjectMapper
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

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}

private val objectMapper = ObjectMapper()

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

        get("/api/room/{roomCode}/exists") {
            val roomCode = call.parameters["roomCode"]?.uppercase() 
                ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing room code")
            val exists = RoomManager.roomExists(roomCode)
            call.respond(mapOf("exists" to exists, "roomCode" to roomCode))
        }

        webSocket("/room/{roomCode}") {
            val roomCode = call.parameters["roomCode"]?.uppercase() 
                ?: return@webSocket close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Missing room code"))
            
            val room = RoomManager.getOrCreateRoom(roomCode)
            println("Client connected to room = $roomCode. Current players = ${room.players.size}")
            
            try {
                for (message in incoming) {
                    if (message is Frame.Text) {
                        try {
                            val msgText = message.readText()
                            val wsMessage = objectMapper.readValue(msgText, WebSocketMessage::class.java)
                            
                            when (wsMessage.type) {
                                "GET_ROOM_STATE" -> {
                                    val roomStateMessage = objectMapper.writeValueAsString(
                                        mapOf(
                                            "type" to "ROOM_STATE",
                                            "players" to room.players,
                                            "playerCount" to room.players.size
                                        )
                                    )
                                    send(Frame.Text(roomStateMessage))
                                }
                                "PLAYER_JOINED" -> {
                                    handlePlayerJoined(room, wsMessage, this, objectMapper)
                                }
                                "UPDATE_HAND_COUNT" -> {
                                    handleUpdateHandCount(room, wsMessage, objectMapper)
                                }
                                "UPDATE_TEAM" -> {
                                    handleUpdateTeam(room, wsMessage, objectMapper)
                                }
                                "UPDATE_HAND_NAME" -> {
                                    handleUpdateHandName(room, wsMessage, objectMapper)
                                }
                                "TOGGLE_READY" -> {
                                    handleToggleReady(room, wsMessage, objectMapper)
                                }
                                "DEALER_GUESS" -> {
                                    if (wsMessage.handId != null && wsMessage.guess != null) {
                                        handleDealerGuess(room, wsMessage.handId, wsMessage.guess, objectMapper)
                                    }
                                }
                                "PLACE_BID" -> {
                                    if (wsMessage.handId != null && wsMessage.bidAmount != null) {
                                        handleBid(room, wsMessage.handId, wsMessage.bidAmount, objectMapper)
                                    }
                                }
                                "SELECT_TRUMP" -> {
                                    if (wsMessage.trumpSuit != null) {
                                        handleTrumpSelection(room, wsMessage.trumpSuit, objectMapper)
                                    }
                                }
                                "PLAY_CARD" -> {
                                    if (wsMessage.handId != null && wsMessage.card != null) {
                                        handleCardPlay(room, wsMessage.handId, wsMessage.card, objectMapper)
                                    }
                                }
                                "HAND_COMPLETE_READY" -> {
                                    if (wsMessage.playerId != null) {
                                        handleHandCompleteReady(room, wsMessage.playerId, objectMapper)
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            println("❌ Error parsing message: ${e.message}")
                            e.printStackTrace()
                        }
                    }
                }
            } catch (e: Exception) {
                println("WebSocket error: ${e.message}")
            } finally {
                handleDisconnection(roomCode, this)
            }
        }
    }
}

private fun handleDisconnection(roomCode: String, session: DefaultWebSocketSession) {
    val room = RoomManager.getRoom(roomCode) ?: return
    
    val disconnectedPlayers = room.players.filter { player ->
        room.connections[player.id] == session
    }
    
    disconnectedPlayers.forEach { player ->
        room.connections.remove(player.id)
        println("Player ${player.name} disconnected from room $roomCode (connection removed, player kept for reconnection)")
    }
    
    println("Room $roomCode now has ${room.connections.size} active connections and ${room.players.size} players")
}
