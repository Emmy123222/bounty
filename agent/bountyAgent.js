import { ScrapingService } from './scrapingService.js';
import { ClaimingService } from './claimingService.js';
import { DatabaseService } from './databaseService.js';
import { NotificationService } from './notificationService.js';

export class BountyAgent {
  constructor() {
    this.scraper = new ScrapingService();
    this.claimer = new ClaimingService();
    this.database = new DatabaseService();
    this.notifications = new NotificationService();
    this.state = {
      isRunning: false,
      lastRun: null,
      totalBountiesProcessed: 0,
      totalClaimsExecuted: 0,
      totalRewardsEarned: 0
    };
  }

  async initialize() {
    console.log('🤖 Initializing BountyHunter AI+ Agent...');
    
    await Promise.all([
      this.scraper.initialize(),
      this.claimer.initialize(),
      this.database.initialize(),
      this.notifications.initialize()
    ]);

    console.log('✅ BountyHunter AI+ Agent fully initialized');
    return true;
  }

  async executeFullCycle() {
    if (this.state.isRunning) {
      console.log('⚠️ Agent cycle already running, skipping...');
      return;
    }

    this.state.isRunning = true;
    this.state.lastRun = new Date();

    try {
      console.log('🚀 Starting full bounty hunting cycle...');
      
      // Phase 1: Discovery
      const discoveredBounties = await this.discoverBounties();
      
      // Phase 2: Analysis
      const analyzedBounties = await this.analyzeBounties(discoveredBounties);
      
      // Phase 3: Execution
      const claimResults = await this.executeClaims(analyzedBounties);
      
      // Phase 4: Reporting
      await this.generateReport(discoveredBounties, claimResults);
      
      console.log('✅ Full bounty hunting cycle completed successfully');
      
    } catch (error) {
      console.error('❌ Agent cycle failed:', error);
      await this.notifications.sendErrorAlert(error, 'Full Cycle Execution');
    } finally {
      this.state.isRunning = false;
    }
  }

  async discoverBounties() {
    console.log('🔍 Phase 1: Bounty Discovery');
    
    const platforms = ['gitcoin', 'layer3', 'dework', 'superteam'];
    const allBounties = [];
    
    for (const platform of platforms) {
      try {
        console.log(`🔍 Discovering bounties on ${platform}...`);
        const bounties = await this.scraper.scrapePlatform(platform);
        allBounties.push(...bounties);
        
        // Store immediately for persistence
        await this.database.storeBounties(bounties);
        
        console.log(`✅ ${platform}: ${bounties.length} bounties discovered`);
      } catch (error) {
        console.error(`❌ Failed to discover bounties on ${platform}:`, error);
        await this.database.logError('discovery', `${platform} discovery failed: ${error.message}`);
      }
    }
    
    this.state.totalBountiesProcessed += allBounties.length;
    
    console.log(`🎯 Discovery complete: ${allBounties.length} total bounties found`);
    return allBounties;
  }

  async analyzeBounties(bounties) {
    console.log('🧠 Phase 2: Bounty Analysis');
    
    try {
      // Filter active bounties
      const activeBounties = bounties.filter(b => 
        b.claimable && 
        !b.claimed && 
        new Date(b.deadline) > new Date()
      );
      
      console.log(`📊 Analyzing ${activeBounties.length} active bounties...`);
      
      // Score and rank bounties
      const scoredBounties = activeBounties.map(bounty => ({
        ...bounty,
        score: this.calculateBountyScore(bounty),
        analysis: this.performBountyAnalysis(bounty)
      }));
      
      // Sort by score (highest first)
      scoredBounties.sort((a, b) => b.score - a.score);
      
      // Store analysis results
      await this.database.storeAnalysis(scoredBounties);
      
      console.log(`✅ Analysis complete: ${scoredBounties.length} bounties ranked`);
      return scoredBounties;
      
    } catch (error) {
      console.error('❌ Bounty analysis failed:', error);
      await this.database.logError('analysis', error.message);
      return bounties;
    }
  }

