// components/effects/SmokeBackgroundWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import { SmokeBackground } from './SmokeBackground';
export default function SmokeBackgroundWrapper() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return <SmokeBackground />;
}