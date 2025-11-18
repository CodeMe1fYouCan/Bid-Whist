package com.example.bidwhist.game

import com.example.bidwhist.models.RoomState
import com.fasterxml.jackson.databind.ObjectMapper
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.send

suspend fun scoreHand(room: RoomState, objectMapper: ObjectMapper) {
    val gameState = room.gameState ?: return
    val handAssignments = gameState["handAssignments"] as? List<Map<String, String>> ?: return
    val bidWinnerIndex = gameState["bidWinnerIndex"] as? Int ?: return
    val highestBid = gameState["highestBid"] as? Int ?: return
    val tricksWon = gameState["tricksWon"] as? Map<String, Int> ?: return
    val teamScores = gameState["teamScores"] as? MutableMap<String, Int> ?: return
    val totalPoints = gameState["totalPoints"] as? MutableMap<String, Int> ?: mutableMapOf("Us" to 0, "Them" to 0)
    val pointsToWin = gameState["pointsToWin"] as? Int ?: 11
    
    val bidWinnerAssignment = handAssignments[bidWinnerIndex]
    val biddingTeam = bidWinnerAssignment["team"] as? String ?: "Us"
    val defendingTeam = if (biddingTeam == "Us") "Them" else "Us"
    
    val biddingTeamTricks = tricksWon[biddingTeam] ?: 0
    val defendingTeamTricks = tricksWon[defendingTeam] ?: 0
    
    val tricksNeeded = 6 + highestBid
    
    // Check if trump is "no-trump" for point doubling
    val trumpSuit = gameState["trumpSuit"] as? String
    val isNoTrump = trumpSuit == "no-trump"
    val pointsScored: Map<String, Int>
    
    if (biddingTeamTricks >= tricksNeeded) {
        var points = kotlin.math.max(0, biddingTeamTricks - 6)
        if (isNoTrump) {
            points *= 2  // Double points for no-trump
        }
        teamScores[biddingTeam] = (teamScores[biddingTeam] ?: 0) + points
        totalPoints[biddingTeam] = (totalPoints[biddingTeam] ?: 0) + points
        pointsScored = mapOf(biddingTeam to points, defendingTeam to 0)
    } else {
        var points = highestBid + kotlin.math.max(0, defendingTeamTricks - 6)
        if (isNoTrump) {
            points *= 2  // Double points for no-trump
        }
        teamScores[defendingTeam] = (teamScores[defendingTeam] ?: 0) + points
        totalPoints[defendingTeam] = (totalPoints[defendingTeam] ?: 0) + points
        pointsScored = mapOf(biddingTeam to 0, defendingTeam to points)
    }
    
    val gameOver = teamScores.values.any { it >= pointsToWin }
    
    if (gameOver) {
        val winner = if ((teamScores["Us"] ?: 0) >= pointsToWin) "Us" else "Them"
        val loser = if (winner == "Us") "Them" else "Us"
        
        gameState["phase"] = "GAME_COMPLETE"
        
        // Get winning team player names
        val winningTeamPlayers = handAssignments
            .filter { (it["team"] as? String) == winner }
            .map { it["playerName"] as? String ?: "" }
            .distinct()
        
        // Get losing team player names
        val losingTeamPlayers = handAssignments
            .filter { (it["team"] as? String) == loser }
            .map { it["playerName"] as? String ?: "" }
            .distinct()
        
        val gameOverMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "GAME_COMPLETE",
                "phase" to "GAME_COMPLETE",
                "teamScores" to teamScores,
                "totalPoints" to totalPoints,
                "winner" to winner,
                "winningTeamPlayers" to winningTeamPlayers,
                "losingTeamPlayers" to losingTeamPlayers,
                "tricksWon" to tricksWon,
                "pointsScored" to pointsScored,
                "biddingTeam" to biddingTeam,
                "tricksNeeded" to tricksNeeded,
                "biddingTeamTricks" to biddingTeamTricks,
                "message" to "Game Over! Team $winner wins!"
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(gameOverMessage))
            } catch (e: Exception) {
                println("Error sending game over: ${e.message}")
            }
        }
    } else {
        val currentDealerIndex = gameState["dealerIndex"] as? Int ?: 0
        val nextDealerIndex = (currentDealerIndex + 1) % 4
        
        gameState["phase"] = "HAND_COMPLETE"
        gameState["nextDealerIndex"] = nextDealerIndex
        gameState["handCompleteReadyPlayers"] = mutableSetOf<String>()
        
        val handTricksWon = gameState["handTricksWon"] as? Map<String, Int> ?: emptyMap()
        
        val handCompleteMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "HAND_COMPLETE",
                "phase" to "HAND_COMPLETE",
                "tricksWon" to tricksWon,
                "handTricksWon" to handTricksWon,
                "pointsScored" to pointsScored,
                "teamScores" to teamScores,
                "totalPoints" to totalPoints,
                "biddingTeam" to biddingTeam,
                "tricksNeeded" to tricksNeeded,
                "biddingTeamTricks" to biddingTeamTricks,
                "message" to "Hand complete! Click Ready to continue."
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(handCompleteMessage))
            } catch (e: Exception) {
                println("Error sending hand complete: ${e.message}")
            }
        }
    }
}

suspend fun handleHandCompleteReady(room: RoomState, playerId: String, objectMapper: ObjectMapper) {
    val gameState = room.gameState ?: return
    val readyPlayers = gameState["handCompleteReadyPlayers"] as? MutableSet<String> ?: return
    
    readyPlayers.add(playerId)
    println("📋 Player $playerId ready for next hand (${readyPlayers.size}/${room.players.size})")
    
    val readyUpdate = objectMapper.writeValueAsString(
        mapOf(
            "type" to "HAND_COMPLETE_READY_UPDATE",
            "readyPlayers" to readyPlayers.toList(),
            "readyCount" to readyPlayers.size,
            "totalPlayers" to room.players.size
        )
    )
    room.connections.values.forEach { session ->
        try {
            session.send(Frame.Text(readyUpdate))
        } catch (e: Exception) {
            println("Error sending ready update: ${e.message}")
        }
    }
    
    if (readyPlayers.size >= room.players.size) {
        println("✅ All players ready! Starting next hand...")
        val nextDealerIndex = gameState["nextDealerIndex"] as? Int ?: 0
        dealNewHand(room, objectMapper, nextDealerIndex)
    }
}
