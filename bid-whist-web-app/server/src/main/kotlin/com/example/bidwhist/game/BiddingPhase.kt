package com.example.bidwhist.game

import com.example.bidwhist.models.RoomState
import com.fasterxml.jackson.databind.ObjectMapper
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.send

suspend fun handleBid(room: RoomState, handId: String, bidAmount: Any, objectMapper: ObjectMapper) {
    println("🎯 handleBid called: handId=$handId, bidAmount=$bidAmount")
    
    val gameState = room.gameState ?: return
    val handAssignments = gameState["handAssignments"] as? List<Map<String, String>> ?: return
    val bids = gameState["bids"] as? MutableList<Map<String, Any>> ?: return
    val currentBidderIndex = gameState["currentBidderIndex"] as? Int ?: return
    val highestBid = gameState["highestBid"] as? Int ?: 0
    val dealerIndex = gameState["dealerIndex"] as? Int ?: return
    val passedPlayers = gameState["passedPlayers"] as? MutableSet<Int> ?: return
    
    val bidderIndex = handAssignments.indexOfFirst { 
        "${it["playerId"]}_hand_${it["handIndex"]}" == handId 
    }
    
    if (bidderIndex != currentBidderIndex) {
        println("❌ Not this player's turn!")
        return
    }
    
    val bidEntry = mutableMapOf<String, Any>(
        "handId" to handId,
        "handIndex" to bidderIndex
    )
    
    if (bidAmount == "pass") {
        if (bidderIndex == dealerIndex && passedPlayers.size == 3 && highestBid == 0) {
            println("🎯 Dealer cannot pass when everyone else has passed - forcing bid of 1")
            bidEntry["amount"] = 1
            gameState["highestBid"] = 1
            gameState["bidWinnerHandId"] = handId
            gameState["bidWinnerIndex"] = bidderIndex
        } else if (passedPlayers.size == 3 && highestBid == 0) {
            println("❌ Cannot pass - you are the last player and must make a bid!")
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "BID_ERROR",
                    "message" to "You cannot pass - you must make a bid!"
                )
            )
            room.connections[handAssignments[bidderIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        } else {
            bidEntry["amount"] = "pass"
            passedPlayers.add(bidderIndex)
        }
    } else {
        val amount = (bidAmount as? Number)?.toInt() ?: return
        bidEntry["amount"] = amount
        
        if (amount < 1 || amount > 7) {
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "BID_ERROR",
                    "message" to "Bid must be between 1 and 7"
                )
            )
            room.connections[handAssignments[bidderIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        }
        
        val isDealer = bidderIndex == dealerIndex
        val minBid = if (highestBid == 0) 1 else if (isDealer) highestBid else highestBid + 1
        
        if (amount < minBid) {
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "BID_ERROR",
                    "message" to "Bid must be at least $minBid"
                )
            )
            room.connections[handAssignments[bidderIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        }
        
        gameState["highestBid"] = amount
        gameState["bidWinnerHandId"] = handId
        gameState["bidWinnerIndex"] = bidderIndex
    }
    
    bids.add(bidEntry)
    
    val currentHighestBid = gameState["highestBid"] as? Int ?: 0
    
    if (bids.size == 4) {
        println("✅ Bidding complete!")
        
        if (currentHighestBid == 0) {
            println("❌ No one made a bid!")
            return
        }
        
        val winnerHandId = gameState["bidWinnerHandId"] as? String ?: return
        val winnerIndex = gameState["bidWinnerIndex"] as? Int ?: return
        
        gameState["phase"] = "TRUMP_SELECTION"
        
        val trumpMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "TRUMP_SELECTION",
                "phase" to "TRUMP_SELECTION",
                "bidWinnerHandId" to winnerHandId,
                "bidWinnerIndex" to winnerIndex,
                "winningBid" to currentHighestBid,
                "bids" to bids,
                "message" to "Bid winner selects trump!"
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(trumpMessage))
            } catch (e: Exception) {
                println("Error sending trump selection: ${e.message}")
            }
        }
    } else {
        val nextBidder = (currentBidderIndex + 1) % 4
        gameState["currentBidderIndex"] = nextBidder
        
        val bidUpdate = objectMapper.writeValueAsString(
            mapOf(
                "type" to "BID_UPDATE",
                "phase" to "BIDDING",
                "bids" to bids,
                "currentBidderIndex" to nextBidder,
                "highestBid" to currentHighestBid,
                "handAssignments" to handAssignments,
                "playerHands" to gameState["playerHands"]
            )
        )
        
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(bidUpdate))
            } catch (e: Exception) {
                println("Error sending bid update: ${e.message}")
            }
        }
    }
}

suspend fun handleTrumpSelection(room: RoomState, trumpSuit: String, objectMapper: ObjectMapper) {
    val gameState = room.gameState ?: return
    val bidWinnerIndex = gameState["bidWinnerIndex"] as? Int ?: return
    
    gameState["phase"] = "PLAYING"
    gameState["trumpSuit"] = trumpSuit
    gameState["currentPlayerIndex"] = bidWinnerIndex
    gameState["currentTrick"] = mutableMapOf<String, Any?>(
        "leadSuit" to null,
        "playedCards" to mutableListOf<Map<String, Any>>()
    )
    gameState["trickNumber"] = 1
    
    val playMessage = objectMapper.writeValueAsString(
        mapOf(
            "type" to "PLAYING_PHASE",
            "phase" to "PLAYING",
            "trumpSuit" to trumpSuit,
            "currentPlayerIndex" to bidWinnerIndex,
            "trickNumber" to 1,
            "tricksWon" to gameState["tricksWon"],
            "message" to "Trump selected! Bid winner leads."
        )
    )
    room.connections.values.forEach { session ->
        try {
            session.send(Frame.Text(playMessage))
        } catch (e: Exception) {
            println("Error sending play phase: ${e.message}")
        }
    }
}
