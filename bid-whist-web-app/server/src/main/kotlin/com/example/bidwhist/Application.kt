package com.example.bidwhist

import com.example.bidwhist.game.*
import com.example.bidwhist.handlers.*
import com.example.bidwhist.managers.RoomManager
import com.example.bidwhist.models.WebSocketMessage
import com.example.bidwhist.security.SecurityConfig
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
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(DelicateCoroutinesApi::class)
fun main() {
    val host = System.getenv("SERVER_HOST") ?: "0.0.0.0"
    val port = System.getenv("SERVER_PORT")?.toIntOrNull() ?: 8080
    val cleanupIntervalMinutes = System.getenv("CLEANUP_INTERVAL_MINUTES")?.toLongOrNull() ?: 15L
    val roomTimeoutMinutes = System.getenv("ROOM_TIMEOUT_MINUTES")?.toLongOrNull() ?: 60L
    
    println("Starting server on $host:$port")
    println("Room cleanup: every $cleanupIntervalMinutes minutes, timeout after $roomTimeoutMinutes minutes of inactivity")
    
    // Start background room cleanup task
    GlobalScope.launch {
        delay(cleanupIntervalMinutes * 60 * 1000) // Wait before first cleanup
        while (true) {
            try {
                RoomManager.cleanupInactiveRooms(roomTimeoutMinutes)
                val stats = RoomManager.getRoomStats()
                println("📊 Room stats: ${stats["totalRooms"]} total, ${stats["roomsWithConnections"]} active")
            } catch (e: Exception) {
                println("❌ Error during room cleanup: ${e.message}")
            }
            delay(cleanupIntervalMinutes * 60 * 1000)
        }
    }
    
    embeddedServer(Netty, host = host, port = port, module = Application::module).start(wait = true)
}

private val objectMapper = ObjectMapper()

