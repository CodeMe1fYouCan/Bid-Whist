/**
 * In-memory room management
 * Tracks active rooms and prevents duplicate room codes
 */

export interface RoomUser {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Room {
  code: string;
  createdAt: number;
  users: RoomUser[];
  isActive: boolean;
}

// In-memory store of active rooms (key: roomCode, value: Room)
const activeRooms = new Map<string, Room>();

/**
 * Check if a room code is already in use
 */
export const isRoomCodeTaken = (code: string): boolean => {
  const room = activeRooms.get(code.toUpperCase());
  return room !== undefined && room.isActive;
};

/**
 * Create a new room (if code is not taken)
 */
export const createRoom = (code: string, user: RoomUser): Room | null => {
  const normalizedCode = code.toUpperCase();
  
  if (isRoomCodeTaken(normalizedCode)) {
    console.warn(`Room code ${normalizedCode} is already in use`);
    return null;
  }

  const room: Room = {
    code: normalizedCode,
    createdAt: Date.now(),
    users: [user],
    isActive: true,
  };

  activeRooms.set(normalizedCode, room);
  console.log(`Room ${normalizedCode} created with user ${user.name}`);
  return room;
};

/**
 * Join an existing room
 */
export const joinRoom = (code: string, user: RoomUser): Room | null => {
  const normalizedCode = code.toUpperCase();
  const room = activeRooms.get(normalizedCode);

  if (!room || !room.isActive) {
    console.warn(`Room ${normalizedCode} does not exist or is closed`);
    return null;
  }

  // Check if user is already in room
  if (!room.users.some(u => u.id === user.id)) {
    room.users.push(user);
    console.log(`User ${user.name} joined room ${normalizedCode}`);
  }

  return room;
};

/**
 * Get room details
 */
export const getRoom = (code: string): Room | null => {
  const normalizedCode = code.toUpperCase();
  const room = activeRooms.get(normalizedCode);
  return room || null;
};

/**
 * Remove user from room and clean up if empty
 */
export const removeUserFromRoom = (code: string, userId: string): void => {
  const normalizedCode = code.toUpperCase();
  const room = activeRooms.get(normalizedCode);

  if (!room) return;

  room.users = room.users.filter(u => u.id !== userId);
  console.log(`User ${userId} removed from room ${normalizedCode}. Users remaining: ${room.users.length}`);

  // Close room if empty or if creator left
  if (room.users.length === 0) {
    room.isActive = false;
    console.log(`Room ${normalizedCode} closed (no users)`);
  }
};

/**
 * Close a room manually
 */
export const closeRoom = (code: string): void => {
  const normalizedCode = code.toUpperCase();
  const room = activeRooms.get(normalizedCode);

  if (room) {
    room.isActive = false;
    console.log(`Room ${normalizedCode} closed manually`);
  }
};

/**
 * Get all active rooms (for debugging)
 */
export const getActiveRooms = (): Room[] => {
  return Array.from(activeRooms.values()).filter(r => r.isActive);
};
