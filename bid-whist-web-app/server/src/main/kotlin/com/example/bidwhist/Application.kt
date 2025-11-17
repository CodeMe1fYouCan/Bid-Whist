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
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}

// Data classes for WebSocket messages
data class Player @JsonCreator constructor(
    @JsonProperty("id") val id: String,
    @JsonProperty("name") val name: String,
    @JsonProperty("isReady") var isReady: Boolean = false,
    @JsonProperty("handCount") var handCount: Int = 1,
    @JsonProperty("team") var team: String = "Us"
)

data class WebSocketMessage @JsonCreator constructor(
    @JsonProperty("type") val type: String,
    @JsonProperty("player") val player: Player? = null,
    @JsonProperty("playerId") val playerId: String? = null,
    @JsonProperty("handId") val handId: String? = null,
    @JsonProperty("card") val card: Map<String, String>? = null,
    @JsonProperty("isReady") val isReady: Boolean? = null,
    @JsonProperty("handCount") val handCount: Int? = null,
    @JsonProperty("team") val team: String? = null,
    @JsonProperty("guess") val guess: Int? = null,
    @JsonProperty("bidAmount") val bidAmount: Any? = null, // Can be Int or "pass"
    @JsonProperty("trumpSuit") val trumpSuit: String? = null
)

// Room management
private val activeRooms = mutableMapOf<String, RoomState>()
private val objectMapper = ObjectMapper()

data class RoomState(
    val roomCode: String,
    val players: MutableList<Player> = mutableListOf(),
    val connections: MutableMap<String, DefaultWebSocketSession> = mutableMapOf(),
    val createdAt: Long = System.currentTimeMillis(),
    var gameState: MutableMap<String, Any>? = null
)

suspend fun startGame(room: RoomState, objectMapper: ObjectMapper) {
    // Create hand assignments based on player hand counts
    val handAssignments = mutableListOf<Map<String, String>>()
    val aiNames = listOf("Oatmeal", "Reddy", "Jacob")
    var aiNameIndex = 0
    
    room.players.forEach { player ->
        repeat(player.handCount) { handIndex ->
            val displayName = if (handIndex == 0) {
                player.name
            } else {
                // Use AI names for additional hands
                aiNames.getOrNull(aiNameIndex++)?.also { } ?: "${player.name} ${handIndex + 1}"
            }
            
            handAssignments.add(mapOf(
                "playerId" to player.id,
                "playerName" to displayName,
                "handIndex" to handIndex.toString(),
                "team" to player.team
            ))
        }
    }
    
    // Initialize game state (preserve totalPoints if it exists from previous game)
    val existingTotalPoints = room.gameState?.get("totalPoints") as? MutableMap<String, Int>
    
    room.gameState = mutableMapOf(
        "phase" to "DEALER_SELECTION",
        "handAssignments" to handAssignments,
        "teamScores" to mapOf("Us" to 0, "Them" to 0),
        "totalPoints" to (existingTotalPoints ?: mutableMapOf("Us" to 0, "Them" to 0)),
        "pointsToWin" to 11, // Default to 11, can be made configurable
        "dealerGuesses" to mutableMapOf<String, Int>()
    )

    // Broadcast dealer selection phase
    val dealerSelectionMessage = objectMapper.writeValueAsString(
        mapOf(
            "type" to "DEALER_SELECTION",
            "phase" to "DEALER_SELECTION",
            "roomCode" to room.roomCode,
            "players" to room.players,
            "handAssignments" to handAssignments,
            "teamScores" to mapOf("Us" to 0, "Them" to 0),
            "pointsToWin" to 11,
            "message" to "Each hand must guess a number 1-100 to determine the first dealer!"
        )
    )
    room.connections.values.forEach { session ->
        try {
            session.send(Frame.Text(dealerSelectionMessage))
        } catch (e: Exception) {
            println("Error sending dealer selection: ${e.message}")
        }
    }
}

