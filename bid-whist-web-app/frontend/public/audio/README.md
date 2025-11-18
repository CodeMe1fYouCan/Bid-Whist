# Audio Files for Game Win

This directory contains custom audio clips that play when specific players win the game.

## Required Files

- `reddy-win.mp3` - Plays when a player named "Reddy" is on the winning team
- `oatmeal-win.mp3` - Plays when a player named "Oatmeal" is on the winning team

## Adding Audio Files

1. Place your custom MP3 audio files in this directory
2. Name them exactly as shown above (case-sensitive)
3. The audio will automatically play when the corresponding player wins

## Supported Formats

- MP3 (recommended)
- WAV
- OGG

If you want to use a different format, update the file extension in:
`frontend/src/components/GameCompleteOverlay.tsx`

## Testing

To test the audio:
1. Join a game with a player named "Reddy" or "Oatmeal"
2. Play until one team reaches 21 points
3. If the winning team includes Reddy or Oatmeal, their audio will play

## Fallback

If the audio files are missing or fail to load, the game will continue normally without audio.
