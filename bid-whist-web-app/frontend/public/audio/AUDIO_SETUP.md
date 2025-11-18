# Audio Setup Guide

## Quick Start

Replace the placeholder audio files in this directory with your custom victory sounds:

1. **reddy-win.mp3** - Plays when Reddy is on the winning team
2. **oatmeal-win.mp3** - Plays when Oatmeal is on the winning team

## File Requirements

- **Format**: MP3 (recommended), WAV, or OGG
- **Duration**: 3-10 seconds recommended
- **Size**: Keep under 1MB for fast loading
- **Naming**: Must match exactly (case-sensitive)

## How to Add Audio

### Option 1: Replace Files
```bash
# Navigate to this directory
cd bid-whist-web-app/frontend/public/audio/

# Copy your audio files here
cp /path/to/your/reddy-sound.mp3 reddy-win.mp3
cp /path/to/your/oatmeal-sound.mp3 oatmeal-win.mp3
```

### Option 2: Use Different Format
If you want to use WAV or OGG instead of MP3:

1. Place your files in this directory
2. Edit `frontend/src/components/GameCompleteOverlay.tsx`
3. Change line 27:
```typescript
// Change from:
const audioFile = hasReddy ? "/audio/reddy-win.mp3" : "/audio/oatmeal-win.mp3";

// To (for WAV):
const audioFile = hasReddy ? "/audio/reddy-win.wav" : "/audio/oatmeal-win.wav";
```

## Testing Audio

1. Start the development server
2. Join a game with player name "Reddy" or "Oatmeal"
3. Play until that team wins (reaches 21 points)
4. Audio should play automatically on the win screen

## Troubleshooting

### Audio Doesn't Play
- **Browser Autoplay Policy**: Some browsers block autoplay. User must interact with page first.
- **File Not Found**: Check filename matches exactly (case-sensitive)
- **Format Not Supported**: Try converting to MP3
- **Console Errors**: Open browser DevTools (F12) and check Console tab

### Audio Plays But Sounds Wrong
- Check file isn't corrupted
- Verify audio format is supported by browser
- Test file in media player first

### Adding More Players
To add audio for other players, edit `GameCompleteOverlay.tsx`:

```typescript
// Add detection for new player
const hasNewPlayer = winningTeamPlayers.some((name: string) => 
  name.toLowerCase().includes("newplayer")
);

// Update audio selection
let audioFile = null;
if (hasReddy) audioFile = "/audio/reddy-win.mp3";
else if (hasOatmeal) audioFile = "/audio/oatmeal-win.mp3";
else if (hasNewPlayer) audioFile = "/audio/newplayer-win.mp3";

if (audioFile) {
  audioRef.current = new Audio(audioFile);
  audioRef.current.play().catch(err => {
    console.log("Audio playback failed:", err);
  });
}
```

## Browser Compatibility

| Browser | MP3 | WAV | OGG |
|---------|-----|-----|-----|
| Chrome  | ✅  | ✅  | ✅  |
| Firefox | ✅  | ✅  | ✅  |
| Safari  | ✅  | ✅  | ❌  |
| Edge    | ✅  | ✅  | ✅  |

## Example Audio Ideas

- Victory fanfare
- Player catchphrase
- Celebration sound effect
- Custom music clip
- Voice recording ("Reddy wins!")

## Need Help?

Check the main documentation: `bid-whist-web-app/GAME_WIN_FEATURE.md`
