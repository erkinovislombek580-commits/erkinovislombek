import React, { useEffect, useRef } from 'react';
import { ConnectionStatus } from '../types';

interface NanoCoreProps {
    status: ConnectionStatus;
    analyser: AnalyserNode | null;
}

const NanoCore: React.FC<NanoCoreProps> = ({ status, analyser }) => {
    const coreRef = useRef<HTMLDivElement>(null);
    const audioRingRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);

    // Base colors based on status
    let coreBaseColor = "rgb(6, 182, 212)"; // Cyan-500 (Default)
    let ringBaseColor = "border-cyan-400";
    let spinnerColor = "text-cyan-400";
    // Increased opacity for brighter glow
    let glowColor = "rgba(6, 182, 212, 0.8)"; 

    if (status === ConnectionStatus.PROCESSING || status === ConnectionStatus.GENERATING_AUDIO) {
        coreBaseColor = "rgb(192, 132, 252)"; // Purple-400 (Brighter)
        ringBaseColor = "border-purple-400";
        spinnerColor = "text-purple-400";
        glowColor = "rgba(192, 132, 252, 0.8)";
    } else if (status === ConnectionStatus.SPEAKING) {
        coreBaseColor = "rgb(52, 211, 153)"; // Emerald-400 (Brighter)
        ringBaseColor = "border-emerald-400";
        spinnerColor = "text-emerald-400";
        glowColor = "rgba(52, 211, 153, 0.8)";
    }

    useEffect(() => {
        let time = 0;

        const animate = () => {
            time += 0.05;

            // --- ANIMATION LOGIC ---
            if (status === ConnectionStatus.SPEAKING) {
                 // Pulse effect for rings when speaking
                 const pulse = Math.sin(time * 5) * 0.15 + 1.1; // More aggressive pulse
                 if (audioRingRef.current) {
                     audioRingRef.current.style.transform = `scale(${pulse}) rotate(45deg)`;
                     audioRingRef.current.style.opacity = '1'; // Fully visible when speaking
                 }
                 if (coreRef.current) {
                     const glowSize = Math.sin(time * 5) * 30 + 50; // Larger glow
                     coreRef.current.style.boxShadow = `0 0 ${glowSize}px ${glowColor}`;
                 }
            } else {
                // Idle animation
                if (audioRingRef.current) {
                    audioRingRef.current.style.transform = `scale(1) rotate(45deg)`;
                    audioRingRef.current.style.opacity = '0.6'; // More visible idle
                }
                if (coreRef.current) {
                    coreRef.current.style.boxShadow = `0 0 40px ${glowColor}`;
                }
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [status, coreBaseColor, glowColor]);

    return (
        <div className="relative flex items-center justify-center w-64 h-64 md:w-96 md:h-96 transition-all duration-300 ease-out will-change-transform transform-gpu">
            {/* Outer Decorative Rings - Increased Opacity */}
            <div className={`absolute w-full h-full rounded-full border border-dashed ${ringBaseColor} opacity-40 animate-[spin_10s_linear_infinite]`}></div>
            
            <div 
                ref={audioRingRef}
                className={`absolute w-[85%] h-[85%] rounded-full border-t-[2px] border-b-[2px] ${ringBaseColor} opacity-50 transition-transform duration-75 ease-linear will-change-transform shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
                style={{ transform: `scale(1) rotate(45deg)` }}
            ></div>
            
            <div className={`absolute w-[70%] h-[70%] rounded-full border-[3px] border-transparent border-l-current border-r-current opacity-80 animate-[spin_3s_linear_infinite] ${spinnerColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}></div>
            
            <div className={`absolute w-[50%] h-[50%] rounded-full border border-dotted ${ringBaseColor} opacity-90 animate-[spin_4s_linear_infinite_reverse]`}></div>
            
            {/* CENTRAL CORE */}
            <div 
                ref={coreRef}
                className={`relative z-10 w-28 h-28 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors duration-300 will-change-transform border-2`}
                style={{
                    borderColor: coreBaseColor,
                    boxShadow: `0 0 40px ${glowColor}`,
                }}
            >
               {/* Spinning Text "JARVIZ" */}
               <div className="absolute inset-0 flex items-center justify-center animate-[spin_6s_linear_infinite]">
                    <span 
                        className="font-orbitron font-bold text-lg tracking-[0.2em] select-none transform rotate-90 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" 
                        style={{ color: coreBaseColor }}
                    >
                        JARVIZ
                    </span>
               </div>
               
               {/* Inner dot */}
               <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_15px_white] animate-pulse"></div>
            </div>

            {/* Background Particles/Stars */}
            <div className="absolute w-[120%] h-[120%] animate-[pulse_4s_ease-in-out_infinite] opacity-30 pointer-events-none">
                 <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_10px_cyan]"></div>
                 <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_10px_cyan]"></div>
                 <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_10px_cyan]"></div>
                 <div className="absolute right-0 top-1/2 w-1.5 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_10px_cyan]"></div>
            </div>
            
            <div className="absolute -bottom-16 text-center">
                <p className="font-orbitron text-xs tracking-[0.2em] text-cyan-100 uppercase opacity-90 drop-shadow-md">
                    System Status
                </p>
                <p className={`font-orbitron text-xl font-bold tracking-widest drop-shadow-[0_0_10px_rgba(0,0,0,1)] transition-colors duration-300`} style={{ color: coreBaseColor, textShadow: `0 0 10px ${glowColor}` }}>
                    {status.replace('_', ' ')}
                </p>
            </div>
        </div>
    );
};

export default React.memo(NanoCore);