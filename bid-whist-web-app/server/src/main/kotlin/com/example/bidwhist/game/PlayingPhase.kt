package com.example.bidwhist.game

import com.example.bidwhist.models.RoomState
import com.fasterxml.jackson.databind.ObjectMapper
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.send
import kotlinx.coroutines.delay

suspend fun handleCardPlay(room: RoomState, handId: String, card: Map<String, String>, objectMapper: ObjectMapper) {
    println("🃏 handleCardPlay: handId=$handId, card=$card")
    val gameState = room.gameState ?: return
    val handAssignments = gameState["handAssignments"] as? List<Map<String, String>> ?: return
    val currentPlayerIndex = gameState["currentPlayerIndex"] as? Int ?: return
    val currentTrick = gameState["currentTrick"] as? MutableMap<String, Any> ?: return
    val playedCards = currentTrick["playedCards"] as? MutableList<Map<String, Any>> ?: return
    val playerHands = gameState["playerHands"] as? MutableMap<String, List<Map<String, String>>> ?: return
    
    val playerIndex = handAssignments.indexOfFirst { 
        "${it["playerId"]}_hand_${it["handIndex"]}" == handId 
    }
    
    if (playerIndex != currentPlayerIndex) {
        println("❌ Not this player's turn!")
        return
    }
    
    val currentHand = playerHands[handId]?.toMutableList() ?: mutableListOf()
    
    val leadSuit = currentTrick["leadSuit"] as? String
    if (leadSuit != null && playedCards.isNotEmpty()) {
        val hasLeadSuit = currentHand.any { it["suit"] == leadSuit }
        val playedCardSuit = card["suit"]
        
        if (hasLeadSuit && playedCardSuit != leadSuit) {
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "PLAY_ERROR",
                    "message" to "You must follow suit! Lead suit is $leadSuit"
                )
            )
            room.connections[handAssignments[playerIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        }
    }
    
    currentHand.removeIf { it["suit"] == card["suit"] && it["rank"] == card["rank"] }
    playerHands[handId] = currentHand
    
    playedCards.add(mapOf(
        "handId" to handId,
        "handIndex" to playerIndex,
        "card" to card
    ))
    
    if (playedCards.size == 1) {
        currentTrick["leadSuit"] = card["suit"] ?: ""
    }
    
    if (playedCards.size == 4) {
        val cardPlayedMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "CARD_PLAYED",
                "handId" to handId,
                "card" to card,
                "currentPlayerIndex" to currentPlayerIndex,
                "playedCards" to playedCards,
                "playerHands" to playerHands
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(cardPlayedMessage))
            } catch (e: Exception) {
                println("Error sending card played: ${e.message}")
            }
        }
        
        delay(500)
        
        val trumpSuit = gameState["trumpSuit"] as? String
        val winnerIndex = determineTrickWinner(playedCards, trumpSuit, leadSuit)
        
        val winnerHandId = playedCards[winnerIndex]["handId"] as String
        val winnerAssignment = handAssignments.find { 
            "${it["playerId"]}_hand_${it["handIndex"]}" == winnerHandId 
        }
        val winnerTeam = winnerAssignment?.get("team") as? String ?: "Us"
        
        val tricksWon = gameState["tricksWon"] as? MutableMap<String, Int> ?: mutableMapOf()
        tricksWon[winnerTeam] = (tricksWon[winnerTeam] ?: 0) + 1
        
        val handTricksWon = gameState["handTricksWon"] as? MutableMap<String, Int> ?: mutableMapOf()
        handTricksWon[winnerHandId] = (handTricksWon[winnerHandId] ?: 0) + 1
        gameState["handTricksWon"] = handTricksWon
        
        val trickNumber = gameState["trickNumber"] as? Int ?: 1
        val completedTrick = playedCards.toList()
        
        if (trickNumber == 13) {
            scoreHand(room, objectMapper)
        } else {
            gameState["trickNumber"] = trickNumber + 1
            gameState["currentPlayerIndex"] = playedCards[winnerIndex]["handIndex"] as Int
            gameState["currentTrick"] = mutableMapOf<String, Any?>(
                "leadSuit" to null,
                "playedCards" to mutableListOf<Map<String, Any>>()
            )
            
            val nextTrickMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "TRICK_COMPLETE",
                    "winnerHandId" to winnerHandId,
                    "tricksWon" to tricksWon,
                    "trickNumber" to (trickNumber + 1),
                    "currentPlayerIndex" to playedCards[winnerIndex]["handIndex"],
                    "completedTrick" to completedTrick
                )
            )
            room.connections.values.forEach { session ->
                try {
                    session.send(Frame.Text(nextTrickMessage))
                } catch (e: Exception) {
                    println("Error sending next trick: ${e.message}")
                }
            }
        }
    } else {
        val nextPlayerIndex = (currentPlayerIndex + 1) % 4
        gameState["currentPlayerIndex"] = nextPlayerIndex
        
        val cardPlayedMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "CARD_PLAYED",
                "handId" to handId,
                "card" to card,
                "currentPlayerIndex" to nextPlayerIndex,
                "playedCards" to playedCards,
                "playerHands" to playerHands
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(cardPlayedMessage))
            } catch (e: Exception) {
                println("Error sending card played: ${e.message}")
            }
        }
    }
}

fun determineTrickWinner(playedCards: List<Map<String, Any>>, trumpSuit: String?, leadSuit: String?): Int {
    var winnerIndex = 0
    var winningCard = (playedCards[0]["card"] as Map<String, String>)
    
    for (i in 1 until playedCards.size) {
        val card = playedCards[i]["card"] as Map<String, String>
        
        if (card["suit"] == trumpSuit && winningCard["suit"] != trumpSuit) {
            winnerIndex = i
            winningCard = card
        } else if (card["suit"] == trumpSuit && winningCard["suit"] == trumpSuit) {
            if (compareRanks(card["rank"]!!, winningCard["rank"]!!) > 0) {
                winnerIndex = i
                winningCard = card
            }
        } else if (winningCard["suit"] != trumpSuit && card["suit"] == leadSuit && winningCard["suit"] != leadSuit) {
            winnerIndex = i
            winningCard = card
        } else if (card["suit"] == leadSuit && winningCard["suit"] == leadSuit) {
            if (compareRanks(card["rank"]!!, winningCard["rank"]!!) > 0) {
                winnerIndex = i
                winningCard = card
            }
        }
    }
    
    return winnerIndex
}

fun compareRanks(rank1: String, rank2: String): Int {
    val rankOrder = listOf("2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A")
    return rankOrder.indexOf(rank1) - rankOrder.indexOf(rank2)
}
