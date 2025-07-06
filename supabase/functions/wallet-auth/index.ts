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
    const { walletAddress, signature, message } = await req.json();

    // Verify the signature (simplified for demo)
    // In a production app, you would properly verify the signature
    const isValidSignature = signature && message && walletAddress;

    if (!isValidSignature) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create or update user
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        wallet_address: walletAddress,
        chain: 'ethereum', // Default chain
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating user:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate user' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate JWT token (simplified for demo)
    const token = btoa(JSON.stringify({
      wallet_address: walletAddress,
      user_id: user.id,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }));

    return new Response(
      JSON.stringify({
        token,
        user,
        message: 'Authentication successful'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in wallet-auth function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});