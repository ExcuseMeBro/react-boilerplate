import Navbar from '@/components/layout/Navbar.tsx';

export default function Default({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
