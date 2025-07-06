import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export class DatabaseService {
  constructor() {
    this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  }

  async initialize() {
    console.log('💾 Initializing database service...');
    try {
      // Test connection
      const { data, error } = await this.supabase.from('bounties').select('count').limit(1);
      if (error && !error.message.includes('relation "bounties" does not exist')) {
        throw error;
      }
      console.log('✅ Database service initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async storeBounties(bounties) {
    try {
      if (bounties.length === 0) return;

      const { error } = await this.supabase
        .from('bounties')
        .upsert(bounties, { onConflict: 'id' });

      if (error) {
        console.error('Database storage error:', error);
        throw error;
      }

      console.log(`💾 Stored ${bounties.length} bounties in database`);
    } catch (error) {
      console.error('❌ Failed to store bounties:', error);
      throw error;
    }
  }

  async storeAnalysis(rankedBounties) {
    try {
      // Store AI analysis results
      const analysisData = rankedBounties.map(bounty => ({
        bounty_id: bounty.id,
        score: bounty.score,
        ai_analysis: bounty.aiAnalysis,
        analyzed_at: new Date().toISOString()
      }));

      // Note: This would require an analysis table in the schema
      console.log(`🧠 Analysis completed for ${rankedBounties.length} bounties`);
    } catch (error) {
      console.error('❌ Failed to store analysis:', error);
    }
  }

  async getAutoClaimUsers() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('preferences->autoClaimEnabled', true);

      if (error) throw error;

      console.log(`👥 Found ${data?.length || 0} users with auto-claim enabled`);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get auto-claim users:', error);
      return [];
    }
  }

  async recordClaim(bounty, user, txHash) {
    try {
      // Update bounty status
      await this.supabase
        .from('bounties')
        .update({
          claimed: true,
          claimed_by: user.wallet_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', bounty.id);

      // Create transaction record
      await this.supabase
        .from('transactions')
        .insert({
          user_id: user.wallet_address,
          bounty_id: bounty.id,
          type: 'auto-claim',
          amount: bounty.reward,
          token: bounty.rewardToken,
          chain: bounty.chain,
          tx_hash: txHash,
          status: 'confirmed'
        });

      // Update user stats
      await this.supabase
        .from('users')
        .update({
          total_earned: user.total_earned + bounty.reward,
          total_claimed: user.total_claimed + 1
        })
        .eq('id', user.id);

      console.log(`📝 Recorded claim for bounty ${bounty.id}`);
    } catch (error) {
      console.error('❌ Failed to record claim:', error);
      throw error;
    }
  }

  async logActivity(type, message, data = null) {
    try {
      await this.supabase
        .from('agent_logs')
        .insert({
          type,
          message,
          data,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
    }
  }

  async logError(type, message, data = null) {
    try {
      await this.supabase
        .from('agent_logs')
        .insert({
          type: 'error',
          message: `${type}: ${message}`,
          data,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Failed to log error:', error);
    }
  }

  async updateAgentStats(stats) {
    try {
      // Store agent performance statistics
      console.log('📊 Agent stats:', stats);
      
      // This could be stored in a dedicated agent_stats table
      await this.logActivity('stats', 'Agent cycle completed', stats);
    } catch (error) {
      console.error('❌ Failed to update agent stats:', error);
    }
  }

  async getBountyHistory(limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get bounty history:', error);
      return [];
    }
  }

  async getClaimHistory(userId = null, limit = 100) {
    try {
      let query = this.supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get claim history:', error);
      return [];
    }
  }

  async getAgentLogs(limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('agent_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get agent logs:', error);
      return [];
    }
  }
}