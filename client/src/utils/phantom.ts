declare global {
  interface Window {
    phantom?: {
      solana?: any;  // You can make this more specific if needed
    };
  }
}

export const getProvider = () => {
  if ('phantom' in window) {
    const provider = window.phantom?.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  throw new Error('Phantom wallet not found');
}; 