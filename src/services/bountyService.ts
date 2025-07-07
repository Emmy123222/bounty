import { supabase, isSupabaseConfigured } from '../config/supabase';
import { Bounty, AgentLog } from '../types';

export class BountyService {
  static async getBounties(filters?: any): Promise<Bounty[]> {
    try {
      // If Supabase is not configured, return sample data
      if (!isSupabaseConfigured || !supabase) {
        console.log('📊 Using demo data - Supabase not configured');
        return this.getSampleBounties(filters);
      }

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
        if (filters.search) {
          query = query.textSearch('title', filters.search);
        }
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      // If no bounties exist, create some sample ones
      if (!data || data.length === 0) {
        await this.createSampleBounties();
        // Fetch again after creating samples
        const { data: newData, error: newError } = await supabase
          .from('bounties')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (newError) throw newError;
        return newData || [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching bounties:', error);
      // Fallback to sample data if database fails
      console.log('📊 Falling back to demo data due to database error');
      return this.getSampleBounties(filters);
    }
  }

  static getSampleBounties(filters?: any): Bounty[] {
    const sampleBounties: Bounty[] = [
      {
        id: 'gitcoin-001',
        title: 'Build a DeFi Yield Farming Dashboard',
        description: 'Create a comprehensive dashboard for tracking yield farming opportunities across multiple DeFi protocols. Must include real-time APY calculations, portfolio tracking, and risk assessment features.',
        reward: 2500,
        rewardToken: 'USDC',
        chain: 'ethereum',
        platform: 'gitcoin',
        category: 'development',
        difficulty: 'advanced',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['React', 'Web3.js', 'DeFi Protocols', 'TypeScript'],
        submissionUrl: 'https://gitcoin.co/issue/defi-dashboard/1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['defi', 'dashboard', 'yield-farming', 'web3']
      },
      {
        id: 'layer3-002',
        title: 'Complete Polygon zkEVM Quest Series',
        description: 'Complete a series of tasks to explore Polygon zkEVM including bridging assets, swapping tokens, and providing liquidity. Perfect for beginners to learn about Layer 2 scaling.',
        reward: 150,
        rewardToken: 'MATIC',
        chain: 'polygon',
        platform: 'layer3',
        category: 'marketing',
        difficulty: 'beginner',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['MetaMask', 'Basic DeFi Knowledge'],
        submissionUrl: 'https://layer3.xyz/quests/polygon-zkevm',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['polygon', 'zkevm', 'layer2', 'quest']
      },
      {
        id: 'dework-003',
        title: 'Smart Contract Security Audit',
        description: 'Conduct a comprehensive security audit of a new DeFi lending protocol. Identify potential vulnerabilities, provide detailed report with recommendations.',
        reward: 5000,
        rewardToken: 'ETH',
        chain: 'ethereum',
        platform: 'dework',
        category: 'bug-bounty',
        difficulty: 'advanced',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['Solidity', 'Security Auditing', 'DeFi Protocols'],
        submissionUrl: 'https://app.dework.xyz/task/security-audit',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['security', 'audit', 'defi', 'smart-contracts']
      },
      {
        id: 'superteam-004',
        title: 'Solana NFT Marketplace Frontend',
        description: 'Build a modern, responsive frontend for a Solana NFT marketplace. Include features for browsing, buying, selling, and creating NFTs with wallet integration.',
        reward: 1800,
        rewardToken: 'SOL',
        chain: 'solana',
        platform: 'superteam',
        category: 'development',
        difficulty: 'intermediate',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['React', 'Solana Web3.js', 'Anchor Framework'],
        submissionUrl: 'https://superteam.fun/bounties/nft-marketplace',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['solana', 'nft', 'marketplace', 'frontend']
      },
      {
        id: 'gitcoin-005',
        title: 'Cross-Chain Bridge UI/UX Design',
        description: 'Design an intuitive user interface for a cross-chain bridge supporting Ethereum, Polygon, and Arbitrum. Focus on user experience and clear transaction flow.',
        reward: 800,
        rewardToken: 'USDC',
        chain: 'ethereum',
        platform: 'gitcoin',
        category: 'design',
        difficulty: 'intermediate',
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['Figma', 'Web3 UX', 'Cross-chain Knowledge'],
        submissionUrl: 'https://gitcoin.co/issue/bridge-design/2',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['design', 'bridge', 'cross-chain', 'ux']
      },
      {
        id: 'layer3-006',
        title: 'Arbitrum DeFi Explorer Quest',
        description: 'Explore the Arbitrum ecosystem by interacting with top DeFi protocols. Swap tokens, provide liquidity, and earn rewards while learning about Layer 2 benefits.',
        reward: 75,
        rewardToken: 'ARB',
        chain: 'arbitrum',
        platform: 'layer3',
        category: 'marketing',
        difficulty: 'beginner',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['MetaMask', 'Arbitrum Network'],
        submissionUrl: 'https://layer3.xyz/quests/arbitrum-defi',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['arbitrum', 'defi', 'layer2', 'exploration']
      },
      {
        id: 'dework-007',
        title: 'DAO Governance Token Analysis',
        description: 'Research and analyze governance token distribution and voting patterns across major DAOs. Provide insights on decentralization and governance effectiveness.',
        reward: 1200,
        rewardToken: 'USDC',
        chain: 'ethereum',
        platform: 'dework',
        category: 'research',
        difficulty: 'intermediate',
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['Data Analysis', 'DAO Knowledge', 'Research Skills'],
        submissionUrl: 'https://app.dework.xyz/task/dao-analysis',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['dao', 'governance', 'research', 'analysis']
      },
      {
        id: 'superteam-008',
        title: 'Solana Mobile dApp Development',
        description: 'Create a mobile-first dApp for Solana using React Native. Include wallet integration, transaction signing, and offline capabilities.',
        reward: 3200,
        rewardToken: 'SOL',
        chain: 'solana',
        platform: 'superteam',
        category: 'development',
        difficulty: 'advanced',
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['React Native', 'Solana Mobile Stack', 'TypeScript'],
        submissionUrl: 'https://superteam.fun/bounties/mobile-dapp',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['solana', 'mobile', 'dapp', 'react-native']
      },
      {
        id: 'gitcoin-009',
        title: 'Web3 Social Media Content Creation',
        description: 'Create engaging educational content about Web3 technologies. Include blog posts, infographics, and social media content to help onboard new users.',
        reward: 400,
        rewardToken: 'USDC',
        chain: 'ethereum',
        platform: 'gitcoin',
        category: 'marketing',
        difficulty: 'beginner',
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['Content Writing', 'Social Media', 'Web3 Knowledge'],
        submissionUrl: 'https://gitcoin.co/issue/content-creation/3',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['content', 'marketing', 'education', 'web3']
      },
      {
        id: 'dework-010',
        title: 'Multi-Chain Portfolio Tracker',
        description: 'Build a portfolio tracking application that supports multiple blockchains. Include real-time price updates, P&L calculations, and transaction history.',
        reward: 2800,
        rewardToken: 'ETH',
        chain: 'ethereum',
        platform: 'dework',
        category: 'development',
        difficulty: 'advanced',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['React', 'Multi-chain APIs', 'Database Design'],
        submissionUrl: 'https://app.dework.xyz/task/portfolio-tracker',
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['portfolio', 'multi-chain', 'tracking', 'defi']
      }
    ];

    // Apply filters if provided
    if (!filters) return sampleBounties;

    let filtered = [...sampleBounties];

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

    return filtered;
  }

  static async createSampleBounties(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('⚠️ Cannot create sample bounties - Supabase not configured');
      return;
    }

    const sampleBounties = [
      {
        id: 'gitcoin-001',
        title: 'Build a DeFi Yield Farming Dashboard',
        description: 'Create a comprehensive dashboard for tracking yield farming opportunities across multiple DeFi protocols. Must include real-time APY calculations, portfolio tracking, and risk assessment features.',
        reward: 2500,
        reward_token: 'USDC',
        chain: 'ethereum',
        platform: 'gitcoin',
        category: 'development',
        difficulty: 'advanced',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        claimable: true,
        claimed: false,
        requirements: ['React', 'Web3.js', 'DeFi Protocols', 'TypeScript'],
        submission_url: 'https://gitcoin.co/issue/defi-dashboard/1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: ['defi', 'dashboard', 'yield-farming', 'web3']
      },
      // ... other sample bounties would go here
    ];

    try {
      const { error } = await supabase
        .from('bounties')
        .insert(sampleBounties);

      if (error) {
        console.error('Error creating sample bounties:', error);
        throw error;
      }

      await this.logAgentAction('scrape', `Created ${sampleBounties.length} sample bounties to populate dashboard`);
    } catch (error) {
      console.error('Failed to create sample bounties:', error);
      throw error;
    }
  }

  static async scrapeBounties(): Promise<Bounty[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('📊 Demo mode - returning sample bounties');
      return this.getSampleBounties();
    }

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
      // Fallback to sample data
      return this.getSampleBounties();
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
    if (!isSupabaseConfigured || !supabase) {
      console.log(`📝 Agent Log [${type}]: ${message}`);
      return;
    }

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
}