suspend fun handleDealerGuess(room: RoomState, handId: String, guess: Int, objectMapper: ObjectMapper) {
    println("📥 Received dealer guess: handId=$handId, guess=$guess")
    val dealerGuesses = room.gameState?.get("dealerGuesses") as? MutableMap<String, Int> ?: run {
        println("❌ ERROR: dealerGuesses is null or wrong type!")
        return
    }
    dealerGuesses[handId] = guess
    println("   Current dealerGuesses: $dealerGuesses")
    println("   Size: ${dealerGuesses.size}/4")
    println("   Keys: ${dealerGuesses.keys}")
    
    val handAssignments = room.gameState?.get("handAssignments") as? List<Map<String, String>> ?: run {
        println("❌ ERROR: handAssignments is null or wrong type!")
        return
    }
    println("   Expected hand count: ${handAssignments.size}")
    
    // Check if all hands have guessed
    println("   Checking if ${dealerGuesses.size} == ${handAssignments.size}")
    if (dealerGuesses.size >= handAssignments.size) {
        println("✅ All ${handAssignments.size} hands have guessed! Selecting dealer...")
        // Generate random number
        val targetNumber = (1..100).random()
        
        // Find closest guess
        var closestHandId: String? = null
        var closestDiff = Int.MAX_VALUE
        dealerGuesses.forEach { (hId, g) ->
            val diff = kotlin.math.abs(g - targetNumber)
            if (diff < closestDiff) {
                closestDiff = diff
                closestHandId = hId
            }
        }
        
        // Find dealer index
        val dealerIndex = handAssignments.indexOfFirst { 
            "${it["playerId"]}_hand_${it["handIndex"]}" == closestHandId 
        }
        
        println("🎯 Dealer selection complete:")
        println("   Target number: $targetNumber")
        println("   Closest handId: $closestHandId")
        println("   Dealer index: $dealerIndex")
        
        // Update phase to reveal
        room.gameState?.put("phase", "DEALER_REVEAL")
        
        // Broadcast reveal with all guesses and target number
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
        println("📤 Broadcasting DEALER_REVEAL to ${room.connections.size} connections")
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(revealMessage))
                println("   ✓ Sent to connection")
            } catch (e: Exception) {
                println("   ✗ Error sending dealer reveal: ${e.message}")
            }
        }
        
        // Wait for reveal animation
        println("⏳ Waiting 4 seconds for reveal animation...")
        kotlinx.coroutines.delay(4000)
        
        // Deal the hand
        println("🃏 Starting to deal new hand...")
        dealNewHand(room, objectMapper, dealerIndex)
    } else {
        // Broadcast updated guesses
        println("📤 Broadcasting DEALER_GUESS_UPDATE: ${dealerGuesses.size}/4 guesses")
        val updateMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "DEALER_GUESS_UPDATE",
                "guesses" to dealerGuesses,
                "remaining" to (4 - dealerGuesses.size)
            )
        )
        println("   Message: $updateMessage")
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(updateMessage))
            } catch (e: Exception) {
                println("Error sending guess update: ${e.message}")
            }
        }
    }
}

