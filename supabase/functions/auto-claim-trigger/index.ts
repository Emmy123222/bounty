import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with auto-claim enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('preferences->autoClaimEnabled', true);

    if (usersError) {
      throw usersError;
    }

    const results = [];

    for (const user of users) {
      try {
        // Get bounties that match user's preferences
        const { data: bounties, error: bountiesError } = await supabase
          .from('bounties')
          .select('*')
          .eq('claimable', true)
          .eq('claimed', false)
          .gte('reward', user.preferences.minReward || 0)
          .lte('reward', user.preferences.maxReward || 10000)
          .in('chain', user.preferences.chains || ['ethereum'])
          .in('category', user.preferences.categories || ['development']);

        if (bountiesError) {
          throw bountiesError;
        }

        // Process each bounty for auto-claim
        for (const bounty of bounties) {
          try {
            // Log the auto-claim attempt
            await supabase
              .from('agent_logs')
              .insert({
                type: 'claim',
                message: `Auto-claim attempted for bounty: ${bounty.title}`,
                data: {
                  bountyId: bounty.id,
                  userId: user.id,
                  walletAddress: user.wallet_address,
                  reward: bounty.reward,
                  chain: bounty.chain,
                },
                user_id: user.wallet_address,
              });

            // In a real implementation, you would:
            // 1. Check if the bounty is still claimable
            // 2. Execute the on-chain transaction
            // 3. Update the bounty status
            // 4. Create a transaction record

            // For demo purposes, we'll simulate successful claiming
            const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

            // Update bounty status
            await supabase
              .from('bounties')
              .update({
                claimed: true,
                claimed_by: user.wallet_address,
                updated_at: new Date().toISOString(),
              })
              .eq('id', bounty.id);

            // Create transaction record
            await supabase
              .from('transactions')
              .insert({
                user_id: user.wallet_address,
                bounty_id: bounty.id,
                type: 'auto-claim',
                amount: bounty.reward,
                token: bounty.reward_token,
                chain: bounty.chain,
                tx_hash: mockTxHash,
                status: 'confirmed',
              });

            // Update user stats
            await supabase
              .from('users')
              .update({
                total_earned: user.total_earned + bounty.reward,
                total_claimed: user.total_claimed + 1,
              })
              .eq('id', user.id);

            results.push({
              success: true,
              bountyId: bounty.id,
              userId: user.id,
              txHash: mockTxHash,
              reward: bounty.reward,
            });

            // Log successful claim
            await supabase
              .from('agent_logs')
              .insert({
                type: 'claim',
                message: `Successfully auto-claimed bounty: ${bounty.title}`,
                data: {
                  bountyId: bounty.id,
                  userId: user.id,
                  txHash: mockTxHash,
                  reward: bounty.reward,
                },
                user_id: user.wallet_address,
              });

          } catch (bountyError) {
            console.error(`Error processing bounty ${bounty.id}:`, bountyError);
            
            // Log the error
            await supabase
              .from('agent_logs')
              .insert({
                type: 'error',
                message: `Failed to auto-claim bounty: ${bounty.title}`,
                data: {
                  bountyId: bounty.id,
                  userId: user.id,
                  error: bountyError.message,
                },
                user_id: user.wallet_address,
              });

            results.push({
              success: false,
              bountyId: bounty.id,
              userId: user.id,
              error: bountyError.message,
            });
          }
        }

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({
          success: false,
          userId: user.id,
          error: userError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Auto-claim processing completed',
        results,
        processed: results.length,
        successful: results.filter(r => r.success).length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in auto-claim-trigger function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});