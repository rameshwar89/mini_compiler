'use client';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('./components/MonacoEditor'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <MonacoEditor />
  );
}
