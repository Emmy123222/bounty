export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  rewardToken: string;
  chain: 'ethereum' | 'solana' | 'polygon' | 'arbitrum' | 'optimism';
  platform: 'gitcoin' | 'layer3' | 'dework' | 'superteam' | 'other';
  category: 'development' | 'design' | 'marketing' | 'research' | 'bug-bounty';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  deadline: string;
  claimable: boolean;
  claimed: boolean;
  claimedBy?: string;
  requirements: string[];
  submissionUrl?: string;
  contractAddress?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface User {
  id: string;
  walletAddress: string;
  chain: string;
  totalEarned: number;
  totalClaimed: number;
  rank: number;
  joinedAt: string;
  preferences: {
    autoClaimEnabled: boolean;
    notificationsEnabled: boolean;
    chains: string[];
    categories: string[];
    minReward: number;
    maxReward: number;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  bountyId: string;
  type: 'claim' | 'auto-claim';
  amount: number;
  token: string;
  chain: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  gasUsed?: number;
  gasFee?: number;
}

export interface AgentLog {
  id: string;
  type: 'scrape' | 'claim' | 'error' | 'notification';
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  bountyId: string;
  createdAt: string;
}