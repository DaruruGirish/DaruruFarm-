import React from 'react';

export const BRAND_LOGO_SRC = '/daruru-logo.png';
export const BRAND_NAME = 'Daruru Farms';
export const BRAND_TAGLINE = 'Intelligence for every pomegranate.';

export const BrandLogo: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 36, className = '' }) => (
  <img
    src={BRAND_LOGO_SRC}
    alt="Daruru Farms"
    width={size}
    height={size}
    className={`rounded-xl object-cover shrink-0 border border-emerald-800/15 ${className}`}
  />
);
