package com.example.bidwhist.game

import com.example.bidwhist.models.RoomState
import com.fasterxml.jackson.databind.ObjectMapper
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.send
import kotlinx.coroutines.delay

/**
 * Check if a hand is a misdeal (no face cards: J, Q, K, A)
 */
fun isMisdeal(hand: List<Map<String, String>>): Boolean {
    val faceCards = setOf("J", "Q", "K", "A")
    return hand.none { card -> card["rank"] in faceCards }
}

suspend fun dealNewHand(room: RoomState, objectMapper: ObjectMapper, dealerIndex: Int) {
    val handAssignments = room.gameState?.get("handAssignments") as? List<Map<String, String>> ?: return
    
    val suits = listOf("hearts", "diamonds", "clubs", "spades")
    val ranks = listOf("2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A")
    
    var playerHands: MutableMap<String, List<Map<String, String>>>
    var attemptCount = 0
    val maxAttempts = 100 // Prevent infinite loop (extremely unlikely to need this many)
    
    // Keep dealing until we get a valid deal (no misdeals)
    do {
        attemptCount++
        val allCards = mutableListOf<Map<String, String>>()
        
        for (suit in suits) {
            for (rank in ranks) {
                allCards.add(mapOf("suit" to suit, "rank" to rank))
            }
        }
        allCards.shuffle()
        
        playerHands = mutableMapOf()
        handAssignments.forEachIndexed { index, assignment ->
            val handId = "${assignment["playerId"]}_hand_${assignment["handIndex"]}"
            // Create a new list to avoid shared references
            playerHands[handId] = allCards.subList(index * 13, (index + 1) * 13).toList()
        }
        
        // Verify no duplicate cards across all hands
        val allDealtCards = playerHands.values.flatten()
        val uniqueCards = allDealtCards.map { "${it["suit"]}-${it["rank"]}" }.toSet()
        if (uniqueCards.size != 52) {
            println("❌ ERROR: Duplicate cards detected in deal! Unique: ${uniqueCards.size}, Total: ${allDealtCards.size}")
            println("   Hands: $playerHands")
        } else {
            println("✓ Deal verified: 52 unique cards distributed")
        }
        
        // Check for misdeals
        val hasMisdeal = playerHands.values.any { hand -> isMisdeal(hand) }
        
        if (hasMisdeal) {
            println("⚠️ Misdeal detected (hand with no face cards), re-dealing... (attempt $attemptCount)")
        } else {
            if (attemptCount > 1) {
                println("✓ Valid deal found after $attemptCount attempts")
            }
            break
        }
    } while (attemptCount < maxAttempts)

    val handTricksWon = mutableMapOf<String, Int>()
    handAssignments.forEach { assignment ->
        val handId = "${assignment["playerId"]}_hand_${assignment["handIndex"]}"
        handTricksWon[handId] = 0
    }
    
    room.gameState?.putAll(mapOf(
        "phase" to "DEALING",
        "dealerIndex" to dealerIndex,
        "playerHands" to playerHands,
        "tricksWon" to mapOf("Us" to 0, "Them" to 0),
        "handTricksWon" to handTricksWon
    ))

    val dealingMessage = objectMapper.writeValueAsString(
        mapOf(
            "type" to "DEALING_PHASE",
            "phase" to "DEALING",
            "roomCode" to room.roomCode,
            "handAssignments" to handAssignments,
            "playerHands" to playerHands,
            "dealerIndex" to dealerIndex,
            "teamScores" to room.gameState?.get("teamScores"),
            "pointsToWin" to room.gameState?.get("pointsToWin"),
            "message" to "Dealing cards..."
        )
    )
    room.connections.values.forEach { session ->
        try {
            session.send(Frame.Text(dealingMessage))
        } catch (e: Exception) {
            println("Error sending dealing phase: ${e.message}")
        }
    }

    delay(3000)

    val firstBidderIndex = (dealerIndex + 1) % 4
    
    room.gameState?.putAll(mapOf(
        "phase" to "BIDDING",
        "currentBidderIndex" to firstBidderIndex,
        "bids" to mutableListOf<Map<String, Any>>(),
        "highestBid" to 0,
        "passedPlayers" to mutableSetOf<Int>()
    ))

    val biddingMessage = objectMapper.writeValueAsString(
        mapOf(
            "type" to "BIDDING_PHASE",
            "phase" to "BIDDING",
            "roomCode" to room.roomCode,
            "handAssignments" to handAssignments,
            "playerHands" to playerHands,
            "dealerIndex" to dealerIndex,
            "currentBidderIndex" to firstBidderIndex,
            "bids" to emptyList<Any>(),
            "highestBid" to 0,
            "teamScores" to room.gameState?.get("teamScores"),
            "pointsToWin" to room.gameState?.get("pointsToWin"),
            "message" to "Bidding phase! Starting bid is 1."
        )
    )
    room.connections.values.forEach { session ->
        try {
            session.send(Frame.Text(biddingMessage))
        } catch (e: Exception) {
            println("Error sending bidding phase: ${e.message}")
        }
    }
}
