import Navbar from '@/components/layout/Navbar.tsx';
import React from 'react';

export default function Default({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
