package com.example.bidwhist.handlers

import com.example.bidwhist.game.*
import com.example.bidwhist.models.RoomState
import com.example.bidwhist.models.WebSocketMessage
import com.fasterxml.jackson.databind.ObjectMapper
import io.ktor.http.cio.websocket.DefaultWebSocketSession
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.send

suspend fun handlePlayerJoined(
    room: RoomState,
    message: WebSocketMessage,
    session: DefaultWebSocketSession,
    objectMapper: ObjectMapper
) {
    room.updateActivity() // Track activity
    
    val player = message.player ?: return
    println("PLAYER_JOINED received: ${player.name} (ID: ${player.id}) in room ${room.roomCode}")
    
    val existingPlayer = room.players.find { it.id == player.id }
    
    if (existingPlayer == null) {
        room.players.add(player)
        println("  → Player ${player.name} added to room. Total players: ${room.players.size}")
    } else {
        // Update existing player state to match the new connection (sync frontend state)
        // This fixes the issue where backend has stale state (e.g. handCount=3) but frontend reset to 1
        existingPlayer.handCount = player.handCount
        existingPlayer.handTeams = player.handTeams
        existingPlayer.handNames = player.handNames
        existingPlayer.isReady = player.isReady
        println("  → Player ${player.name} reconnected. Synced state with frontend.")
    }
    
    room.connections[player.id] = session
    
    if (room.gameState != null) {
        sendGameStateToPlayer(room, session, objectMapper)
    } else {
        broadcastRoomState(room, objectMapper)
    }
}

suspend fun handleUpdateHandCount(
    room: RoomState,
    message: WebSocketMessage,
    objectMapper: ObjectMapper
) {
    room.updateActivity() // Track activity
    
    val playerId = message.playerId ?: return
    val handCount = message.handCount ?: return
    
    val player = room.players.find { it.id == playerId }
    if (player == null) {
        println("⚠️ Update hand count failed: Player $playerId not found")
        return
    }
    
    player.handCount = handCount
    println("Player ${player.name} updated hand count to $handCount")
    
    broadcastRoomState(room, objectMapper)
}

suspend fun handleUpdateTeam(
    room: RoomState,
    message: WebSocketMessage,
    objectMapper: ObjectMapper
) {
    val playerId = message.playerId ?: return
    val team = message.team ?: return
    val handIndex = message.handIndex ?: 0
    
    val player = room.players.find { it.id == playerId }
    if (player == null) {
        println("⚠️ Update team failed: Player $playerId not found")
        return
    }
    
    player.handTeams[handIndex] = team
    println("Player ${player.name} updated hand $handIndex team to $team")
    
    broadcastRoomState(room, objectMapper)
}

suspend fun handleUpdateHandName(
    room: RoomState,
    message: WebSocketMessage,
    objectMapper: ObjectMapper
) {
    val playerId = message.playerId ?: return
    val handName = message.handName ?: return
    val handIndex = message.handIndex ?: 0
    
    val player = room.players.find { it.id == playerId }
    if (player == null) {
        println("⚠️ Update hand name failed: Player $playerId not found")
        return
    }
    
    player.handNames[handIndex] = handName
    println("Player ${player.name} updated hand $handIndex name to $handName")
    
    broadcastRoomState(room, objectMapper)
}

suspend fun handleToggleReady(
    room: RoomState,
    message: WebSocketMessage,
    objectMapper: ObjectMapper
) {
    val playerId = message.playerId ?: return
    val isReady = message.isReady ?: return
    
    val player = room.players.find { it.id == playerId }
    if (player == null) {
        println("⚠️ Toggle ready failed: Player $playerId not found")
        return
    }
    
    player.isReady = isReady
    println("Player ${player.name} ready state: $isReady")
    
    broadcastRoomState(room, objectMapper)
    
    val totalHands = room.players.sumOf { it.handCount }
    val allReady = room.players.all { it.isReady }
    
    // Count hands by team
    var usHands = 0
    var themHands = 0
    room.players.forEach { p ->
        repeat(p.handCount) { handIdx ->
            val team = p.handTeams[handIdx] ?: "Us"
            if (team == "Us") usHands++ else themHands++
        }
    }
    val teamsBalanced = usHands == 2 && themHands == 2
    
    if (allReady && totalHands == 4 && teamsBalanced) {
        println("✓ All conditions met! Starting game...")
        startGame(room, objectMapper)
    }
}