suspend fun handleBid(room: RoomState, handId: String, bidAmount: Any, objectMapper: ObjectMapper) {
    println("🎯 handleBid called: handId=$handId, bidAmount=$bidAmount")
    
    val gameState = room.gameState ?: run {
        println("   ❌ gameState is null")
        return
    }
    val handAssignments = gameState["handAssignments"] as? List<Map<String, String>> ?: run {
        println("   ❌ handAssignments is null or wrong type")
        return
    }
    val bids = gameState["bids"] as? MutableList<Map<String, Any>> ?: run {
        println("   ❌ bids is null or wrong type")
        return
    }
    val currentBidderIndex = gameState["currentBidderIndex"] as? Int ?: run {
        println("   ❌ currentBidderIndex is null")
        return
    }
    val highestBid = gameState["highestBid"] as? Int ?: 0
    val dealerIndex = gameState["dealerIndex"] as? Int ?: run {
        println("   ❌ dealerIndex is null")
        return
    }
    val passedPlayers = gameState["passedPlayers"] as? MutableSet<Int> ?: run {
        println("   ❌ passedPlayers is null or wrong type")
        return
    }
    
    val bidderIndex = handAssignments.indexOfFirst { 
        "${it["playerId"]}_hand_${it["handIndex"]}" == handId 
    }
    
    println("   bidderIndex=$bidderIndex, currentBidderIndex=$currentBidderIndex")
    
    if (bidderIndex != currentBidderIndex) {
        println("   ❌ Not this player's turn! bidderIndex=$bidderIndex, currentBidderIndex=$currentBidderIndex")
        return
    }
    
    // Record the bid
    val bidEntry = mutableMapOf<String, Any>(
        "handId" to handId,
        "handIndex" to bidderIndex
    )
    
    if (bidAmount == "pass") {
        // Check if this is the last player and everyone else has passed
        if (passedPlayers.size == 3 && highestBid == 0) {
            println("   ❌ Cannot pass - you are the last player and must make a bid!")
            // Send error message back to client
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "BID_ERROR",
                    "message" to "You cannot pass - you must make a bid!"
                )
            )
            room.connections[handAssignments[bidderIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        }
        
        bidEntry["amount"] = "pass"
        passedPlayers.add(bidderIndex)
    } else {
        val amount = (bidAmount as? Number)?.toInt() ?: return
        bidEntry["amount"] = amount
        
        // Validate bid range (1-7)
        if (amount < 1 || amount > 7) {
            println("   ❌ Invalid bid amount: $amount (must be 1-7)")
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "BID_ERROR",
                    "message" to "Bid must be between 1 and 7"
                )
            )
            room.connections[handAssignments[bidderIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        }
        
        // Validate bid against highest bid
        val isDealer = bidderIndex == dealerIndex
        val minBid = if (highestBid == 0) 1 else if (isDealer) highestBid else highestBid + 1
        
        println("   Validating bid: amount=$amount, minBid=$minBid, isDealer=$isDealer, highestBid=$highestBid")
        
        if (amount < minBid) {
            println("   ❌ Bid too low: $amount < $minBid")
            val errorMessage = objectMapper.writeValueAsString(
                mapOf(
                    "type" to "BID_ERROR",
                    "message" to "Bid must be at least $minBid"
                )
            )
            room.connections[handAssignments[bidderIndex]["playerId"]]?.send(Frame.Text(errorMessage))
            return
        }
        
        println("   ✅ Bid accepted: $amount")
        gameState["highestBid"] = amount
        gameState["bidWinnerHandId"] = handId
        gameState["bidWinnerIndex"] = bidderIndex
    }
    
    bids.add(bidEntry)
    
    // Check if bidding is complete
    val currentHighestBid = gameState["highestBid"] as? Int ?: 0
    
    println("📊 Bidding status: bids=${bids.size}/4")
    println("   highestBid=$currentHighestBid")
    
    // Bidding ends when all 4 players have bid once
    if (bids.size == 4) {
        // Bidding complete
        println("✅ Bidding complete!")
        
        // Make sure someone actually made a bid (not all passes)
        if (currentHighestBid == 0) {
            println("   ❌ No one made a bid! highestBid is 0")
            return
        }
        
        val winnerHandId = gameState["bidWinnerHandId"] as? String ?: run {
            println("   ❌ bidWinnerHandId is null!")
            return
        }
        val winnerIndex = gameState["bidWinnerIndex"] as? Int ?: run {
            println("   ❌ bidWinnerIndex is null!")
            return
        }
        
        println("   Winner: handId=$winnerHandId, index=$winnerIndex, bid=$currentHighestBid")
        
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
        // Move to next bidder (bidding goes around once, so just increment)
        val nextBidder = (currentBidderIndex + 1) % 4
        gameState["currentBidderIndex"] = nextBidder
        
        println("📤 Moving to next bidder: $nextBidder (bid ${bids.size}/4)")
        
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
        
        println("   Sending BID_UPDATE to ${room.connections.size} connections")
        println("   Message: $bidUpdate")
        
        room.connections.values.forEach { session ->
            try {
                session.send(Frame.Text(bidUpdate))
                println("   ✓ Sent to connection")
            } catch (e: Exception) {
                println("   ✗ Error sending bid update: ${e.message}")
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
    
    println("   playerIndex=$playerIndex, currentPlayerIndex=$currentPlayerIndex")
    
    if (playerIndex != currentPlayerIndex) {
        println("   ❌ Not this player's turn!")
        return
    }
    
    // Get player's current hand
    val currentHand = playerHands[handId]?.toMutableList() ?: mutableListOf()
    
    // Validate the play - must follow suit if possible
    val leadSuit = currentTrick["leadSuit"] as? String
    if (leadSuit != null && playedCards.isNotEmpty()) {
        // Check if player has cards in the lead suit
        val hasLeadSuit = currentHand.any { it["suit"] == leadSuit }
        val playedCardSuit = card["suit"]
        
        if (hasLeadSuit && playedCardSuit != leadSuit) {
            println("   ❌ Must follow suit! Lead suit is $leadSuit but played $playedCardSuit")
            // Send error message back to client
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
    
    // Remove card from player's hand
    currentHand.removeIf { it["suit"] == card["suit"] && it["rank"] == card["rank"] }
    playerHands[handId] = currentHand
    
    // Add card to trick
    playedCards.add(mapOf(
        "handId" to handId,
        "handIndex" to playerIndex,
        "card" to card
    ))
    
    println("   ✅ Card played! playedCards.size=${playedCards.size}")
    
    // Set lead suit if first card
    if (playedCards.size == 1) {
        currentTrick["leadSuit"] = card["suit"] ?: ""
    }
    
    // Check if trick is complete
    if (playedCards.size == 4) {
        // First, send CARD_PLAYED for the 4th card so clients can see it
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
                println("   ✓ Sent CARD_PLAYED for 4th card")
            } catch (e: Exception) {
                println("   ✗ Error sending card played: ${e.message}")
            }
        }
        
        // Small delay to let clients render the 4th card before trick completion
        kotlinx.coroutines.delay(500)
        
        // Determine trick winner
        val trumpSuit = gameState["trumpSuit"] as? String
        val leadSuit = currentTrick["leadSuit"] as? String
        val winnerIndex = determineTrickWinner(playedCards, trumpSuit, leadSuit)
        
        // Update tricks won
        val winnerHandId = playedCards[winnerIndex]["handId"] as String
        val winnerAssignment = handAssignments.find { 
            "${it["playerId"]}_hand_${it["handIndex"]}" == winnerHandId 
        }
        val winnerTeam = winnerAssignment?.get("team") as? String ?: "Us"
        
        val tricksWon = gameState["tricksWon"] as? MutableMap<String, Int> ?: mutableMapOf()
        tricksWon[winnerTeam] = (tricksWon[winnerTeam] ?: 0) + 1
        
        val trickNumber = gameState["trickNumber"] as? Int ?: 1
        
        // Save completed trick before clearing
        val completedTrick = playedCards.toList()
        
        // Check if hand is complete
        if (trickNumber == 13) {
            // Hand complete - calculate scores
            scoreHand(room, objectMapper)
        } else {
            // Start next trick
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
        // Move to next player
        val nextPlayerIndex = (currentPlayerIndex + 1) % 4
        gameState["currentPlayerIndex"] = nextPlayerIndex
        
        println("   📤 Moving to next player: $nextPlayerIndex")
        
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
                println("   ✓ Sent CARD_PLAYED to connection")
            } catch (e: Exception) {
                println("   ✗ Error sending card played: ${e.message}")
            }
        }
    }
}

fun determineTrickWinner(playedCards: List<Map<String, Any>>, trumpSuit: String?, leadSuit: String?): Int {
    var winnerIndex = 0
    var winningCard = (playedCards[0]["card"] as Map<String, String>)
    
    for (i in 1 until playedCards.size) {
        val card = playedCards[i]["card"] as Map<String, String>
        
        // Trump beats non-trump
        if (card["suit"] == trumpSuit && winningCard["suit"] != trumpSuit) {
            winnerIndex = i
            winningCard = card
        } else if (card["suit"] == trumpSuit && winningCard["suit"] == trumpSuit) {
            // Both trump - higher rank wins
            if (compareRanks(card["rank"]!!, winningCard["rank"]!!) > 0) {
                winnerIndex = i
                winningCard = card
            }
        } else if (winningCard["suit"] != trumpSuit && card["suit"] == leadSuit && winningCard["suit"] != leadSuit) {
            // Following lead suit beats off-suit
            winnerIndex = i
            winningCard = card
        } else if (card["suit"] == leadSuit && winningCard["suit"] == leadSuit) {
            // Both lead suit - higher rank wins
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

suspend fun scoreHand(room: RoomState, objectMapper: ObjectMapper) {
    val gameState = room.gameState ?: return
    val handAssignments = gameState["handAssignments"] as? List<Map<String, String>> ?: return
    val bidWinnerIndex = gameState["bidWinnerIndex"] as? Int ?: return
    val highestBid = gameState["highestBid"] as? Int ?: return
    val tricksWon = gameState["tricksWon"] as? Map<String, Int> ?: return
    val teamScores = gameState["teamScores"] as? MutableMap<String, Int> ?: return
    val totalPoints = gameState["totalPoints"] as? MutableMap<String, Int> ?: mutableMapOf("Us" to 0, "Them" to 0)
    val pointsToWin = gameState["pointsToWin"] as? Int ?: 11
    
    // Determine bidding team
    val bidWinnerAssignment = handAssignments[bidWinnerIndex]
    val biddingTeam = bidWinnerAssignment["team"] as? String ?: "Us"
    val defendingTeam = if (biddingTeam == "Us") "Them" else "Us"
    
    val biddingTeamTricks = tricksWon[biddingTeam] ?: 0
    val defendingTeamTricks = tricksWon[defendingTeam] ?: 0
    
    // Check if bidding team made their bid (needs 6 + bid tricks)
    val tricksNeeded = 6 + highestBid
    val pointsScored: Map<String, Int>
    
    if (biddingTeamTricks >= tricksNeeded) {
        // Bidding team made it
        val points = kotlin.math.max(0, biddingTeamTricks - 6)
        teamScores[biddingTeam] = (teamScores[biddingTeam] ?: 0) + points
        totalPoints[biddingTeam] = (totalPoints[biddingTeam] ?: 0) + points
        pointsScored = mapOf(biddingTeam to points, defendingTeam to 0)
    } else {
        // Bidding team missed
        val points = highestBid + kotlin.math.max(0, defendingTeamTricks - 6)
        teamScores[defendingTeam] = (teamScores[defendingTeam] ?: 0) + points
        totalPoints[defendingTeam] = (totalPoints[defendingTeam] ?: 0) + points
        pointsScored = mapOf(biddingTeam to 0, defendingTeam to points)
    }
    
    // Check if game is over
    val gameOver = teamScores.values.any { it >= pointsToWin }
    
    if (gameOver) {
        val winner = if ((teamScores["Us"] ?: 0) >= pointsToWin) "Us" else "Them"
        
        gameState["phase"] = "GAME_COMPLETE"
        
        val gameOverMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "GAME_COMPLETE",
                "phase" to "GAME_COMPLETE",
                "teamScores" to teamScores,
                "totalPoints" to totalPoints,
                "winner" to winner,
                "tricksWon" to tricksWon,
                "pointsScored" to pointsScored,
                "biddingTeam" to biddingTeam,
                "tricksNeeded" to tricksNeeded,
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
        // Start next hand
        val currentDealerIndex = gameState["dealerIndex"] as? Int ?: 0
        val nextDealerIndex = (currentDealerIndex + 1) % 4
        
        // Update phase and store next dealer
        gameState["phase"] = "HAND_COMPLETE"
        gameState["nextDealerIndex"] = nextDealerIndex
        gameState["handCompleteReadyPlayers"] = mutableSetOf<String>()
        
        val handCompleteMessage = objectMapper.writeValueAsString(
            mapOf(
                "type" to "HAND_COMPLETE",
                "phase" to "HAND_COMPLETE",
                "tricksWon" to tricksWon,
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
    
    // Broadcast updated ready status
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
    
    // Check if all players are ready
    if (readyPlayers.size >= room.players.size) {
        println("✅ All players ready! Starting next hand...")
        val nextDealerIndex = gameState["nextDealerIndex"] as? Int ?: 0
        dealNewHand(room, objectMapper, nextDealerIndex)
    }
}

suspend fun dealNewHand(room: RoomState, objectMapper: ObjectMapper, dealerIndex: Int) {
    val handAssignments = room.gameState?.get("handAssignments") as? List<Map<String, String>> ?: return
    
    // Deal cards to all 4 hands (13 cards each)
    val suits = listOf("hearts", "diamonds", "clubs", "spades")
    val ranks = listOf("2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A")
    val allCards = mutableListOf<Map<String, String>>()
    
    for (suit in suits) {
        for (rank in ranks) {
            allCards.add(mapOf("suit" to suit, "rank" to rank))
        }
    }
    allCards.shuffle()
    
    val playerHands = mutableMapOf<String, List<Map<String, String>>>()
    handAssignments.forEachIndexed { index, assignment ->
        val handId = "${assignment["playerId"]}_hand_${assignment["handIndex"]}"
        playerHands[handId] = allCards.subList(index * 13, (index + 1) * 13)
    }

    // First show dealing phase
    room.gameState?.putAll(mapOf(
        "phase" to "DEALING",
        "dealerIndex" to dealerIndex,
        "playerHands" to playerHands,
        "tricksWon" to mapOf("Us" to 0, "Them" to 0)
    ))

    // Broadcast dealing phase
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

    // Wait for dealing animation
    kotlinx.coroutines.delay(3000)

    // Start bidding phase - first bidder is to the left of dealer
    val firstBidderIndex = (dealerIndex + 1) % 4
    
    room.gameState?.putAll(mapOf(
        "phase" to "BIDDING",
        "currentBidderIndex" to firstBidderIndex,
        "bids" to mutableListOf<Map<String, Any>>(),
        "highestBid" to 0,
        "passedPlayers" to mutableSetOf<Int>()
    ))

    // Broadcast bidding phase start
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
                                        
                                        // If game is in progress, send current game state to reconnecting player
                                        println("  → Checking game state: ${room.gameState != null}, phase: ${room.gameState?.get("phase")}")
                                        if (room.gameState != null) {
                                            val phase = room.gameState?.get("phase") as? String
                                            println("  → Game state exists, phase=$phase")
                                            
                                            // Build comprehensive game state message
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
                                                    // Include all data from gameState for these phases
                                                    baseState.putAll(room.gameState ?: emptyMap())
                                                }
                                            }
                                            
                                            println("  → Sending $phase state to ${player.name}")
                                            val gameStateMessage = objectMapper.writeValueAsString(baseState)
                                            try {
                                                this.send(Frame.Text(gameStateMessage))
                                            } catch (e: Exception) {
                                                println("  ⚠ Error sending game state: ${e.message}")
                                            }
                                        } else {
                                            // No game in progress, send room state
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
                                }
                                "UPDATE_HAND_COUNT" -> {
                                    if (wsMessage.playerId != null && wsMessage.handCount != null) {
                                        val player = room.players.find { it.id == wsMessage.playerId }
                                        if (player != null) {
                                            player.handCount = wsMessage.handCount
                                            println("Player ${player.name} updated hand count to ${wsMessage.handCount}")
                                            
                                            // Broadcast updated room state
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
                                    }
                                }
                                "UPDATE_TEAM" -> {
                                    if (wsMessage.playerId != null && wsMessage.team != null) {
                                        val player = room.players.find { it.id == wsMessage.playerId }
                                        if (player != null) {
                                            player.team = wsMessage.team
                                            println("Player ${player.name} updated team to ${wsMessage.team}")
                                            
                                            // Broadcast updated room state
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
                                    }
                                }
                                "TOGGLE_READY" -> {
                                    if (wsMessage.playerId != null && wsMessage.isReady != null) {
                                        val player = room.players.find { it.id == wsMessage.playerId }
                                        if (player != null) {
                                            player.isReady = wsMessage.isReady
                                            println("Player ${player.name} ready state: ${wsMessage.isReady}")
                                            
                                            // Broadcast updated room state
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
                                            
                                            // Check if all players are ready, total hands = 4, and teams balanced
                                            val totalHands = room.players.sumOf { it.handCount }
                                            val allReady = room.players.all { it.isReady }
                                            val usHands = room.players.filter { it.team == "Us" }.sumOf { it.handCount }
                                            val themHands = room.players.filter { it.team == "Them" }.sumOf { it.handCount }
                                            val teamsBalanced = usHands == 2 && themHands == 2
                                            
                                            println("Game start check: allReady=$allReady, totalHands=$totalHands, usHands=$usHands, themHands=$themHands, teamsBalanced=$teamsBalanced")
                                            println("Players: ${room.players.map { "${it.name}(ready=${it.isReady}, hands=${it.handCount}, team=${it.team})" }}")
                                            
                                            if (allReady && totalHands == 4 && teamsBalanced) {
                                                println("✓ All conditions met! Starting game...")
                                                // Auto-start the game
                                                startGame(room, objectMapper)
                                            } else {
                                                println("✗ Not ready to start yet")
                                            }
                                        }
                                    }
                                }

                                "DEALER_GUESS" -> {
                                    println("🎲 DEALER_GUESS message received")
                                    if (wsMessage.handId != null && wsMessage.guess != null) {
                                        println("   handId: ${wsMessage.handId}, guess: ${wsMessage.guess}")
                                        handleDealerGuess(room, wsMessage.handId, wsMessage.guess, objectMapper)
                                    } else {
                                        println("   ❌ Missing handId or guess! handId=${wsMessage.handId}, guess=${wsMessage.guess}")
                                    }
                                }
                                "PLACE_BID" -> {
                                    println("🎰 PLACE_BID message received")
                                    if (wsMessage.handId != null && wsMessage.bidAmount != null) {
                                        println("   handId: ${wsMessage.handId}, bidAmount: ${wsMessage.bidAmount}")
                                        handleBid(room, wsMessage.handId, wsMessage.bidAmount, objectMapper)
                                    } else {
                                        println("   ❌ Missing handId or bidAmount! handId=${wsMessage.handId}, bidAmount=${wsMessage.bidAmount}")
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
                // Remove only the connection, keep players in the room for reconnection
                val roomCode = call.parameters["roomCode"]?.uppercase()
                if (roomCode != null) {
                    val room = activeRooms[roomCode]
                    if (room != null) {
                        // Find which player(s) had this connection
                        val disconnectedPlayers = room.players.filter { player ->
                            room.connections[player.id] == this
                        }
                        
                        // Remove the connection but keep the player in the room
                        disconnectedPlayers.forEach { player ->
                            room.connections.remove(player.id)
                            println("Player ${player.name} disconnected from room $roomCode (connection removed, player kept for reconnection)")
                        }
                        
                        println("Room $roomCode now has ${room.connections.size} active connections and ${room.players.size} players")
                    }
                }
            }
        }

        // Additional routes for game sessions and matchmaking can be added here
    }
}