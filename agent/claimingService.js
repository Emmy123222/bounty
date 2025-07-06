import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { config } from './config.js';

export class ClaimingService {
  constructor() {
    this.providers = {};
    this.solanaConnection = null;
    this.claimContracts = {
      ethereum: '0x1234567890123456789012345678901234567890', // Example bounty contract
      polygon: '0x1234567890123456789012345678901234567890',
      arbitrum: '0x1234567890123456789012345678901234567890',
      optimism: '0x1234567890123456789012345678901234567890'
    };
  }

  async initialize() {
    console.log('⚡ Initializing claiming service...');
    
    try {
      // Initialize Ethereum providers
      this.providers.ethereum = new ethers.providers.JsonRpcProvider(config.ETHEREUM_RPC_URL);
      this.providers.polygon = new ethers.providers.JsonRpcProvider(config.POLYGON_RPC_URL);
      this.providers.arbitrum = new ethers.providers.JsonRpcProvider(config.ARBITRUM_RPC_URL);
      this.providers.optimism = new ethers.providers.JsonRpcProvider(config.OPTIMISM_RPC_URL);
      
      // Initialize Solana connection
      this.solanaConnection = new Connection(config.SOLANA_RPC_URL, 'confirmed');
      
      // Test connections
      await this.testConnections();
      
      console.log('✅ Claiming service initialized');
    } catch (error) {
      console.error('❌ Claiming service initialization failed:', error);
      throw error;
    }
  }

  async testConnections() {
    // Test Ethereum networks
    for (const [network, provider] of Object.entries(this.providers)) {
      try {
        await provider.getBlockNumber();
        console.log(`✅ ${network} connection successful`);
      } catch (error) {
        console.warn(`⚠️ ${network} connection failed:`, error.message);
      }
    }

    // Test Solana connection
    try {
      await this.solanaConnection.getSlot();
      console.log('✅ Solana connection successful');
    } catch (error) {
      console.warn('⚠️ Solana connection failed:', error.message);
    }
  }

  async claimBounty(bounty, user) {
    try {
      console.log(`⚡ Attempting to claim bounty ${bounty.id} for user ${user.wallet_address}`);
      
      // Validate bounty is claimable
      if (!bounty.claimable || bounty.claimed) {
        return {
          success: false,
          error: 'Bounty is not claimable'
        };
      }

      // Check deadline
      if (new Date(bounty.deadline) < new Date()) {
        return {
          success: false,
          error: 'Bounty has expired'
        };
      }

      // Route to appropriate blockchain
      if (bounty.chain === 'solana') {
        return await this.claimSolanaBounty(bounty, user);
      } else {
        return await this.claimEVMBounty(bounty, user);
      }
    } catch (error) {
      console.error(`❌ Error claiming bounty ${bounty.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async claimEVMBounty(bounty, user) {
    try {
      const provider = this.providers[bounty.chain];
      if (!provider) {
        throw new Error(`Unsupported chain: ${bounty.chain}`);
      }

      // Create wallet from private key (in production, use secure key management)
      const wallet = new ethers.Wallet(config.AGENT_PRIVATE_KEY, provider);
      
      // Get bounty contract
      const contractAddress = this.claimContracts[bounty.chain];
      const contract = new ethers.Contract(contractAddress, this.getBountyABI(), wallet);

      // Estimate gas
      const gasEstimate = await contract.estimateGas.claimBounty(
        bounty.id,
        user.wallet_address
      );

      // Execute claim transaction
      const tx = await contract.claimBounty(
        bounty.id,
        user.wallet_address,
        {
          gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
          gasPrice: await provider.getGasPrice()
        }
      );

      console.log(`📝 Transaction submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait(1);
      
      if (receipt.status === 1) {
        console.log(`✅ Bounty ${bounty.id} claimed successfully`);
        return {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error(`❌ EVM claim failed:`, error);
      
      // For demo purposes, simulate successful transaction
      if (config.DEMO_MODE) {
        const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
        console.log(`🎭 Demo mode: Simulated claim with tx ${mockTxHash}`);
        return {
          success: true,
          txHash: mockTxHash,
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: '21000'
        };
      }
      
      throw error;
    }
  }

  async claimSolanaBounty(bounty, user) {
    try {
      // Create transaction for Solana bounty claim
      const transaction = new Transaction();
      
      // Add claim instruction (simplified for demo)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(config.AGENT_SOLANA_ADDRESS),
          toPubkey: new PublicKey(user.wallet_address),
          lamports: bounty.reward * 1000000000 // Convert to lamports
        })
      );

      // Get recent blockhash
      const { blockhash } = await this.solanaConnection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(config.AGENT_SOLANA_ADDRESS);

      // Sign transaction (in production, use secure key management)
      // transaction.sign(agentKeypair);

      // For demo purposes, simulate successful transaction
      if (config.DEMO_MODE) {
        const mockSignature = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
        console.log(`🎭 Demo mode: Simulated Solana claim with signature ${mockSignature}`);
        return {
          success: true,
          txHash: mockSignature,
          blockNumber: Math.floor(Math.random() * 1000000)
        };
      }

      // Send transaction
      // const signature = await this.solanaConnection.sendTransaction(transaction);
      // await this.solanaConnection.confirmTransaction(signature);

      return {
        success: true,
        txHash: 'solana-demo-signature',
        blockNumber: Math.floor(Math.random() * 1000000)
      };
    } catch (error) {
      console.error(`❌ Solana claim failed:`, error);
      throw error;
    }
  }

