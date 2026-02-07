'use client';

import React, { useEffect, useRef } from 'react';

/**
 * BinaryStorm component
 * Renders an overwhelming stream of binary data on a canvas background.
 */
export const BinaryStorm: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Configuration
        const fontSize = 16;
        const columns = Math.ceil(canvas.width / fontSize);
        const drops: number[] = new Array(columns).fill(0).map(() => Math.random() * -100);
        const speeds: number[] = new Array(columns).fill(0).map(() => 0.5 + Math.random() * 2);

        const draw = () => {
            // Semi-transparent black to create a trailing effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                // Randomly choose 0 or 1
                const text = Math.random() > 0.5 ? '0' : '1';

                // Vary opacity for depth
                const opacity = Math.random() * 0.5 + 0.1;
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.fillText(text, x, y);

                // Reset drop to top if it goes off screen
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                // Increment position by speed
                drops[i] += speeds[i];
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full pointer-events-none"
            style={{
                background: '#000',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: -1
            }}
        />
    );
};
