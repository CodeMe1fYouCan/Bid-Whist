// Sound effects utility
let meowAudio: HTMLAudioElement | null = null;

export const playMeowSound = () => {
  try {
    // Create audio element if it doesn't exist
    if (!meowAudio) {
      meowAudio = new Audio('/audio/meow-trump-cut.mp3');
      // No volume set - uses default 1.0 (100%) to match card-played sound
    }
    
    // Reset and play
    meowAudio.currentTime = 0;
    meowAudio.play().catch(err => {
      console.log('Could not play meow sound:', err);
    });
  } catch (err) {
    console.log('Error with meow sound:', err);
  }
};