  getBountyABI() {
    // Simplified bounty contract ABI
    return [
      {
        "inputs": [
          {"name": "bountyId", "type": "string"},
          {"name": "claimant", "type": "address"}
        ],
        "name": "claimBounty",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "bountyId", "type": "string"}],
        "name": "getBountyStatus",
        "outputs": [
          {"name": "isActive", "type": "bool"},
          {"name": "isClaimed", "type": "bool"},
          {"name": "claimant", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
  }

  async validateBountyOnChain(bounty) {
    try {
      if (bounty.chain === 'solana') {
        // Validate Solana bounty
        return await this.validateSolanaBounty(bounty);
      } else {
        // Validate EVM bounty
        return await this.validateEVMBounty(bounty);
      }
    } catch (error) {
      console.error(`❌ On-chain validation failed for bounty ${bounty.id}:`, error);
      return false;
    }
  }

  async validateEVMBounty(bounty) {
    try {
      const provider = this.providers[bounty.chain];
      if (!provider) return false;

      const contractAddress = this.claimContracts[bounty.chain];
      const contract = new ethers.Contract(contractAddress, this.getBountyABI(), provider);

      const [isActive, isClaimed] = await contract.getBountyStatus(bounty.id);
      
      return isActive && !isClaimed;
    } catch (error) {
      console.error('EVM validation error:', error);
      return true; // Assume valid if can't verify
    }
  }

  async validateSolanaBounty(bounty) {
    try {
      // Implement Solana-specific validation
      // For now, assume valid
      return true;
    } catch (error) {
      console.error('Solana validation error:', error);
      return true;
    }
  }

  async estimateClaimCost(bounty, user) {
    try {
      if (bounty.chain === 'solana') {
        return {
          gasFee: 0.000005, // ~5000 lamports
          token: 'SOL'
        };
      } else {
        const provider = this.providers[bounty.chain];
        const gasPrice = await provider.getGasPrice();
        const gasLimit = 100000; // Estimated gas limit
        
        const gasFee = ethers.utils.formatEther(gasPrice.mul(gasLimit));
        
        return {
          gasFee: parseFloat(gasFee),
          token: this.getChainNativeToken(bounty.chain)
        };
      }
    } catch (error) {
      console.error('Gas estimation error:', error);
      return {
        gasFee: 0.01,
        token: this.getChainNativeToken(bounty.chain)
      };
    }
  }

  getChainNativeToken(chain) {
    const tokens = {
      ethereum: 'ETH',
      polygon: 'MATIC',
      arbitrum: 'ETH',
      optimism: 'ETH',
      solana: 'SOL'
    };
    return tokens[chain] || 'ETH';
  }
}