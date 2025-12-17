import React from 'react';

const Background: React.FC = React.memo(() => {
    return (
        // Optimization: translate-z-0 promotes this to a GPU layer
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505] transform-gpu translate-z-0">
            {/* Radial Gradient Glow from Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900 rounded-full blur-[120px] opacity-20 will-change-transform"></div>
            
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] opacity-20"></div>
        </div>
    );
});

export default Background;