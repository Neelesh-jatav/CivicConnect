import React, { useState, useEffect } from 'react';
import '../App.css';

const AdsCarousel = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch ads from the backend
  useEffect(() => {
    const fetchAds = async () => {
      try {
        // Adjust the endpoint if your public ads route is different
        const response = await fetch('http://localhost:5002/api/v1/ads');
        const data = await response.json();
        if (data.success) {
          setAds(data.ads);
        }
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      }
    };

    fetchAds();
  }, []);

  // Auto-switch ads every 4 seconds
  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const nextAd = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
  };

  const prevAd = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + ads.length) % ads.length);
  };

  if (!ads || ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <div className="local-partners">
      {/* Card */}
      <div className="ad-card">
        {/* Tags */}
        <div className="ad-tags">
          {ad.isFeatured && <span className="featured">Featured</span>}
          <span className="ad-label">Ad</span>
        </div>

        {/* Image */}
        <img 
          src={ad.image?.url || ad.image || "https://via.placeholder.com/400x200?text=Advertisement"} 
          alt={ad.offerText} 
        />

        {/* Content */}
        <h4>{ad.sponsor?.businessName}</h4>
        <p>{ad.sponsor?.description}</p>

        {/* Offer Pill */}
        <div className="offer">
          {ad.offerText}
        </div>

        {/* Meta */}
        <div className="meta">
          Valid until {new Date(ad.endDate).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div className="actions">
          <button onClick={() => window.location.href = `tel:${ad.sponsor?.phone}`}>Call Now</button>
          <a href={ad.sponsor?.website} target="_blank" rel="noopener noreferrer">Visit Website</a>
        </div>
      </div>

      {/* Controls */}
      <div className="carousel-controls">
        <button onClick={prevAd}>‹</button>
        <button onClick={nextAd}>›</button>
      </div>

      {/* Dots */}
      <div className="carousel-dots">
        {ads.map((_, index) => (
          <div
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      <div className="ads-footer">
        Ads by <span>CivicConnect</span>
      </div>
    </div>
  );
};

export default AdsCarousel;