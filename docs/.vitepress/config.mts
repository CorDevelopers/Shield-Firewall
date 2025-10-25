import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Core Developer",
  description: "AI-Powered Client-Side Web Application Firewall",
  ignoreDeadLinks: true, // Temporarily ignore dead links during development
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'API Reference', link: '/api-reference' },
      { text: 'Examples', link: '/examples' },
      { text: 'Community', link: '/community' },
      { text: 'Contributing', link: '/contributing' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Installation', link: '/getting-started' },
          { text: 'Quick Start', link: '/quick-start' },
          { text: 'Configuration', link: '/configuration' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'ShieldFirewall Class', link: '/api-reference' },
          { text: 'Examples', link: '/api-examples' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Usage', link: '/examples' }
        ]
      },
      {
        text: 'Community',
        items: [
          { text: 'Community', link: '/community' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/shield-js' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Core Developer Team'
    }
  }
})
