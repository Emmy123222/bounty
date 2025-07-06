import axios from 'axios';
import { config } from './config.js';

export class NotificationService {
  constructor() {
    this.webhooks = {
      slack: config.SLACK_WEBHOOK_URL,
      discord: config.DISCORD_WEBHOOK_URL,
      telegram: config.TELEGRAM_BOT_TOKEN
    };
  }

  async initialize() {
    console.log('🔔 Initializing notification service...');
    // Test webhook connections if configured
    console.log('✅ Notification service initialized');
  }

  async sendClaimNotifications(claimResults) {
    try {
      const successfulClaims = claimResults.filter(r => r.success);
      if (successfulClaims.length === 0) return;

      const message = this.formatClaimMessage(successfulClaims);
      
      // Send to all configured channels
      await Promise.allSettled([
        this.sendSlackNotification(message),
        this.sendDiscordNotification(message),
        this.sendTelegramNotification(message)
      ]);

      console.log(`🔔 Sent notifications for ${successfulClaims.length} successful claims`);
    } catch (error) {
      console.error('❌ Failed to send notifications:', error);
    }
  }

  formatClaimMessage(claimResults) {
    const totalClaims = claimResults.length;
    const totalReward = claimResults.reduce((sum, r) => sum + (r.reward || 0), 0);

    return {
      title: '🎯 BountyHunter AI+ - Auto-Claims Executed',
      description: `Successfully claimed ${totalClaims} bounties with total rewards of $${totalReward.toLocaleString()}`,
      fields: claimResults.slice(0, 5).map(result => ({
        name: `Bounty ${result.bountyId}`,
        value: `User: ${result.userId}\nTx: ${result.txHash}`,
        inline: true
      })),
      color: 0x00ff00,
      timestamp: new Date().toISOString()
    };
  }

  async sendSlackNotification(message) {
    if (!this.webhooks.slack) return;

    try {
      await axios.post(this.webhooks.slack, {
        text: message.title,
        attachments: [{
          color: 'good',
          title: message.title,
          text: message.description,
          fields: message.fields?.map(f => ({
            title: f.name,
            value: f.value,
            short: f.inline
          })),
          ts: Math.floor(Date.now() / 1000)
        }]
      });
    } catch (error) {
      console.error('Slack notification failed:', error);
    }
  }

  async sendDiscordNotification(message) {
    if (!this.webhooks.discord) return;

    try {
      await axios.post(this.webhooks.discord, {
        embeds: [{
          title: message.title,
          description: message.description,
          color: message.color,
          fields: message.fields,
          timestamp: message.timestamp
        }]
      });
    } catch (error) {
      console.error('Discord notification failed:', error);
    }
  }

  async sendTelegramNotification(message) {
    if (!this.webhooks.telegram) return;

    try {
      const text = `${message.title}\n\n${message.description}`;
      
      await axios.post(`https://api.telegram.org/bot${this.webhooks.telegram}/sendMessage`, {
        chat_id: config.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Telegram notification failed:', error);
    }
  }

  async sendErrorAlert(error, context) {
    const message = {
      title: '🚨 BountyHunter AI+ - Error Alert',
      description: `Error in ${context}: ${error.message}`,
      color: 0xff0000,
      timestamp: new Date().toISOString()
    };

    await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendDiscordNotification(message)
    ]);
  }
}