fun Application.module() {
    install(ContentNegotiation) {
        jackson { }
    }

    install(CORS) {
        val allowedOrigins = System.getenv("ALLOWED_ORIGINS")?.split(",")?.map { it.trim() } ?: emptyList()
        
        if (allowedOrigins.isEmpty() || allowedOrigins.contains("*")) {
            // Development mode - allow all origins
            anyHost()
            println("⚠️  CORS: Allowing all origins (development mode)")
        } else {
            // Production mode - restrict to specific origins
            allowedOrigins.forEach { origin ->
                val cleanOrigin = origin.removePrefix("http://").removePrefix("https://")
                host(cleanOrigin, schemes = listOf("http", "https"))
                println("✅ CORS: Allowing origin: $origin")
            }
            // Only set credentials when not using anyHost
            allowCredentials = true
        }
        
        allowNonSimpleContentTypes = true
    }

    install(StatusPages) {
        exception<Throwable> { cause ->
            val isProduction = System.getenv("ENVIRONMENT") == "production"
            
            if (isProduction) {
                // Don't expose internals in production
                println("❌ Error: ${cause.message}")
                cause.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "An error occurred"))
            } else {
                // Show details in development
                call.respond(HttpStatusCode.InternalServerError, mapOf(
                    "error" to cause.localizedMessage,
                    "type" to cause.javaClass.simpleName
                ))
            }
        }
    }

    install(WebSockets)

    routing {
        get("/") {
            call.respondText("Welcome to Bid Whist Server!")
        }

        get("/health") {
            call.respond(mapOf("status" to "ok", "service" to "bid-whist-server"))
        }

        get("/stats") {
            val stats = RoomManager.getRoomStats()
            call.respond(stats)
        }

        get("/api/room/{roomCode}/exists") {
            val roomCode = call.parameters["roomCode"]?.uppercase() 
                ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing room code")
            val exists = RoomManager.roomExists(roomCode)
            call.respond(mapOf("exists" to exists, "roomCode" to roomCode))
        }

        webSocket("/room/{roomCode}") {
            val roomCode = call.parameters["roomCode"]?.uppercase()
            
            // Validate room code
            if (!SecurityConfig.isValidRoomCode(roomCode)) {
                close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "Invalid room code format"))
                return@webSocket
            }
            
            val room = RoomManager.getOrCreateRoom(roomCode!!)
            room.updateActivity() // Track connection activity
            println("Client connected to room = $roomCode. Current players = ${room.players.size}")
            
            try {
                for (message in incoming) {
                    if (message is Frame.Text) {
                        try {
                            val msgText = message.readText()
                            val wsMessage = objectMapper.readValue(msgText, WebSocketMessage::class.java)
                            
                            when (wsMessage.type) {
                                "GET_ROOM_STATE" -> {
                                    room.updateActivity()
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
                                    // Validate player data
                                    val player = wsMessage.player
                                    if (player == null || 
                                        !SecurityConfig.isValidPlayerId(player.id) ||
                                        !SecurityConfig.isValidPlayerName(player.name)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid player data"}"""))
                                        println("⚠️  Invalid player data: ${player?.name}")
                                    } else {
                                        handlePlayerJoined(room, wsMessage, this, objectMapper)
                                    }
                                }
                                "UPDATE_HAND_COUNT" -> {
                                    // Validate hand count
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.playerId) ||
                                        !SecurityConfig.isValidHandCount(wsMessage.handCount)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid hand count"}"""))
                                        println("⚠️  Invalid hand count: ${wsMessage.handCount}")
                                    } else {
                                        handleUpdateHandCount(room, wsMessage, objectMapper)
                                    }
                                }
                                "UPDATE_TEAM" -> {
                                    // Validate team update
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.playerId) ||
                                        !SecurityConfig.isValidTeam(wsMessage.team)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid team"}"""))
                                        println("⚠️  Invalid team: ${wsMessage.team}")
                                    } else {
                                        handleUpdateTeam(room, wsMessage, objectMapper)
                                    }
                                }
                                "UPDATE_HAND_NAME" -> {
                                    // Validate hand name update
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.playerId) ||
                                        !SecurityConfig.isValidPlayerName(wsMessage.handName)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid hand name"}"""))
                                        println("⚠️  Invalid hand name: ${wsMessage.handName}")
                                    } else {
                                        handleUpdateHandName(room, wsMessage, objectMapper)
                                    }
                                }
                                "TOGGLE_READY" -> {
                                    // Validate ready toggle
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.playerId)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid player ID"}"""))
                                        println("⚠️  Invalid player ID for ready toggle")
                                    } else {
                                        handleToggleReady(room, wsMessage, objectMapper)
                                    }
                                }
                                "DEALER_GUESS" -> {
                                    // Validate dealer guess
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.handId) ||
                                        !SecurityConfig.isValidGuess(wsMessage.guess)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid guess"}"""))
                                        println("⚠️  Invalid dealer guess: ${wsMessage.guess}")
                                    } else {
                                        handleDealerGuess(room, wsMessage.handId!!, wsMessage.guess!!, objectMapper)
                                    }
                                }
                                "PLACE_BID" -> {
                                    // Validate bid
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.handId) ||
                                        !SecurityConfig.isValidBid(wsMessage.bidAmount)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid bid"}"""))
                                        println("⚠️  Invalid bid: ${wsMessage.bidAmount}")
                                    } else {
                                        handleBid(room, wsMessage.handId!!, wsMessage.bidAmount!!, objectMapper)
                                    }
                                }
                                "SELECT_TRUMP" -> {
                                    // Validate trump suit (includes "no-trump")
                                    if (!SecurityConfig.isValidTrumpSuit(wsMessage.trumpSuit)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid trump suit"}"""))
                                        println("⚠️  Invalid trump suit: ${wsMessage.trumpSuit}")
                                    } else {
                                        handleTrumpSelection(room, wsMessage.trumpSuit!!, objectMapper)
                                    }
                                }
                                "PLAY_CARD" -> {
                                    // Validate card play
                                    val card = wsMessage.card
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.handId) ||
                                        card == null ||
                                        !SecurityConfig.isValidSuit(card["suit"]) ||
                                        !SecurityConfig.isValidRank(card["rank"])) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid card"}"""))
                                        println("⚠️  Invalid card play: $card")
                                    } else {
                                        handleCardPlay(room, wsMessage.handId!!, card, objectMapper)
                                    }
                                }
                                "HAND_COMPLETE_READY" -> {
                                    // Validate player ID
                                    if (!SecurityConfig.isValidPlayerId(wsMessage.playerId)) {
                                        send(Frame.Text("""{"type":"ERROR","message":"Invalid player ID"}"""))
                                        println("⚠️  Invalid player ID for hand complete ready")
                                    } else {
                                        handleHandCompleteReady(room, wsMessage.playerId!!, objectMapper)
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
