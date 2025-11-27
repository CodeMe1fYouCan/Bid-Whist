package com.example.bidwhist.game

import com.example.bidwhist.models.RoomState
import com.fasterxml.jackson.databind.ObjectMapper

suspend fun startGame(room: RoomState, objectMapper: ObjectMapper) {
        val aiNames = listOf("Oatmeal", "Reddy", "Jacob")
        var aiNameIndex = 0

        val allHands = mutableListOf<Map<String, String>>()
        room.players.forEach { player ->
                repeat(player.handCount) { handIndex ->
                        val displayName =
                                if (handIndex == 0) {
                                        player.name
                                } else {
                                        aiNames.getOrNull(aiNameIndex++)?.also {}
                                                ?: "${player.name} ${handIndex + 1}"
                                }

                        val team = player.handTeams[handIndex] ?: "Us"

                        allHands.add(
                                mapOf(
                                        "playerId" to player.id,
                                        "playerName" to displayName,
                                        "handIndex" to handIndex.toString(),
                                        "team" to team
                                )
                        )
                }
        }

        val usHands = allHands.filter { it["team"] == "Us" }
        val themHands = allHands.filter { it["team"] == "Them" }

        val handAssignments = mutableListOf<Map<String, String>>()
        if (usHands.size >= 1) handAssignments.add(usHands[0])
        if (themHands.size >= 1) handAssignments.add(themHands[0])
        if (usHands.size >= 2) handAssignments.add(usHands[1])
        if (themHands.size >= 2) handAssignments.add(themHands[1])

        val existingTotalPoints = room.gameState?.get("totalPoints") as? MutableMap<String, Int>

        // Randomly select dealer index (0-3)
        val dealerIndex = (0 until handAssignments.size).random()
        println(
                "🎲 Randomly selected dealer: index $dealerIndex (${handAssignments[dealerIndex]["playerName"]})"
        )

        room.gameState =
                mutableMapOf(
                        "phase" to "BIDDING",
                        "handAssignments" to handAssignments,
                        "teamScores" to mapOf("Us" to 0, "Them" to 0),
                        "totalPoints" to
                                (existingTotalPoints ?: mutableMapOf("Us" to 0, "Them" to 0)),
                        "pointsToWin" to 11,
                        "dealerIndex" to dealerIndex
                )

        // Immediately deal cards with the randomly selected dealer
        dealNewHand(room, objectMapper, dealerIndex)
}
