package com.example.bidwhist

import java.util.UUID
import kotlin.collections.HashMap

data class Room(val id: String, val players: MutableList<PlayerConnection>, val hands: MutableMap<PlayerConnection, Int>)

class RoomManager {
    private val rooms: MutableMap<String, Room> = HashMap()

    fun createRoom(): String {
        val roomId = UUID.randomUUID().toString()
        rooms[roomId] = Room(roomId, mutableListOf(), mutableMapOf())
        return roomId
    }

    fun joinRoom(roomId: String, player: PlayerConnection): Boolean {
        val room = rooms[roomId] ?: return false
        if (room.players.size < 4) {
            room.players.add(player)
            return true
        }
        return false
    }

    fun leaveRoom(roomId: String, player: PlayerConnection) {
        val room = rooms[roomId]
        room?.players?.remove(player)
    }

    fun getRoom(roomId: String): Room? {
        return rooms[roomId]
    }

    fun startGame(roomId: String) {
        val room = rooms[roomId] ?: return
        // Logic to start the game, dealing cards, etc.
    }
}