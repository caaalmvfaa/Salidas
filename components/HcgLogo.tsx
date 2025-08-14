import React from 'react';
import { hcgLogoBase64 } from './logo';

const HcgLogo: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={hcgLogoBase64}
    alt="Logo Hospital Civil de Guadalajara"
    className={className}
  />
);

export default HcgLogo;
