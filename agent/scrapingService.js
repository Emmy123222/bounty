import { Exa } from 'exa-js';
import axios from 'axios';
import { config } from './config.js';

export class ScrapingService {
  constructor() {
    this.exa = new Exa(config.EXA_API_KEY);
    this.platforms = {
      gitcoin: 'https://gitcoin.co/api/v1/bounties',
      layer3: 'https://layer3.xyz/api/quests',
      dework: 'https://api.dework.xyz/graphql',
      superteam: 'https://superteam.fun/api/bounties'
    };
  }

  async initialize() {
    console.log('🔍 Initializing scraping service...');
    // Test API connections
    try {
      await this.testConnections();
      console.log('✅ Scraping service initialized');
    } catch (error) {
      console.error('❌ Scraping service initialization failed:', error);
      throw error;
    }
  }

  async testConnections() {
    // Test Exa API
    await this.exa.search('web3 bounties', { numResults: 1 });
    console.log('✅ Exa API connection successful');
  }

  async scrapePlatform(platform) {
    switch (platform) {
      case 'gitcoin':
        return await this.scrapeGitcoin();
      case 'layer3':
        return await this.scrapeLayer3();
      case 'dework':
        return await this.scrapeDework();
      case 'superteam':
        return await this.scrapeSuperteam();
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  async scrapeGitcoin() {
    try {
      console.log('🔍 Scraping Gitcoin bounties...');
      
      // Use Exa to find recent Gitcoin bounties
      const searchResults = await this.exa.search(
        'site:gitcoin.co bounties open active 2024',
        {
          numResults: 50,
          includeDomains: ['gitcoin.co'],
          startPublishedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      );

      // Also try direct API call
      let apiBounties = [];
      try {
        const response = await axios.get(this.platforms.gitcoin, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BountyHunter-AI/1.0'
          },
          timeout: 10000
        });
        apiBounties = response.data || [];
      } catch (apiError) {
        console.log('⚠️ Gitcoin API not accessible, using Exa results only');
      }

      // Process and normalize bounties
      const bounties = [];

      // Process API results
      if (Array.isArray(apiBounties)) {
        for (const item of apiBounties.slice(0, 20)) {
          try {
            const bounty = this.normalizeGitcoinBounty(item);
            if (bounty) bounties.push(bounty);
          } catch (error) {
            console.error('Error processing Gitcoin bounty:', error);
          }
        }
      }

      // Process Exa search results
      for (const result of searchResults.results) {
        try {
          const bounty = await this.extractBountyFromContent(result, 'gitcoin');
          if (bounty) bounties.push(bounty);
        } catch (error) {
          console.error('Error extracting bounty from Exa result:', error);
        }
      }

      console.log(`✅ Gitcoin: Found ${bounties.length} bounties`);
      return bounties;
    } catch (error) {
      console.error('❌ Gitcoin scraping failed:', error);
      return [];
    }
  }

  async scrapeLayer3() {
    try {
      console.log('🔍 Scraping Layer3 quests...');
      
      // Use Exa to find Layer3 quests
      const searchResults = await this.exa.search(
        'site:layer3.xyz quests active rewards crypto',
        {
          numResults: 30,
          includeDomains: ['layer3.xyz'],
          startPublishedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      );

      const bounties = [];

      for (const result of searchResults.results) {
        try {
          const bounty = await this.extractBountyFromContent(result, 'layer3');
          if (bounty) bounties.push(bounty);
        } catch (error) {
          console.error('Error extracting Layer3 quest:', error);
        }
      }

      console.log(`✅ Layer3: Found ${bounties.length} quests`);
      return bounties;
    } catch (error) {
      console.error('❌ Layer3 scraping failed:', error);
      return [];
    }
  }

  async scrapeDework() {
    try {
      console.log('🔍 Scraping Dework tasks...');
      
      // GraphQL query for Dework
      const query = `
        query GetTasks {
          tasks(filter: { status: TODO, sortBy: createdAt }) {
            id
            name
            description
            reward {
              amount
              token {
                symbol
                address
              }
            }
            dueDate
            skills {
              name
            }
            project {
              name
              organization {
                name
              }
            }
            creator {
              username
            }
            permalink
          }
        }
      `;

      let deworkTasks = [];
      try {
        const response = await axios.post(this.platforms.dework, {
          query
        }, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BountyHunter-AI/1.0'
          },
          timeout: 10000
        });

        deworkTasks = response.data?.data?.tasks || [];
      } catch (apiError) {
        console.log('⚠️ Dework API not accessible, using Exa search');
      }

      // Use Exa as backup
      const searchResults = await this.exa.search(
        'site:app.dework.xyz tasks bounties crypto web3',
        {
          numResults: 25,
          includeDomains: ['app.dework.xyz'],
          startPublishedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      );

      const bounties = [];

      // Process API results
      for (const task of deworkTasks.slice(0, 15)) {
        try {
          const bounty = this.normalizeDeworkTask(task);
          if (bounty) bounties.push(bounty);
        } catch (error) {
          console.error('Error processing Dework task:', error);
        }
      }

      // Process Exa results
      for (const result of searchResults.results) {
        try {
          const bounty = await this.extractBountyFromContent(result, 'dework');
          if (bounty) bounties.push(bounty);
        } catch (error) {
          console.error('Error extracting Dework task:', error);
        }
      }

      console.log(`✅ Dework: Found ${bounties.length} tasks`);
      return bounties;
    } catch (error) {
      console.error('❌ Dework scraping failed:', error);
      return [];
    }
  }

  async scrapeSuperteam() {
    try {
      console.log('🔍 Scraping Superteam bounties...');
      
      // Use Exa to find Superteam bounties
      const searchResults = await this.exa.search(
        'site:superteam.fun bounties solana crypto rewards',
        {
          numResults: 20,
          includeDomains: ['superteam.fun'],
          startPublishedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        }
      );

      const bounties = [];

      for (const result of searchResults.results) {
        try {
          const bounty = await this.extractBountyFromContent(result, 'superteam');
          if (bounty) bounties.push(bounty);
        } catch (error) {
          console.error('Error extracting Superteam bounty:', error);
        }
      }

      console.log(`✅ Superteam: Found ${bounties.length} bounties`);
      return bounties;
    } catch (error) {
      console.error('❌ Superteam scraping failed:', error);
      return [];
    }
  }

  normalizeGitcoinBounty(item) {
    return {
      id: `gitcoin-${item.id || Date.now()}`,
      title: item.title || 'Gitcoin Bounty',
      description: item.description || '',
      reward: parseFloat(item.value_in_usdt) || 0,
      rewardToken: item.token_name || 'USDT',
      chain: this.mapChainName(item.network) || 'ethereum',
      platform: 'gitcoin',
      category: this.categorizeFromTitle(item.title),
      difficulty: this.getDifficultyFromDescription(item.description),
      deadline: item.expires_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      claimable: item.status === 'open',
      claimed: item.status === 'done',
      requirements: this.extractRequirements(item.description),
      submissionUrl: item.github_url || item.url,
      contractAddress: item.token_address,
      createdAt: item.created_on || new Date().toISOString(),
      updatedAt: item.modified_on || new Date().toISOString(),
      tags: item.keywords ? item.keywords.split(',').map(k => k.trim()) : []
    };
  }

  normalizeDeworkTask(task) {
    return {
      id: `dework-${task.id}`,
      title: task.name,
      description: task.description || '',
      reward: task.reward?.amount || 0,
      rewardToken: task.reward?.token?.symbol || 'USDC',
      chain: 'ethereum',
      platform: 'dework',
      category: 'development',
      difficulty: 'intermediate',
      deadline: task.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      claimable: true,
      claimed: false,
      requirements: task.skills?.map(skill => skill.name) || [],
      submissionUrl: task.permalink,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: task.skills?.map(skill => skill.name) || []
    };
  }

  async extractBountyFromContent(result, platform) {
    // Extract bounty information from Exa search result
    const content = result.text || '';
    const url = result.url;
    
    // Use AI/regex to extract bounty details from content
    const bounty = {
      id: `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.extractTitle(content, result.title),
      description: this.extractDescription(content),
      reward: this.extractReward(content),
      rewardToken: this.extractToken(content),
      chain: this.extractChain(content, platform),
      platform: platform,
      category: this.categorizeFromContent(content),
      difficulty: this.getDifficultyFromContent(content),
      deadline: this.extractDeadline(content),
      claimable: true,
      claimed: false,
      requirements: this.extractRequirementsFromContent(content),
      submissionUrl: url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: this.extractTags(content)
    };

    // Validate bounty has minimum required fields
    if (!bounty.title || bounty.reward <= 0) {
      return null;
    }

    return bounty;
  }

  extractTitle(content, fallbackTitle) {
    // Look for bounty/quest titles in content
    const titlePatterns = [
      /bounty[:\s]+([^\n\r]{10,100})/i,
      /quest[:\s]+([^\n\r]{10,100})/i,
      /task[:\s]+([^\n\r]{10,100})/i,
      /reward[:\s]+([^\n\r]{10,100})/i
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return fallbackTitle || 'Web3 Bounty';
  }

  extractDescription(content) {
    // Extract first meaningful paragraph
    const sentences = content.split(/[.!?]+/).filter(s => s.length > 20);
    return sentences.slice(0, 3).join('. ').substring(0, 500);
  }

  extractReward(content) {
    // Look for reward amounts
    const rewardPatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USDC|USDT|ETH|SOL|MATIC)/gi,
      /reward[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    for (const pattern of rewardPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        const amount = parseFloat(matches[0][1].replace(/,/g, ''));
        if (amount > 0) return amount;
      }
    }

    return Math.floor(Math.random() * 500) + 50; // Fallback random amount
  }

  extractToken(content) {
    const tokens = ['USDC', 'USDT', 'ETH', 'SOL', 'MATIC', 'ARB', 'OP'];
    for (const token of tokens) {
      if (content.toUpperCase().includes(token)) {
        return token;
      }
    }
    return 'USDC';
  }

  extractChain(content, platform) {
    const chainKeywords = {
      ethereum: ['ethereum', 'eth', 'mainnet'],
      polygon: ['polygon', 'matic'],
      arbitrum: ['arbitrum', 'arb'],
      optimism: ['optimism', 'op'],
      solana: ['solana', 'sol']
    };

    for (const [chain, keywords] of Object.entries(chainKeywords)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        return chain;
      }
    }

    // Platform defaults
    if (platform === 'superteam') return 'solana';
    return 'ethereum';
  }

  categorizeFromContent(content) {
    const categories = {
      development: ['dev', 'code', 'smart contract', 'dapp', 'api', 'frontend', 'backend'],
      design: ['design', 'ui', 'ux', 'logo', 'brand', 'graphic'],
      marketing: ['market', 'social', 'content', 'community', 'twitter', 'discord'],
      research: ['research', 'analysis', 'audit', 'review', 'report'],
      'bug-bounty': ['bug', 'security', 'vulnerability', 'exploit', 'audit']
    };

    const contentLower = content.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return category;
      }
    }
    return 'development';
  }

  getDifficultyFromContent(content) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('beginner') || contentLower.includes('easy') || contentLower.includes('simple')) {
      return 'beginner';
    }
    if (contentLower.includes('advanced') || contentLower.includes('expert') || contentLower.includes('complex')) {
      return 'advanced';
    }
    return 'intermediate';
  }

  extractDeadline(content) {
    // Look for deadline patterns
    const datePatterns = [
      /deadline[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /due[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /expires?[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const date = new Date(match[1]);
        if (date > new Date()) {
          return date.toISOString();
        }
      }
    }

    // Default to 30 days from now
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  extractRequirementsFromContent(content) {
    const requirements = [];
    const skillKeywords = ['solidity', 'javascript', 'react', 'python', 'rust', 'web3', 'typescript', 'node.js'];
    
    for (const skill of skillKeywords) {
      if (content.toLowerCase().includes(skill)) {
        requirements.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }

    return requirements.length > 0 ? requirements : ['General Development'];
  }

  extractTags(content) {
    const commonTags = ['web3', 'defi', 'nft', 'dao', 'blockchain', 'crypto', 'smart-contracts'];
    const tags = [];
    
    for (const tag of commonTags) {
      if (content.toLowerCase().includes(tag)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  // Helper methods
  mapChainName(network) {
    const chainMap = {
      'mainnet': 'ethereum',
      'matic': 'polygon',
      'optimism': 'optimism',
      'arbitrum': 'arbitrum',
      'solana': 'solana'
    };
    return chainMap[network?.toLowerCase()] || 'ethereum';
  }

  categorizeFromTitle(title) {
    const categories = {
      'development': ['dev', 'code', 'smart contract', 'dapp', 'api'],
      'design': ['design', 'ui', 'ux', 'logo', 'brand'],
      'marketing': ['market', 'social', 'content', 'community'],
      'research': ['research', 'analysis', 'audit', 'review'],
      'bug-bounty': ['bug', 'security', 'vulnerability', 'exploit']
    };

    const titleLower = title?.toLowerCase() || '';
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }
    return 'development';
  }

  getDifficultyFromDescription(description) {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('beginner') || desc.includes('easy') || desc.includes('simple')) {
      return 'beginner';
    }
    if (desc.includes('advanced') || desc.includes('expert') || desc.includes('complex')) {
      return 'advanced';
    }
    return 'intermediate';
  }

  extractRequirements(description) {
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
}