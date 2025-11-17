# Card SVG Assets

Place your card SVG files in this directory.

## Naming Convention

The Card component expects files named in this format:
- `{rank}_of_{suit}.svg`

### Examples:
- `J_of_hearts.svg`
- `Q_of_diamonds.svg`
- `K_of_clubs.svg`
- `A_of_spades.svg`
- `2_of_hearts.svg`
- `10_of_diamonds.svg`

### Card Back:
- `back.svg` - Used when `faceUp={false}`

## Suits
- hearts
- diamonds
- clubs
- spades

## Ranks
- 2, 3, 4, 5, 6, 7, 8, 9, 10
- J (Jack)
- Q (Queen)
- K (King)
- A (Ace)

## Note
If you only have face cards (J, Q, K, A), you can update the Card component to render number cards differently (e.g., using CSS/HTML instead of SVG).
