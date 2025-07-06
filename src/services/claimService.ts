import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { supabase } from '../config/supabase';
import { Bounty, Transaction as BountyTransaction } from '../types';
import { BountyService } from './bountyService';

export class ClaimService {
  private static ethereumProvider: ethers.providers.Web3Provider | null = null;
  private static solanaConnection: Connection | null = null;

  static async initializeProviders() {
    // Initialize Ethereum provider
    if (window.ethereum) {
      this.ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
    }

    // Initialize Solana connection
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com');
  }

  static async claimBounty(bounty: Bounty, userAddress: string, isAutomatic = false): Promise<BountyTransaction> {
    try {
      await BountyService.logAgentAction(
        'claim',
        `Attempting to claim bounty: ${bounty.title}`,
        { bountyId: bounty.id, userAddress, isAutomatic }
      );

      let txHash: string;
      
      if (bounty.chain === 'solana') {
        txHash = await this.claimSolanaBounty(bounty, userAddress);
      } else {
        txHash = await this.claimEthereumBounty(bounty, userAddress);
      }

      // Create transaction record
      const transaction: BountyTransaction = {
        id: crypto.randomUUID(),
        userId: userAddress,
        bountyId: bounty.id,
        type: isAutomatic ? 'auto-claim' : 'claim',
        amount: bounty.reward,
        token: bounty.rewardToken,
        chain: bounty.chain,
        txHash,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      // Store transaction in database
      const { error } = await supabase
        .from('transactions')
        .insert(transaction);

      if (error) {
        throw error;
      }

      // Update bounty status
      await supabase
        .from('bounties')
        .update({
          claimed: true,
          claimed_by: userAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bounty.id);

      await BountyService.logAgentAction(
        'claim',
        `Successfully claimed bounty: ${bounty.title}`,
        { bountyId: bounty.id, txHash, userAddress }
      );

      return transaction;
    } catch (error) {
      await BountyService.logAgentAction(
        'error',
        `Failed to claim bounty: ${bounty.title} - ${error}`,
        { bountyId: bounty.id, userAddress, error: error.toString() }
      );
      throw error;
    }
  }

  private static async claimEthereumBounty(bounty: Bounty, userAddress: string): Promise<string> {
    if (!this.ethereumProvider) {
      throw new Error('Ethereum provider not initialized');
    }

    const signer = this.ethereumProvider.getSigner();
    
    // For demonstration, we'll create a simple transaction
    // In a real implementation, you would interact with the bounty contract
    const tx = await signer.sendTransaction({
      to: bounty.contractAddress || '0x0000000000000000000000000000000000000000',
      value: ethers.utils.parseEther('0'), // No ETH being sent
      data: '0x', // Contract call data would go here
    });

    return tx.hash;
  }

  private static async claimSolanaBounty(bounty: Bounty, userAddress: string): Promise<string> {
    if (!this.solanaConnection) {
      throw new Error('Solana connection not initialized');
    }

    // For demonstration, we'll create a simple transaction
    // In a real implementation, you would interact with the bounty program
    const transaction = new Transaction();
    
    // Add instructions to the transaction
    // This would typically involve calling a Solana program
    
    // For now, we'll return a mock transaction hash
    return 'solana-tx-hash-' + Date.now();
  }

  static async getTransactionHistory(userAddress: string): Promise<BountyTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userAddress)
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  static async updateTransactionStatus(txHash: string, status: 'confirmed' | 'failed'): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('tx_hash', txHash);

    if (error) {
      throw error;
    }
  }
}