private suspend fun sendGameStateToPlayer(
    room: RoomState,
    session: DefaultWebSocketSession,
    objectMapper: ObjectMapper
) {
    val phase = room.gameState?.get("phase") as? String ?: return
    
    val baseState = mutableMapOf<String, Any?>(
        "type" to phase,
        "phase" to phase,
        "players" to room.players,
        "handAssignments" to room.gameState?.get("handAssignments"),
        "teamScores" to room.gameState?.get("teamScores"),
        "totalPoints" to room.gameState?.get("totalPoints"),
        "pointsToWin" to room.gameState?.get("pointsToWin")
    )
    
    when (phase) {
        "DEALER_SELECTION" -> {
            baseState["dealerGuesses"] = room.gameState?.get("dealerGuesses")
            baseState["message"] = "Each hand must guess a number 1-100 to determine the first dealer!"
        }
        "DEALER_REVEAL" -> {
            baseState["dealerGuesses"] = room.gameState?.get("dealerGuesses")
            baseState["dealerIndex"] = room.gameState?.get("dealerIndex")
        }
        "DEALING" -> {
            baseState["playerHands"] = room.gameState?.get("playerHands")
            baseState["dealerIndex"] = room.gameState?.get("dealerIndex")
        }
        "BIDDING" -> {
            baseState["playerHands"] = room.gameState?.get("playerHands")
            baseState["dealerIndex"] = room.gameState?.get("dealerIndex")
            baseState["currentBidderIndex"] = room.gameState?.get("currentBidderIndex")
            baseState["bids"] = room.gameState?.get("bids")
            baseState["highestBid"] = room.gameState?.get("highestBid")
        }
        "TRUMP_SELECTION" -> {
            baseState["playerHands"] = room.gameState?.get("playerHands")
            baseState["bidWinnerHandId"] = room.gameState?.get("bidWinnerHandId")
            baseState["bidWinnerIndex"] = room.gameState?.get("bidWinnerIndex")
            baseState["winningBid"] = room.gameState?.get("winningBid")
            baseState["highestBid"] = room.gameState?.get("highestBid")
        }
        "PLAYING" -> {
            baseState["playerHands"] = room.gameState?.get("playerHands")
            baseState["trumpSuit"] = room.gameState?.get("trumpSuit")
            baseState["currentPlayerIndex"] = room.gameState?.get("currentPlayerIndex")
            baseState["tricksWon"] = room.gameState?.get("tricksWon")
            baseState["trickNumber"] = room.gameState?.get("trickNumber")
            baseState["bidWinnerHandId"] = room.gameState?.get("bidWinnerHandId")
            baseState["winningBid"] = room.gameState?.get("winningBid")
            baseState["highestBid"] = room.gameState?.get("highestBid")
            val currentTrick = room.gameState?.get("currentTrick") as? Map<String, Any>
            baseState["playedCards"] = currentTrick?.get("playedCards")
        }
        "HAND_COMPLETE", "GAME_COMPLETE" -> {
            baseState.putAll(room.gameState ?: emptyMap())
        }
    }
    
    val gameStateMessage = objectMapper.writeValueAsString(baseState)
    try {
        session.send(Frame.Text(gameStateMessage))
    } catch (e: Exception) {
        println("Error sending game state: ${e.message}")
    }
}

private suspend fun broadcastRoomState(room: RoomState, objectMapper: ObjectMapper) {
    val roomStateMessage = objectMapper.writeValueAsString(
        mapOf(
            "type" to "ROOM_STATE",
            "players" to room.players,
            "playerCount" to room.players.size
        )
    )
    room.connections.values.forEach { session ->
        try {
            session.send(Frame.Text(roomStateMessage))
        } catch (e: Exception) {
            println("Error sending room state: ${e.message}")
        }
    }
}
