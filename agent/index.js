import { BountyAgent } from './bountyAgent.js';
import { ScrapingService } from './scrapingService.js';
import { ClaimingService } from './claimingService.js';
import { DatabaseService } from './databaseService.js';
import { NotificationService } from './notificationService.js';
import { config } from './config.js';

/**
 * Mosaia AI Agent Entry Point
 * Autonomous Web3 Bounty Hunter
 */
class MosaiaAgent {
  constructor() {
    this.agent = new BountyAgent();
    this.scraper = new ScrapingService();
    this.claimer = new ClaimingService();
    this.database = new DatabaseService();
    this.notifications = new NotificationService();
    this.isRunning = false;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing BountyHunter AI+ Agent...');
      
      // Initialize all services
      await this.database.initialize();
      await this.scraper.initialize();
      await this.claimer.initialize();
      await this.notifications.initialize();
      
      console.log('✅ Agent initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Agent initialization failed:', error);
      await this.database.logError('initialization', error.message);
      return false;
    }
  }

  async run() {
    if (this.isRunning) {
      console.log('⚠️ Agent is already running');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🎯 Starting bounty hunting cycle...');
      await this.database.logActivity('agent_start', 'Starting new bounty hunting cycle');

      // Step 1: Scrape bounties from all platforms
      const scrapedBounties = await this.scrapeBounties();
      console.log(`📊 Scraped ${scrapedBounties.length} bounties`);

      // Step 2: Analyze and rank bounties
      const rankedBounties = await this.analyzeBounties(scrapedBounties);
      console.log(`🎯 Ranked ${rankedBounties.length} bounties`);

      // Step 3: Execute auto-claims for eligible bounties
      const claimResults = await this.executeAutoClaims(rankedBounties);
      console.log(`⚡ Processed ${claimResults.length} auto-claims`);

      // Step 4: Send notifications
      await this.sendNotifications(claimResults);

      // Step 5: Update agent statistics
      await this.updateStatistics(scrapedBounties, claimResults);

      console.log('✅ Bounty hunting cycle completed successfully');
      await this.database.logActivity('agent_complete', 'Bounty hunting cycle completed', {
        scraped: scrapedBounties.length,
        ranked: rankedBounties.length,
        claimed: claimResults.filter(r => r.success).length
      });

    } catch (error) {
      console.error('❌ Agent run failed:', error);
      await this.database.logError('agent_run', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  async scrapeBounties() {
    const platforms = ['gitcoin', 'layer3', 'dework', 'superteam'];
    const allBounties = [];

    for (const platform of platforms) {
      try {
        console.log(`🔍 Scraping ${platform}...`);
        const bounties = await this.scraper.scrapePlatform(platform);
        allBounties.push(...bounties);
        
        // Store bounties in database
        await this.database.storeBounties(bounties);
        
        console.log(`✅ ${platform}: ${bounties.length} bounties scraped`);
      } catch (error) {
        console.error(`❌ Failed to scrape ${platform}:`, error);
        await this.database.logError('scraping', `Failed to scrape ${platform}: ${error.message}`);
      }
    }

    return allBounties;
  }

  async analyzeBounties(bounties) {
    try {
      console.log('🧠 Analyzing bounties with AI...');
      
      // Filter out already claimed bounties
      const unclaimedBounties = bounties.filter(b => !b.claimed);
      
      // Rank bounties by multiple factors
      const rankedBounties = unclaimedBounties.map(bounty => ({
        ...bounty,
        score: this.calculateBountyScore(bounty),
        aiAnalysis: this.generateAIAnalysis(bounty)
      }));

      // Sort by score (highest first)
      rankedBounties.sort((a, b) => b.score - a.score);

      // Store analysis results
      await this.database.storeAnalysis(rankedBounties);

      return rankedBounties;
    } catch (error) {
      console.error('❌ Bounty analysis failed:', error);
      await this.database.logError('analysis', error.message);
      return bounties;
    }
  }

  calculateBountyScore(bounty) {
    let score = 0;
    
    // Reward amount (normalized to 0-100)
    score += Math.min(bounty.reward / 100, 100) * 0.4;
    
    // Time until deadline (more urgent = higher score)
    const daysLeft = Math.ceil((new Date(bounty.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 1) score += 50;
    else if (daysLeft <= 3) score += 30;
    else if (daysLeft <= 7) score += 20;
    else score += 10;
    
    // Platform reliability
    const platformScores = { gitcoin: 30, layer3: 25, dework: 20, superteam: 15 };
    score += platformScores[bounty.platform] || 10;
    
    // Difficulty (easier = higher score for auto-claim)
    const difficultyScores = { beginner: 30, intermediate: 20, advanced: 10 };
    score += difficultyScores[bounty.difficulty] || 15;
    
    // Chain preference (Ethereum and Polygon preferred for stability)
    const chainScores = { ethereum: 20, polygon: 18, arbitrum: 15, optimism: 15, solana: 12 };
    score += chainScores[bounty.chain] || 10;

    return Math.round(score);
  }

  generateAIAnalysis(bounty) {
    const analysis = {
      claimability: 'unknown',
      riskLevel: 'medium',
      estimatedEffort: 'medium',
      recommendations: []
    };

    // Analyze claimability
    if (bounty.requirements.length === 0) {
      analysis.claimability = 'high';
      analysis.recommendations.push('No specific requirements - good for auto-claim');
    } else if (bounty.requirements.some(req => req.toLowerCase().includes('social'))) {
      analysis.claimability = 'medium';
      analysis.recommendations.push('Requires social media interaction');
    } else {
      analysis.claimability = 'low';
      analysis.recommendations.push('Complex requirements - manual review needed');
    }

    // Analyze risk level
    if (bounty.reward > 1000) {
      analysis.riskLevel = 'high';
      analysis.recommendations.push('High-value bounty - verify legitimacy');
    } else if (bounty.platform === 'gitcoin') {
      analysis.riskLevel = 'low';
      analysis.recommendations.push('Trusted platform - low risk');
    }

    // Estimate effort
    if (bounty.category === 'marketing' || bounty.category === 'social') {
      analysis.estimatedEffort = 'low';
    } else if (bounty.category === 'development') {
      analysis.estimatedEffort = 'high';
    }

    return analysis;
  }

  async executeAutoClaims(rankedBounties) {
    const results = [];
    
    // Get users with auto-claim enabled
    const autoClaimUsers = await this.database.getAutoClaimUsers();
    console.log(`👥 Found ${autoClaimUsers.length} users with auto-claim enabled`);

    for (const user of autoClaimUsers) {
      try {
        // Filter bounties based on user preferences
        const eligibleBounties = this.filterBountiesForUser(rankedBounties, user);
        console.log(`🎯 User ${user.wallet_address}: ${eligibleBounties.length} eligible bounties`);

        for (const bounty of eligibleBounties.slice(0, 3)) { // Limit to top 3 per user
          try {
            const claimResult = await this.claimer.claimBounty(bounty, user);
            results.push({
              success: claimResult.success,
              bountyId: bounty.id,
              userId: user.id,
              txHash: claimResult.txHash,
              error: claimResult.error
            });

            if (claimResult.success) {
              console.log(`✅ Successfully claimed bounty ${bounty.id} for user ${user.wallet_address}`);
              await this.database.recordClaim(bounty, user, claimResult.txHash);
            } else {
              console.log(`❌ Failed to claim bounty ${bounty.id}: ${claimResult.error}`);
            }

            // Rate limiting - wait between claims
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`❌ Error claiming bounty ${bounty.id}:`, error);
            results.push({
              success: false,
              bountyId: bounty.id,
              userId: user.id,
              error: error.message
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error);
      }
    }

    return results;
  }

  filterBountiesForUser(bounties, user) {
    const prefs = user.preferences;
    
    return bounties.filter(bounty => {
      // Check reward range
      if (bounty.reward < prefs.minReward || bounty.reward > prefs.maxReward) {
        return false;
      }
      
      // Check chains
      if (prefs.chains && !prefs.chains.includes(bounty.chain)) {
        return false;
      }
      
      // Check categories
      if (prefs.categories && !prefs.categories.includes(bounty.category)) {
        return false;
      }
      
      // Check if already claimed by this user
      if (bounty.claimedBy === user.wallet_address) {
        return false;
      }
      
      // Check claimability
      if (!bounty.claimable) {
        return false;
      }
      
      // Check deadline
      const daysLeft = Math.ceil((new Date(bounty.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        return false;
      }
      
      return true;
    });
  }

  async sendNotifications(claimResults) {
    try {
      const successfulClaims = claimResults.filter(r => r.success);
      if (successfulClaims.length > 0) {
        await this.notifications.sendClaimNotifications(successfulClaims);
      }
    } catch (error) {
      console.error('❌ Failed to send notifications:', error);
    }
  }

  async updateStatistics(scrapedBounties, claimResults) {
    try {
      const stats = {
        totalBountiesScraped: scrapedBounties.length,
        totalClaimsAttempted: claimResults.length,
        successfulClaims: claimResults.filter(r => r.success).length,
        totalRewardsClaimed: claimResults
          .filter(r => r.success)
          .reduce((sum, r) => sum + (r.reward || 0), 0),
        timestamp: new Date().toISOString()
      };

      await this.database.updateAgentStats(stats);
    } catch (error) {
      console.error('❌ Failed to update statistics:', error);
    }
  }

  async stop() {
    console.log('🛑 Stopping BountyHunter AI+ Agent...');
    this.isRunning = false;
    await this.database.logActivity('agent_stop', 'Agent stopped');
  }
}

// Mosaia Agent Entry Point
export default async function handler(event, context) {
  const agent = new MosaiaAgent();
  
  try {
    const initialized = await agent.initialize();
    if (!initialized) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Agent initialization failed' })
      };
    }

    await agent.run();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'BountyHunter AI+ Agent executed successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Agent execution failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Agent execution failed',
        message: error.message 
      })
    };
  }
}

// For local testing
if (process.env.NODE_ENV !== 'production') {
  const agent = new MosaiaAgent();
  agent.initialize().then(() => agent.run());
}