import React from 'react';

interface BanorteLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BanorteLogo = ({ className = '', size = 'md' }: BanorteLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
     
        <rect
          width="100"
          height="100"
          rx="20"
          ry="20"
          fill="#E31C23"
        />
        
    
        <ellipse
          cx="50"
          cy="35"
          rx="30"
          ry="12"
          fill="white"
        />
        

        <ellipse
          cx="50"
          cy="65"
          rx="30"
          ry="12"
          fill="white"
        />
        
        
        <polygon
          points="50,20 65,80 35,80"
          fill="#E31C23"
        />
      </svg>
    </div>
  );
};

export default BanorteLogo;