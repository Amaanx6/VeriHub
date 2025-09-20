import Link from 'next/link';
import { Shield, Github, Twitter, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Demo', href: '/demo' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Download', href: '/download' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/news' },
      { name: 'Comparison', href: '/comparison' },
      { name: 'Testimonials', href: '/testimonials' },
    ],
    resources: [
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
    ],
    social: [
      { name: 'GitHub', href: 'https://github.com/verihub', icon: Github },
      { name: 'Twitter', href: 'https://twitter.com/verihub', icon: Twitter },
      { name: 'Email', href: 'mailto:hello@verihub.com', icon: Mail },
    ],
  };

  return (
    <footer className="bg-dark-surface border-t border-veri-purple/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-veri-purple" />
              <span className="text-xl font-bold gradient-text">VeriHub</span>
            </div>
            <p className="text-veri-gray-light mb-6 max-w-md">
              Advanced AI-powered browser extension that detects and fights misinformation
              in real-time. Join thousands who trust VeriHub to keep them informed.
            </p>
            <div className="flex space-x-4">
              {footerLinks.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-veri-gray hover:text-veri-purple transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-veri-gray-light hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-veri-gray-light hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-veri-gray-light hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-veri-purple/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-veri-gray text-sm">
            © {new Date().getFullYear()} VeriHub. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-veri-gray">
              <div className="w-2 h-2 bg-veri-success rounded-full animate-pulse" />
              <span>Open Source Project</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-veri-gray">
              <Shield className="h-3 w-3" />
              <span>Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}