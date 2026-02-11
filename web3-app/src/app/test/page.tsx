'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Test() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="space-y-4">
        <h1 className="text-4xl">WALLET TEST</h1>
        <ConnectButton />
      </div>
    </div>
  );
}