  calculateBountyScore(bounty) {
    let score = 0;
    
    // Reward weight (40% of score)
    const rewardScore = Math.min(bounty.reward / 100, 100) * 0.4;
    score += rewardScore;
    
    // Urgency weight (25% of score)
    const daysLeft = Math.ceil((new Date(bounty.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
    let urgencyScore = 0;
    if (daysLeft <= 1) urgencyScore = 25;
    else if (daysLeft <= 3) urgencyScore = 20;
    else if (daysLeft <= 7) urgencyScore = 15;
    else urgencyScore = 10;
    score += urgencyScore;
    
    // Platform reliability (20% of score)
    const platformScores = { 
      gitcoin: 20, 
      layer3: 16, 
      dework: 14, 
      superteam: 12 
    };
    score += platformScores[bounty.platform] || 8;
    
    // Claimability (15% of score)
    const difficultyScores = { 
      beginner: 15, 
      intermediate: 12, 
      advanced: 8 
    };
    score += difficultyScores[bounty.difficulty] || 10;
    
    return Math.round(score);
  }

  performBountyAnalysis(bounty) {
    return {
      claimability: this.assessClaimability(bounty),
      riskLevel: this.assessRisk(bounty),
      estimatedEffort: this.estimateEffort(bounty),
      profitability: this.calculateProfitability(bounty),
      recommendations: this.generateRecommendations(bounty)
    };
  }

  assessClaimability(bounty) {
    if (bounty.requirements.length === 0) return 'high';
    if (bounty.requirements.some(req => 
      req.toLowerCase().includes('social') || 
      req.toLowerCase().includes('twitter')
    )) return 'medium';
    return 'low';
  }

  assessRisk(bounty) {
    if (bounty.reward > 1000) return 'high';
    if (bounty.platform === 'gitcoin') return 'low';
    return 'medium';
  }

  estimateEffort(bounty) {
    const effortMap = {
      'marketing': 'low',
      'design': 'medium',
      'development': 'high',
      'research': 'medium',
      'bug-bounty': 'high'
    };
    return effortMap[bounty.category] || 'medium';
  }

  calculateProfitability(bounty) {
    // Simple profitability calculation
    const effort = this.estimateEffort(bounty);
    const effortMultiplier = { low: 1, medium: 0.7, high: 0.4 };
    return bounty.reward * effortMultiplier[effort];
  }

  generateRecommendations(bounty) {
    const recommendations = [];
    
    if (bounty.score > 80) {
      recommendations.push('High priority - excellent auto-claim candidate');
    }
    
    if (bounty.reward > 500) {
      recommendations.push('High value - verify legitimacy before claiming');
    }
    
    if (bounty.requirements.length === 0) {
      recommendations.push('No requirements - ideal for automated claiming');
    }
    
    const daysLeft = Math.ceil((new Date(bounty.deadline) - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      recommendations.push('Urgent - deadline approaching');
    }
    
    return recommendations;
  }

  async executeClaims(rankedBounties) {
    console.log('⚡ Phase 3: Claim Execution');
    
    try {
      // Get users with auto-claim enabled
      const autoClaimUsers = await this.database.getAutoClaimUsers();
      console.log(`👥 Found ${autoClaimUsers.length} users with auto-claim enabled`);
      
      const claimResults = [];
      
      for (const user of autoClaimUsers) {
        try {
          // Filter bounties for this user
          const eligibleBounties = this.filterBountiesForUser(rankedBounties, user);
          console.log(`🎯 User ${user.wallet_address}: ${eligibleBounties.length} eligible bounties`);
          
          // Claim top bounties (limit per user)
          const maxClaims = Math.min(eligibleBounties.length, 3);
          
          for (let i = 0; i < maxClaims; i++) {
            const bounty = eligibleBounties[i];
            
            try {
              // Validate bounty on-chain before claiming
              const isValid = await this.claimer.validateBountyOnChain(bounty);
              if (!isValid) {
                console.log(`⚠️ Bounty ${bounty.id} failed on-chain validation`);
                continue;
              }
              
              // Execute claim
              const claimResult = await this.claimer.claimBounty(bounty, user);
              
              if (claimResult.success) {
                console.log(`✅ Successfully claimed bounty ${bounty.id} for ${user.wallet_address}`);
                await this.database.recordClaim(bounty, user, claimResult.txHash);
                this.state.totalClaimsExecuted++;
                this.state.totalRewardsEarned += bounty.reward;
              } else {
                console.log(`❌ Failed to claim bounty ${bounty.id}: ${claimResult.error}`);
              }
              
              claimResults.push({
                ...claimResult,
                bountyId: bounty.id,
                userId: user.id,
                reward: bounty.reward
              });
              
              // Rate limiting between claims
              await new Promise(resolve => setTimeout(resolve, 2000));
              
            } catch (error) {
              console.error(`❌ Error claiming bounty ${bounty.id}:`, error);
              claimResults.push({
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
      
      console.log(`⚡ Claim execution complete: ${claimResults.filter(r => r.success).length} successful claims`);
      return claimResults;
      
    } catch (error) {
      console.error('❌ Claim execution failed:', error);
      await this.database.logError('execution', error.message);
      return [];
    }
  }

  filterBountiesForUser(bounties, user) {
    const prefs = user.preferences || {};
    
    return bounties.filter(bounty => {
      // Reward range check
      if (bounty.reward < (prefs.minReward || 0)) return false;
      if (bounty.reward > (prefs.maxReward || 10000)) return false;
      
      // Chain preference check
      if (prefs.chains && !prefs.chains.includes(bounty.chain)) return false;
      
      // Category preference check
      if (prefs.categories && !prefs.categories.includes(bounty.category)) return false;
      
      // Already claimed check
      if (bounty.claimedBy === user.wallet_address) return false;
      
      // Deadline check
      if (new Date(bounty.deadline) <= new Date()) return false;
      
      return true;
    });
  }

  async generateReport(discoveredBounties, claimResults) {
    console.log('📊 Phase 4: Report Generation');
    
    try {
      const successfulClaims = claimResults.filter(r => r.success);
      const totalRewards = successfulClaims.reduce((sum, r) => sum + (r.reward || 0), 0);
      
      const report = {
        timestamp: new Date().toISOString(),
        discovery: {
          totalBounties: discoveredBounties.length,
          platforms: ['gitcoin', 'layer3', 'dework', 'superteam'],
          newBounties: discoveredBounties.filter(b => 
            new Date(b.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length
        },
        execution: {
          totalAttempts: claimResults.length,
          successfulClaims: successfulClaims.length,
          failedClaims: claimResults.length - successfulClaims.length,
          totalRewards: totalRewards,
          averageReward: successfulClaims.length > 0 ? totalRewards / successfulClaims.length : 0
        },
        performance: {
          successRate: claimResults.length > 0 ? (successfulClaims.length / claimResults.length) * 100 : 0,
          totalBountiesProcessed: this.state.totalBountiesProcessed,
          totalClaimsExecuted: this.state.totalClaimsExecuted,
          totalRewardsEarned: this.state.totalRewardsEarned
        }
      };
      
      // Store report
      await this.database.logActivity('report', 'Agent cycle report generated', report);
      
      // Send notifications
      if (successfulClaims.length > 0) {
        await this.notifications.sendClaimNotifications(successfulClaims);
      }
      
      console.log('📊 Report generated and notifications sent');
      console.log(`📈 Cycle Summary: ${discoveredBounties.length} bounties discovered, ${successfulClaims.length} claims executed, $${totalRewards} rewards earned`);
      
    } catch (error) {
      console.error('❌ Report generation failed:', error);
    }
  }

  getAgentStatus() {
    return {
      ...this.state,
      uptime: this.state.lastRun ? Date.now() - this.state.lastRun.getTime() : 0,
      version: '1.0.0'
    };
  }
}