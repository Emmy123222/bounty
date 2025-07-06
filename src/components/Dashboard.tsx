import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Award,
  Bot,
  Settings,
  Eye,
  AlertCircle
} from 'lucide-react';
import BountyCard from './BountyCard';
import BountyFilters from './BountyFilters';
import { Bounty } from '../types';
import { BountyService } from '../services/bountyService';
import { useAccount } from 'wagmi';

const Dashboard: React.FC = () => {
  const { address } = useAccount();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filteredBounties, setFilteredBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoClaimEnabled, setAutoClaimEnabled] = useState(false);
  const [stats, setStats] = useState({
    totalBounties: 0,
    totalRewards: 0,
    averageReward: 0,
    expiringCount: 0,
  });

  useEffect(() => {
    loadBounties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bounties, filters]);

  const loadBounties = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedBounties = await BountyService.getBounties();
      setBounties(fetchedBounties);
      calculateStats(fetchedBounties);
    } catch (error) {
      console.error('Failed to load bounties:', error);
      setError('Failed to load bounties. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const refreshBounties = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const freshBounties = await BountyService.scrapeBounties();
      setBounties(freshBounties);
      calculateStats(freshBounties);
    } catch (error) {
      console.error('Failed to refresh bounties:', error);
      setError('Failed to refresh bounties. Please check your API configuration.');
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bounties];

    if (filters.search) {
      filtered = filtered.filter(bounty =>
        bounty.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        bounty.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.chain) {
      filtered = filtered.filter(bounty => bounty.chain === filters.chain);
    }

    if (filters.platform) {
      filtered = filtered.filter(bounty => bounty.platform === filters.platform);
    }

    if (filters.category) {
      filtered = filtered.filter(bounty => bounty.category === filters.category);
    }

    if (filters.difficulty) {
      filtered = filtered.filter(bounty => bounty.difficulty === filters.difficulty);
    }

    if (filters.minReward) {
      filtered = filtered.filter(bounty => bounty.reward >= filters.minReward);
    }

    if (filters.maxReward) {
      filtered = filtered.filter(bounty => bounty.reward <= filters.maxReward);
    }

    if (filters.claimable) {
      filtered = filtered.filter(bounty => bounty.claimable && !bounty.claimed);
    }

    setFilteredBounties(filtered);
  };

  const calculateStats = (bountyList: Bounty[]) => {
    const totalBounties = bountyList.length;
    const totalRewards = bountyList.reduce((sum, bounty) => sum + bounty.reward, 0);
    const averageReward = totalBounties > 0 ? totalRewards / totalBounties : 0;
    const expiringCount = bountyList.filter(bounty => {
      const daysLeft = Math.ceil((new Date(bounty.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 3 && daysLeft > 0;
    }).length;

    setStats({
      totalBounties,
      totalRewards,
      averageReward,
      expiringCount,
    });
  };

  const handleClaim = (bounty: Bounty) => {
    // Update bounty status locally
    setBounties(prev => prev.map(b => 
      b.id === bounty.id 
        ? { ...b, claimed: true, claimedBy: address }
        : b
    ));
  };

  const handleWatchlist = (bounty: Bounty) => {
    // Handle watchlist logic
    console.log('Toggle watchlist for:', bounty.id);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bounties from Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Configuration Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.
          </p>
          <button
            onClick={loadBounties}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bounty Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Real-time Web3 bounties from Supabase
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshBounties}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Scraping...' : 'Refresh'}
              </button>
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-claim:</span>
                <button
                  onClick={() => setAutoClaimEnabled(!autoClaimEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoClaimEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoClaimEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Bounties"
              value={stats.totalBounties.toLocaleString()}
              icon={Award}
              color="bg-purple-600"
            />
            <StatCard
              title="Total Rewards"
              value={`$${stats.totalRewards.toLocaleString()}`}
              icon={DollarSign}
              color="bg-green-600"
            />
            <StatCard
              title="Average Reward"
              value={`$${Math.round(stats.averageReward).toLocaleString()}`}
              icon={TrendingUp}
              color="bg-blue-600"
            />
            <StatCard
              title="Expiring Soon"
              value={stats.expiringCount.toString()}
              icon={Clock}
              color="bg-red-600"
              subtitle="Less than 3 days"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <BountyFilters
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
          />
        </div>

        {/* Bounties Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBounties.map(bounty => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              onClaim={handleClaim}
              onWatchlist={handleWatchlist}
              showClaimButton={true}
            />
          ))}
        </div>

        {filteredBounties.length === 0 && !loading && (
          <div className="text-center py-12">
            <Eye size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No bounties found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {bounties.length === 0 
                ? 'No bounties in database. Click "Refresh" to scrape new bounties.'
                : 'Try adjusting your filters to see more bounties.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;