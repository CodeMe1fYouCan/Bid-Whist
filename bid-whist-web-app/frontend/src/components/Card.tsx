import React, { useState } from 'react';

interface CardProps {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: string; // '2'–'10', 'J', 'Q', 'K', 'A', 'NO_TRUMP'
    faceUp?: boolean;
    width?: number;
    height?: number;
    onClick?: () => void;
    isSelected?: boolean;
    isPlayable?: boolean;
}

const Card: React.FC<CardProps> = ({
    suit,
    rank,
    faceUp = true,
    width = 80,
    height = 120,
    onClick,
    isSelected = false,
    isPlayable = true,
}) => {
    const [imageError, setImageError] = useState(false);
    
    // Special handling for no-trump card
    const isNoTrump = rank === 'NO_TRUMP';
    const cardKey = isNoTrump ? 'no_trump' : `${rank}_of_${suit}`;
    const imgSrc = faceUp ? `/cards/${cardKey}.svg` : `/cards/back.svg`;

    // Check if this card has an SVG (J, Q, K have SVGs, no_trump, and back.svg for face-down)
    const hasSvg = !faceUp || ['J', 'Q', 'K'].includes(rank) || isNoTrump;

    // Suit symbols
    const suitSymbols = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
    };

    // Suit colors
    const suitColors = {
        hearts: '#dc2626',
        diamonds: '#dc2626',
        clubs: '#000000',
        spades: '#000000',
    };

    // Scale font sizes based on card width (base width is 80px)
    const scale = width / 80;
    const cornerFontSize = Math.round(18 * scale);
    const centerFontSize = Math.round(44 * scale); // 44px base (5% larger than original 42px)

    const renderFallbackCard = () => (
        <div
            style={{
                width,
                height,
                backgroundColor: faceUp ? '#f5f1e3' : '#1e40af',
                borderRadius: '8px',
                border: '2px solid #333',
                boxShadow: isSelected
                    ? '0 8px 16px rgba(0,0,0,0.4)'
                    : '0 4px 8px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                userSelect: 'none',
                pointerEvents: 'none',
            }}
        >
            {faceUp ? (
                <>
                    {/* Top left corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            fontSize: `${cornerFontSize}px`,
                            fontWeight: 'bold',
                            color: suitColors[suit],
                            lineHeight: 0.9,
                            textAlign: 'center',
                        }}
                    >
                        <div>{rank}</div>
                        <div style={{ fontSize: `${cornerFontSize}px`, marginTop: '2px' }}>{suitSymbols[suit]}</div>
                    </div>

                    {/* Center symbol */}
                    <div
                        style={{
                            fontSize: `${centerFontSize}px`,
                            color: suitColors[suit],
                        }}
                    >
                        {suitSymbols[suit]}
                    </div>

                    {/* Bottom right corner (upside down) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            fontSize: `${cornerFontSize}px`,
                            fontWeight: 'bold',
                            color: suitColors[suit],
                            lineHeight: 0.9,
                            textAlign: 'center',
                            transform: 'rotate(180deg)',
                        }}
                    >
                        <div>{rank}</div>
                        <div style={{ fontSize: `${cornerFontSize}px`, marginTop: '2px' }}>{suitSymbols[suit]}</div>
                    </div>
                </>
            ) : (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'repeating-linear-gradient(45deg, #1e40af, #1e40af 10px, #1e3a8a 10px, #1e3a8a 20px)',
                        borderRadius: '6px',
                    }}
                />
            )}
        </div>
    );

    return (
        <div
            className={`transform transition-all duration-300 ${
                isSelected
                    ? 'translate-y-[-10px] scale-105'
                    : isPlayable && onClick
                      ? 'hover:translate-y-[-8px] hover:scale-105'
                      : ''
            }`}
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
            }}
        >
            {hasSvg && !imageError ? (
                <img
                    src={imgSrc}
                    alt={cardKey}
                    onError={() => setImageError(true)}
                    style={{
                        width,
                        height,
                        borderRadius: '8px',
                        boxShadow: isSelected
                            ? '0 8px 16px rgba(0,0,0,0.4)'
                            : '0 4px 8px rgba(0,0,0,0.25)',
                        userSelect: 'none',
                        pointerEvents: 'none',
                    }}
                />
            ) : (
                renderFallbackCard()
            )}
        </div>
    );
};

export default Card;