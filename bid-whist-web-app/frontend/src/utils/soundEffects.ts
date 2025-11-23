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
    meowAudio.playbackRate = 1.0; // Ensure normal speed
    meowAudio.play().catch(err => {
      console.log('Could not play meow sound:', err);
    });
  } catch (err) {
    console.log('Error with meow sound:', err);
  }
};

let overTrumpAudio: HTMLAudioElement | null = null;

export const playOverTrumpSound = () => {
  try {
    // Create audio element if it doesn't exist
    if (!overTrumpAudio) {
      overTrumpAudio = new Audio('/audio/meow-over-trump.mp3');
    }

    // Reset and play (no pitch shift needed anymore)
    overTrumpAudio.currentTime = 0;
    overTrumpAudio.play().catch(err => {
      console.log('Could not play over-trump sound:', err);
    });
  } catch (err) {
    console.log('Error with over-trump sound:', err);
  }
};

let bidMetAudio: HTMLAudioElement | null = null;

export const playBidMetSound = () => {
  try {
    if (!bidMetAudio) {
      bidMetAudio = new Audio('/audio/meow-win-hand.mp3');
    }
    bidMetAudio.currentTime = 0;
    bidMetAudio.play().catch(err => {
      console.log('Could not play bid met sound:', err);
    });
  } catch (err) {
    console.log('Error with bid met sound:', err);
  }
};

let attentionAudio: HTMLAudioElement | null = null;

export const playGetAttentionSound = () => {
  try {
    if (!attentionAudio) {
      attentionAudio = new Audio('/audio/meow-get-attention.mp3');
    }
    attentionAudio.currentTime = 0;
    attentionAudio.play().catch(err => {
      console.log('Could not play attention sound:', err);
    });
  } catch (err) {
    console.log('Error with attention sound:', err);
  }
};
