'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Download, Shield, Zap, Eye, Github, Chrome, Copy, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      title: "Visit GitHub Repository",
      description: "Go to the VeriHub repository to access the extension code",
      icon: <Github className="h-6 w-6" />,
      command: "https://github.com/mohfazam2/VeriHub",
      action: "open"
    },
    {
      title: "Download the Code",
      description: "Click the 'Code' button and download the ZIP file",
      icon: <Download className="h-6 w-6" />,
      command: "",
      action: "none"
    },
    {
      title: "Extract the Files",
      description: "Unzip the downloaded file to a folder on your computer",
      icon: <div className="text-lg font-bold">📁</div>,
      command: "",
      action: "none"
    },
    {
      title: "Open Chrome Extensions",
      description: "Navigate to chrome://extensions in your Chrome browser",
      icon: <Chrome className="h-6 w-6" />,
      command: "chrome://extensions",
      action: "copy"
    },
    {
      title: "Enable Developer Mode",
      description: "Toggle the 'Developer mode' switch in the top right corner",
      icon: <Shield className="h-6 w-6" />,
      command: "",
      action: "none"
    },
    {
      title: "Load Unpacked Extension",
      description: "Click 'Load unpacked' and select the extracted extension folder",
      icon: <ArrowRight className="h-6 w-6" />,
      command: "",
      action: "none"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      </div>

      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-purple-500/10 blur-3xl"
          style={{ top: '10%', left: '80%' }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
          style={{ top: '60%', left: '10%' }}
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6"
          >
            <Download className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-purple-400 font-medium">
              Get the Extension
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Install VeriHub
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Protect Your Browser
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Follow these simple steps to install the VeriHub browser extension and start detecting misinformation in real-time.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 h-full"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 mr-4">
                  {step.icon}
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-300 mb-4">{step.description}</p>
              
              {step.command && (
                <div className="mt-4">
                  <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                    <code className="text-sm text-gray-300 truncate">
                      {step.command}
                    </code>
                    {step.action === "copy" && (
                      <button
                        onClick={() => copyToClipboard(step.command)}
                        className="ml-2 p-1 text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                    {step.action === "open" && (
                      <a
                        href={step.command}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 p-1 text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Download the VeriHub extension now and join the fight against misinformation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="https://github.com/mohfazam2/VeriHub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-medium px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                <Github className="h-5 w-5" />
                <span>Visit GitHub Repository</span>
              </a>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-2 bg-gray-700/50 hover:bg-gray-700 text-lg font-medium px-8 py-4 rounded-xl transition-all duration-300"
              >
                <ArrowRight className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </motion.div>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-8">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>100% Open Source</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Real-time Detection</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Eye className="h-4 w-4 text-blue-400" />
              <span>Privacy Focused</span>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-3">Is VeriHub free to use?</h3>
              <p className="text-gray-300">
                Yes, VeriHub is completely free and open source. We believe in making misinformation detection accessible to everyone.
              </p>
            </div>
            
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-3">Which browsers are supported?</h3>
              <p className="text-gray-300">
                Currently, VeriHub is available for Chrome and other Chromium-based browsers. Support for Firefox and Safari is coming soon.
              </p>
            </div>
            
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-3">How does VeriHub protect my privacy?</h3>
              <p className="text-gray-300">
                VeriHub processes content locally when possible and only sends necessary data to our secure AI API. We never track your browsing history.
              </p>
            </div>
            
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-3">Can I contribute to the project?</h3>
              <p className="text-gray-300">
                Absolutely! VeriHub is open source and we welcome contributions. Visit our GitHub repository to learn how you can help.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}