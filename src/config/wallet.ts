import { getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, sepolia } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';

const { connectors } = getDefaultWallets({
  appName: 'BountyHunter AI+',
  projectId,
});

export const config = getDefaultConfig({
  appName: 'BountyHunter AI+',
  projectId,
  chains: [mainnet, polygon, optimism, arbitrum, sepolia],
  connectors,
});