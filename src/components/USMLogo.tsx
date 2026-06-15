import React from 'react';
// @ts-ignore
import logoUSM from './logoUSM.png';

interface USMLogoProps {
  className?: string;
  isPortal?: boolean;
}

export default function USMLogo({ className = "w-10 h-10", isPortal = false }: USMLogoProps) {
  return (
    <img
      src={logoUSM}
      alt="Logo Universidad Santa María (USM)"
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
    />
  );
}

