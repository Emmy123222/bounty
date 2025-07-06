import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Bot, 
  Zap, 
  Shield, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Star,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import WalletConnect from './WalletConnect';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Discovery',
      description: 'Our AI agent automatically discovers and filters bounties from top platforms like Gitcoin, Layer3, and Dework.',
      color: 'from-purple-600 to-blue-600'
    },
    {
      icon: Zap,
      title: 'Auto-Claiming',
      description: 'Set up automated claiming with custom filters. Never miss a bounty that matches your criteria.',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: Shield,
      title: 'Secure & Trustless',
      description: 'Wallet-only authentication with direct on-chain transactions. Your keys, your bounties.',
      color: 'from-cyan-600 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Smart Recommendations',
      description: 'AI-powered suggestions based on your claiming history and preferences.',
      color: 'from-green-600 to-yellow-600'
    },
    {
      icon: Clock,
      title: 'Real-Time Monitoring',
      description: 'Live updates on bounty status, deadlines, and new opportunities.',
      color: 'from-yellow-600 to-red-600'
    },
    {
      icon: Star,
      title: 'Multi-Chain Support',
      description: 'Works across Ethereum, Solana, Polygon, Arbitrum, and more.',
      color: 'from-red-600 to-pink-600'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Bounties Tracked' },
    { number: '$2M+', label: 'Total Rewards' },
    { number: '500+', label: 'Active Users' },
    { number: '24/7', label: 'Monitoring' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 text-white">
      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center"
            >
              <Target className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold">BountyHunter AI+</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Autonomous Web3 Bounty Hunter
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Never miss a bounty again. Our AI agent automatically discovers, filters, and claims 
              Web3 bounties across all major platforms while you focus on building.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 font-semibold text-lg"
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-200 font-semibold text-lg">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-20"
          />
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20"
          />
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full opacity-20"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose BountyHunter AI+?
            </h3>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built for the modern Web3 developer who wants to maximize earning potential 
              without the manual effort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h4>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Start Earning?
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already maximizing their Web3 earnings 
              with our AI-powered bounty hunting platform.
            </p>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 font-semibold text-lg mx-auto"
            >
              Launch Dashboard
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-black/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">BountyHunter AI+</span>
          </div>
          <p className="text-gray-400">
            The most advanced Web3 bounty hunting platform. Built by developers, for developers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;