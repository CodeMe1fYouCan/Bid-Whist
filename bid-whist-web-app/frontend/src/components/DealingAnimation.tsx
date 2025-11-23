import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

const DealingAnimation = () => {
    const [dealtCards, setDealtCards] = useState<number[]>([]);

    // Total cards to animate (e.g., 12 cards, 3 rounds of 4)
    const totalCards = 12;

    useEffect(() => {
        // Start dealing sequence
        const dealInterval = setInterval(() => {
            setDealtCards(prev => {
                if (prev.length >= totalCards) {
                    clearInterval(dealInterval);
                    return prev;
                }
                return [...prev, prev.length];
            });
        }, 150); // Speed of dealing

        return () => clearInterval(dealInterval);
    }, []);

    // Calculate target position based on player index (0=bottom, 1=left, 2=top, 3=right)
    const getTargetPosition = (index: number) => {
        const playerIndex = index % 4;
        // Values are approximate percentages to move off-screen or to player hands
        switch (playerIndex) {
            case 0: return { y: 400, x: 0, rotate: 0 };    // Bottom (Me)
            case 1: return { y: 0, x: -400, rotate: 90 };  // Left
            case 2: return { y: -400, x: 0, rotate: 180 }; // Top
            case 3: return { y: 0, x: 400, rotate: -90 };  // Right
            default: return { y: 0, x: 0, rotate: 0 };
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* Central Deck */}
            <div className="relative w-32 h-48">
                {/* Static deck pile */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={`deck-${i}`}
                        className="absolute inset-0 bg-blue-700 rounded-lg border-2 border-white shadow-md"
                        style={{
                            transform: `translateY(${-i * 2}px) translateX(${i * 1}px)`,
                            zIndex: 0
                        }}
                    >
                        <div className="w-full h-full opacity-50 bg-[url('/card-back-pattern.png')] bg-repeat rounded-lg"></div>
                    </div>
                ))}

                {/* Animated dealing cards */}
                <AnimatePresence>
                    {dealtCards.map((index) => {
                        const target = getTargetPosition(index);
                        return (
                            <motion.div
                                key={`dealt-${index}`}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                                animate={{
                                    x: target.x,
                                    y: target.y,
                                    scale: 0.5,
                                    opacity: 0,
                                    rotate: target.rotate
                                }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute inset-0 z-10"
                            >
                                <div className="w-full h-full bg-blue-600 rounded-lg border-2 border-white shadow-xl flex items-center justify-center">
                                    <span className="text-4xl">🎴</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-white text-xl font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"
                    >
                        Dealing Cards...
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DealingAnimation;
