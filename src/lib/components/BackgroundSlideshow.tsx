'use client';

import { useState, useEffect } from 'react';

const backgroundImages = [
  '/background/9Q5A8155.JPG',
  '/background/9Q5A8160.JPG',
  '/background/9Q5A8165.JPG',
  '/background/9Q5A8175.JPG',
  '/background/9Q5A8177.JPG',
  '/background/9Q5A8180.JPG',
  '/background/9Q5A8209.JPG',
  '/background/9Q5A8225.JPG',
];

export default function BackgroundSlideshow() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        // If we're at the last image, loop back to the first
        if (nextIndex >= backgroundImages.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {backgroundImages.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className={`absolute inset-0 transition-opacity duration-4000 ease-in-out bg-cover bg-center bg-no-repeat ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${image})`,
          }}
        />
      ))}
    </div>
  );
}
