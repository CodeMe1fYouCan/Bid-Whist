import React, { useState } from 'react';

interface CardProps {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: string; // '2'–'10', 'J', 'Q', 'K', 'A'
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
    const cardKey = `${rank}_of_${suit}`;
    const imgSrc = faceUp ? `/cards/${cardKey}.svg` : `/cards/back.svg`;

    // Check if this card has an SVG (J, Q, K have SVGs, and back.svg for face-down)
    const hasSvg = !faceUp || ['J', 'Q', 'K'].includes(rank);

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

    const renderFallbackCard = () => (
        <div
            style={{
                width,
                height,
                backgroundColor: faceUp ? '#ffffff' : '#1e40af',
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
                            top: '8px',
                            left: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: suitColors[suit],
                            lineHeight: 1,
                            textAlign: 'center',
                        }}
                    >
                        <div>{rank}</div>
                        <div style={{ fontSize: '14px' }}>{suitSymbols[suit]}</div>
                    </div>

                    {/* Center symbol */}
                    <div
                        style={{
                            fontSize: '32px',
                            color: suitColors[suit],
                        }}
                    >
                        {suitSymbols[suit]}
                    </div>

                    {/* Bottom right corner (upside down) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: suitColors[suit],
                            lineHeight: 1,
                            textAlign: 'center',
                            transform: 'rotate(180deg)',
                        }}
                    >
                        <div>{rank}</div>
                        <div style={{ fontSize: '14px' }}>{suitSymbols[suit]}</div>
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