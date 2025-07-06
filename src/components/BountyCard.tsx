import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Star, 
  ExternalLink, 
  Heart, 
  Zap,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Bounty } from '../types';
import { ClaimService } from '../services/claimService';
import { useAccount } from 'wagmi';

interface BountyCardProps {
  bounty: Bounty;
  onClaim?: (bounty: Bounty) => void;
  onWatchlist?: (bounty: Bounty) => void;
  isWatchlisted?: boolean;
  showClaimButton?: boolean;
}

const BountyCard: React.FC<BountyCardProps> = ({
  bounty,
  onClaim,
  onWatchlist,
  isWatchlisted = false,
  showClaimButton = true,
}) => {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);

  const handleClaim = async () => {
    if (!address || !onClaim) return;
    
    setIsClaiming(true);
    try {
      await ClaimService.claimBounty(bounty, address, false);
      onClaim(bounty);
    } catch (error) {
      console.error('Failed to claim bounty:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleWatchlist = async () => {
    if (!onWatchlist) return;
    
    setIsWatchlistUpdating(true);
    try {
      onWatchlist(bounty);
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    } finally {
      setIsWatchlistUpdating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'ethereum':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'solana':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'polygon':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'gitcoin':
        return <Award className="w-4 h-4" />;
      case 'layer3':
        return <Zap className="w-4 h-4" />;
      case 'dework':
        return <Star className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const daysUntilDeadline = Math.ceil(
    (new Date(bounty.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getPlatformIcon(bounty.platform)}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
              {bounty.platform}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWatchlist}
              disabled={isWatchlistUpdating}
              className={`p-2 rounded-lg transition-colors ${
                isWatchlisted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart
                size={16}
                className={isWatchlisted ? 'fill-current' : ''}
              />
            </button>
            {bounty.submissionUrl && (
              <a
                href={bounty.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {bounty.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
          {bounty.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(bounty.difficulty)}`}>
            {bounty.difficulty}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getChainColor(bounty.chain)}`}>
            {bounty.chain}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            {bounty.category}
          </span>
        </div>

        {/* Requirements */}
        {bounty.requirements.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Requirements:</p>
            <div className="flex flex-wrap gap-1">
              {bounty.requirements.slice(0, 3).map((req, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                >
                  {req}
                </span>
              ))}
              {bounty.requirements.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  +{bounty.requirements.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <DollarSign size={16} className="text-green-600" />
              <span className="font-semibold text-green-600">
                {bounty.reward.toLocaleString()} {bounty.rewardToken}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} className={daysUntilDeadline <= 3 ? 'text-red-500' : 'text-gray-500'} />
              <span className={`text-sm ${daysUntilDeadline <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                {daysUntilDeadline > 0 ? `${daysUntilDeadline}d left` : 'Expired'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bounty.claimed ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Claimed</span>
              </div>
            ) : !bounty.claimable ? (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Not Claimable</span>
              </div>
            ) : showClaimButton ? (
              <button
                onClick={handleClaim}
                disabled={isClaiming || !address}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isClaiming || !address
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isClaiming ? 'Claiming...' : 'Claim'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BountyCard;