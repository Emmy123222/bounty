import { supabase } from '../config/supabase';
import { Bounty, AgentLog } from '../types';

export class BountyService {
  static async scrapeBounties(): Promise<Bounty[]> {
    try {
      // Log scraping start
      await this.logAgentAction('scrape', 'Starting bounty scraping from multiple platforms');

      // Scrape from multiple sources
      const [gitcoinBounties, layer3Bounties, deworkBounties] = await Promise.all([
        this.scrapeGitcoin(),
        this.scrapeLayer3(),
        this.scrapeDework(),
      ]);

      const allBounties = [...gitcoinBounties, ...layer3Bounties, ...deworkBounties];

      // Store in database
      if (allBounties.length > 0) {
        const { error } = await supabase
          .from('bounties')
          .upsert(allBounties, { onConflict: 'id' });

        if (error) {
          await this.logAgentAction('error', `Failed to store bounties: ${error.message}`);
          throw error;
        }
      }

      await this.logAgentAction('scrape', `Successfully scraped ${allBounties.length} bounties`);
      return allBounties;
    } catch (error) {
      await this.logAgentAction('error', `Bounty scraping failed: ${error}`);
      throw error;
    }
  }

  private static async scrapeGitcoin(): Promise<Bounty[]> {
    try {
      // Using Gitcoin's API to fetch real bounties
      const response = await fetch('https://gitcoin.co/api/v1/bounties', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Gitcoin API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: any) => ({
        id: `gitcoin-${item.id}`,
        title: item.title,
        description: item.description,
        reward: parseFloat(item.value_in_usdt) || 0,
        rewardToken: item.token_name || 'USDT',
        chain: this.mapChainName(item.network),
        platform: 'gitcoin',
        category: this.categorizeFromTitle(item.title),
        difficulty: this.getDifficultyFromDescription(item.description),
        deadline: item.expires_date,
        claimable: item.status === 'open',
        claimed: item.status === 'done',
        requirements: this.extractRequirements(item.description),
        submissionUrl: item.github_url,
        contractAddress: item.token_address,
        createdAt: item.created_on,
        updatedAt: item.modified_on,
        tags: item.keywords ? item.keywords.split(',').map((k: string) => k.trim()) : [],
      }));
    } catch (error) {
      console.error('Gitcoin scraping error:', error);
      return [];
    }
  }

  private static async scrapeLayer3(): Promise<Bounty[]> {
    try {
      // Using Layer3's API to fetch real quests/bounties
      const response = await fetch('https://layer3.xyz/api/quests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Layer3 API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.quests?.map((quest: any) => ({
        id: `layer3-${quest.id}`,
        title: quest.title,
        description: quest.description,
        reward: quest.reward?.amount || 0,
        rewardToken: quest.reward?.token || 'USDC',
        chain: 'ethereum',
        platform: 'layer3',
        category: 'marketing',
        difficulty: 'beginner',
        deadline: quest.endDate,
        claimable: quest.status === 'active',
        claimed: false,
        requirements: quest.tasks?.map((task: any) => task.description) || [],
        submissionUrl: quest.url,
        createdAt: quest.createdAt,
        updatedAt: quest.updatedAt,
        tags: quest.tags || [],
      })) || [];
    } catch (error) {
      console.error('Layer3 scraping error:', error);
      return [];
    }
  }

  private static async scrapeDework(): Promise<Bounty[]> {
    try {
      // Using Dework's GraphQL API to fetch real bounties
      const query = `
        query {
          tasks(filter: { status: TODO }) {
            id
            name
            description
            reward {
              amount
              token {
                symbol
              }
            }
            dueDate
            skills {
              name
            }
            creator {
              username
            }
          }
        }
      `;

      const response = await fetch('https://api.dework.xyz/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Dework API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data?.tasks?.map((task: any) => ({
        id: `dework-${task.id}`,
        title: task.name,
        description: task.description,
        reward: task.reward?.amount || 0,
        rewardToken: task.reward?.token?.symbol || 'USDC',
        chain: 'ethereum',
        platform: 'dework',
        category: 'development',
        difficulty: 'intermediate',
        deadline: task.dueDate,
        claimable: true,
        claimed: false,
        requirements: task.skills?.map((skill: any) => skill.name) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: task.skills?.map((skill: any) => skill.name) || [],
      })) || [];
    } catch (error) {
      console.error('Dework scraping error:', error);
      return [];
    }
  }

  private static mapChainName(network: string): string {
    const chainMap: { [key: string]: string } = {
      'mainnet': 'ethereum',
      'matic': 'polygon',
      'optimism': 'optimism',
      'arbitrum': 'arbitrum',
      'solana': 'solana',
    };
    return chainMap[network?.toLowerCase()] || 'ethereum';
  }

  private static categorizeFromTitle(title: string): string {
    const categories = {
      'development': ['dev', 'code', 'smart contract', 'dapp', 'api'],
      'design': ['design', 'ui', 'ux', 'logo', 'brand'],
      'marketing': ['market', 'social', 'content', 'community'],
      'research': ['research', 'analysis', 'audit', 'review'],
      'bug-bounty': ['bug', 'security', 'vulnerability', 'exploit'],
    };

    const titleLower = title.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }
    return 'development';
  }

  private static getDifficultyFromDescription(description: string): string {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('beginner') || desc.includes('easy') || desc.includes('simple')) {
      return 'beginner';
    }
    if (desc.includes('advanced') || desc.includes('expert') || desc.includes('complex')) {
      return 'advanced';
    }
    return 'intermediate';
  }

  private static extractRequirements(description: string): string[] {
    const requirements = [];
    const desc = description?.toLowerCase() || '';
    
    if (desc.includes('solidity')) requirements.push('Solidity');
    if (desc.includes('javascript')) requirements.push('JavaScript');
    if (desc.includes('react')) requirements.push('React');
    if (desc.includes('python')) requirements.push('Python');
    if (desc.includes('rust')) requirements.push('Rust');
    if (desc.includes('web3')) requirements.push('Web3');
    
    return requirements.length > 0 ? requirements : ['General Development'];
  }

  static async logAgentAction(type: string, message: string, data?: any, userId?: string): Promise<void> {
    try {
      await supabase
        .from('agent_logs')
        .insert({
          type,
          message,
          data,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log agent action:', error);
    }
  }

  static async getBounties(filters?: any): Promise<Bounty[]> {
    let query = supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.chain) {
        query = query.eq('chain', filters.chain);
      }
      if (filters.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.minReward) {
        query = query.gte('reward', filters.minReward);
      }
      if (filters.maxReward) {
        query = query.lte('reward', filters.maxReward);
      }
      if (filters.claimable) {
        query = query.eq('claimable', true);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      throw error;
    }

    return data || [];
  }
}