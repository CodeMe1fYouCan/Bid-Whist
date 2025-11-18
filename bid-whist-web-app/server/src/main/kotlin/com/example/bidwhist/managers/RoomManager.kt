package com.example.bidwhist.managers

import com.example.bidwhist.models.RoomState

object RoomManager {
    private val activeRooms = mutableMapOf<String, RoomState>()
    
    fun getOrCreateRoom(roomCode: String): RoomState {
        return activeRooms.getOrPut(roomCode) { RoomState(roomCode) }
    }
    
    fun roomExists(roomCode: String): Boolean {
        return activeRooms.containsKey(roomCode)
    }
    
    fun getRoom(roomCode: String): RoomState? {
        return activeRooms[roomCode]
    }
    
    fun removeRoom(roomCode: String) {
        activeRooms.remove(roomCode)
    }
    
    /**
     * Clean up inactive rooms to prevent memory leaks
     * Removes rooms that have been inactive for the specified timeout
     * and have no active connections
     */
    fun cleanupInactiveRooms(timeoutMinutes: Long = 60): Int {
        val roomsToRemove = activeRooms.filter { (_, room) ->
            room.isInactive(timeoutMinutes) && room.connections.isEmpty()
        }
        
        roomsToRemove.keys.forEach { roomCode ->
            activeRooms.remove(roomCode)
        }
        
        if (roomsToRemove.isNotEmpty()) {
            println("🧹 Cleaned up ${roomsToRemove.size} inactive room(s): ${roomsToRemove.keys.joinToString(", ")}")
        }
        
        return roomsToRemove.size
    }
    
    /**
     * Get statistics about active rooms
     */
    fun getRoomStats(): Map<String, Any> {
        val totalRooms = activeRooms.size
        val roomsWithPlayers = activeRooms.count { it.value.players.isNotEmpty() }
        val roomsWithConnections = activeRooms.count { it.value.connections.isNotEmpty() }
        val totalPlayers = activeRooms.values.sumOf { it.players.size }
        val totalConnections = activeRooms.values.sumOf { it.connections.size }
        
        return mapOf(
            "totalRooms" to totalRooms,
            "roomsWithPlayers" to roomsWithPlayers,
            "roomsWithConnections" to roomsWithConnections,
            "totalPlayers" to totalPlayers,
            "totalConnections" to totalConnections
        )
    }
}
