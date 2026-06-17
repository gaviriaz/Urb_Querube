import React from 'react';

export default function QuerubeLogo({ width = 34, height = 34, style }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      {/* Three minimalist buildings inside the Q */}
      {/* Left Building (Forest Green #314126) */}
      <rect x="36" y="43" width="6.5" height="17" rx="0.5" fill="#314126" />
      {/* Center Building (Elegant Gold #C7A86D - tallest) */}
      <rect x="46.5" y="32" width="6.5" height="28" rx="0.5" fill="#C7A86D" />
      {/* Right Building (Forest Green #314126) */}
      <rect x="57" y="38" width="6.5" height="22" rx="0.5" fill="#314126" />
      
      {/* Foundation Curve inside the Q (Forest Green) */}
      <path d="M 33 60 C 43 62.5, 57 62.5, 67 60" stroke="#314126" strokeWidth="2.2" strokeLinecap="round" />

      {/* Circular ring of the Q (Thick Gold ring of uniform thickness) */}
      <circle cx="50" cy="46" r="27" stroke="#C7A86D" strokeWidth="7.2" />

      {/* Q's Tail flowing from bottom-right of the circle */}
      <path d="M 69.5 65.5 C 74.5 71.5, 80 77, 85 81" stroke="#C7A86D" strokeWidth="7.2" strokeLinecap="round" />
      
      {/* Topographical contours / Internal roads curving from the tail */}
      {/* Golden road sweeping to the left */}
      <path d="M 85 81 C 71.5 85.5, 51.5 83.5, 34 79.5 C 22.5 77, 12.5 79, 6.5 81" stroke="#C7A86D" strokeWidth="3.2" strokeLinecap="round" />
      {/* Forest Green secondary path representing parcel organization / contour */}
      <path d="M 72 71.5 C 60 76.5, 44 74.5, 28 69 C 18 65, 10 67.5, 5.5 69" stroke="#314126" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
