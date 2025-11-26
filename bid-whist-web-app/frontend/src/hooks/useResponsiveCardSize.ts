import { useState, useEffect } from 'react';

export const useResponsiveCardSize = () => {
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { width, height, isMobile } = dimensions;

    return {
        isMobile,
        windowWidth: width,
        windowHeight: height,
        playerCardWidth: 100,
        playerCardHeight: 150,
        opponentCardWidth: 60,
        opponentCardHeight: 90,
    };
};
