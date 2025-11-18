package com.example.bidwhist.security

import com.example.bidwhist.managers.RoomManager
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Security configuration and utilities
 */
object SecurityConfig {
    // CORS allowed origins (set via environment variable)
    val allowedOrigins: List<String> = System.getenv("ALLOWED_ORIGINS")
        ?.split(",")
        ?.map { it.trim() }
        ?: listOf("*") // Default to allow all (for development)
    
    // Room cleanup settings
    const val ROOM_INACTIVE_TIMEOUT_MINUTES = 60L // 1 hour
    const val CLEANUP_INTERVAL_MINUTES = 15L // Check every 15 minutes
    
    // Rate limiting (simple in-memory)
    private val requestCounts = mutableMapOf<String, MutableList<Long>>()
    const val MAX_REQUESTS_PER_MINUTE = 60
    
    /**
     * Check if request should be rate limited
     */
    fun isRateLimited(clientId: String): Boolean {
        val now = System.currentTimeMillis()
        val requests = requestCounts.getOrPut(clientId) { mutableListOf() }
        
        // Remove requests older than 1 minute
        requests.removeIf { it < now - 60000 }
        
        // Check if over limit
        if (requests.size >= MAX_REQUESTS_PER_MINUTE) {
            return true
        }
        
        // Add current request
        requests.add(now)
        return false
    }
    
    /**
     * Validate room code format (4-8 uppercase alphanumeric characters)
     * Matches frontend validation in roomCodeValidator.ts
     */
    fun isValidRoomCode(roomCode: String?): Boolean {
        if (roomCode == null) return false
        return roomCode.matches(Regex("^[A-Z0-9]{4,8}$"))
    }
    
    /**
     * Validate player name (1-20 characters, alphanumeric and spaces only)
     */
    fun isValidPlayerName(name: String?): Boolean {
        if (name == null) return false
        return name.isNotBlank() && 
               name.length in 1..20 && 
               name.matches(Regex("^[a-zA-Z0-9 ]+$"))
    }
    
    /**
     * Validate player ID format (UUID-like)
     */
    fun isValidPlayerId(id: String?): Boolean {
        if (id == null) return false
        return id.isNotBlank() && id.length <= 50
    }
    
    /**
     * Validate hand count (1-3)
     */
    fun isValidHandCount(count: Int?): Boolean {
        return count != null && count in 1..3
    }
    
    /**
     * Validate team name
     */
    fun isValidTeam(team: String?): Boolean {
        return team == "Us" || team == "Them"
    }
    
    /**
     * Validate card suit (case-insensitive)
     */
    fun isValidSuit(suit: String?): Boolean {
        if (suit == null) return false
        val validSuits = listOf("hearts", "diamonds", "clubs", "spades")
        return suit.lowercase() in validSuits
    }
    
    /**
     * Validate trump suit (includes "no-trump" option)
     */
    fun isValidTrumpSuit(suit: String?): Boolean {
        if (suit == null) return false
        val validTrumpSuits = listOf("hearts", "diamonds", "clubs", "spades", "no-trump")
        return suit.lowercase() in validTrumpSuits
    }
    
    /**
     * Validate card rank
     */
    fun isValidRank(rank: String?): Boolean {
        if (rank == null) return false
        val validRanks = listOf("2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A")
        return rank in validRanks || rank.uppercase() in validRanks
    }
    
    /**
     * Validate bid amount (1-7 or "pass")
     */
    fun isValidBid(bid: Any?): Boolean {
        return when (bid) {
            is Int -> bid in 1..7
            is String -> bid == "pass" || bid == "Pass"
            else -> false
        }
    }
    
    /**
     * Validate dealer guess (1-100)
     */
    fun isValidGuess(guess: Int?): Boolean {
        return guess != null && guess in 1..100
    }
    
    /**
     * Sanitize input string
     */
    fun sanitize(input: String): String {
        return input.trim().take(100) // Limit length and trim whitespace
    }
    
    /**
     * Start background room cleanup task
     */
    @OptIn(DelicateCoroutinesApi::class)
    fun startRoomCleanup() {
        GlobalScope.launch {
            while (true) {
                delay(CLEANUP_INTERVAL_MINUTES * 60 * 1000)
                cleanupInactiveRooms()
            }
        }
    }
    
    /**
     * Remove rooms that have been inactive
     */
    private fun cleanupInactiveRooms() {
        val now = Instant.now()
        
        // This would need to be implemented in RoomManager
        // For now, just log that cleanup ran
        println("🧹 Room cleanup task ran at $now")
        
        // TODO: Implement actual cleanup logic in RoomManager
        // - Track last activity time per room
        // - Remove rooms with no activity for ROOM_INACTIVE_TIMEOUT_MINUTES
    }
}
