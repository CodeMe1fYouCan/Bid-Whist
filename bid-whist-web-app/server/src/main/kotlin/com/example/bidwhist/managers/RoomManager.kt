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
}
