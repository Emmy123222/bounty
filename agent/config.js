export const config = {
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',

  // Exa API Configuration
  EXA_API_KEY: process.env.EXA_API_KEY || 'your-exa-api-key',

  // Blockchain RPC URLs
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-key',
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/your-key',
  ARBITRUM_RPC_URL: process.env.ARBITRUM_RPC_URL || 'https://arbitrum-mainnet.infura.io/v3/your-key',
  OPTIMISM_RPC_URL: process.env.OPTIMISM_RPC_URL || 'https://optimism-mainnet.infura.io/v3/your-key',
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',

  // Agent Wallet Configuration (Use secure key management in production)
  AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  AGENT_SOLANA_ADDRESS: process.env.AGENT_SOLANA_ADDRESS || '11111111111111111111111111111111',

  // Notification Webhooks
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

  // Agent Configuration
  DEMO_MODE: process.env.DEMO_MODE === 'true' || true, // Enable demo mode by default
  MAX_CLAIMS_PER_RUN: parseInt(process.env.MAX_CLAIMS_PER_RUN) || 10,
  CLAIM_DELAY_MS: parseInt(process.env.CLAIM_DELAY_MS) || 2000,

  // Platform API Keys (Optional)
  GITCOIN_API_KEY: process.env.GITCOIN_API_KEY,
  LAYER3_API_KEY: process.env.LAYER3_API_KEY,
  DEWORK_API_KEY: process.env.DEWORK_API_KEY
};