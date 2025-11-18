package com.example.bidwhist.game

import com.example.bidwhist.models.RoomState
import com.fasterxml.jackson.databind.ObjectMapper
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.send
import kotlinx.coroutines.delay

suspend fun handleDealerGuess(room: RoomState, handId: String, guess: Int, objectMapper: ObjectMapper) {
    println("📥 Received dealer guess: handId=$handId, guess=$guess")
    val dealerGuesses = room.gameState?.get("dealerGuesses") as? MutableMap<String, Int> ?: run {
        println("❌ ERROR: dealerGuesses is null or wrong type!")
        return
    }
    dealerGuesses[handId] = guess
    println("   Current dealerGuesses: $dealerGuesses")
    
    val handAssignments = room.gameState?.get("handAssignments") as? List<Map<String, String>> ?: run {
        println("❌ ERROR: handAssignments is null or wrong type!")
        return
    }
    
    if (dealerGuesses.size >= handAssignments.size) {
        println("✅ All ${handAssignments.size} hands have guessed! Selecting dealer...")
        val targetNumber = (1..100).random()
        
        var closestHandId: String? = null
        var closestDiff = Int.MAX_VALUE
        dealerGuesses.forEach { (hId, g) ->
            val diff = kotlin.math.abs(g - targetNumber)
            if (diff < closestDiff) {
                closestDiff = diff
                closestHandId = hId
            }
        }
        
        val dealerIndex = handAssignments.indexOfFirst { 
            "${it["playerId"]}_hand_${it["handIndex"]}" == closestHandId 
        }
        
        println("🎯 Dealer selection complete: Target=$targetNumber, Dealer=$closestHandId at index $dealerIndex")
        
        room.gameState?.put("phase", "DEALER_REVEAL")
        
        val revealMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "DEALER_REVEAL",
                "phase" to "DEALER_REVEAL",
                "targetNumber" to targetNumber,
                "guesses" to dealerGuesses,
                "dealerHandId" to closestHandId,
                "dealerIndex" to dealerIndex,
                "handAssignments" to handAssignments,
                "message" to "Target was $targetNumber!"
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(revealMessage))
            } catch (e: Exception) {
                println("Error sending dealer reveal: ${e.message}")
            }
        }
        
        delay(4000)
        dealNewHand(room, objectMapper, dealerIndex)
    } else {
        val updateMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "DEALER_GUESS_UPDATE",
                "guesses" to dealerGuesses,
                "remaining" to (4 - dealerGuesses.size)
            )
        )
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(updateMessage))
            } catch (e: Exception) {
                println("Error sending guess update: ${e.message}")
            }
        }
    }
}
