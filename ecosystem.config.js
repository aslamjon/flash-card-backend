module.exports = {
  apps: [
    {
      name: "flash-card",
      script: "src/index.js",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],

  // Deployment Configuration
  deploy: {
    production: {
      user: "root",
      host: "94.250.202.249",
      ref: "origin/main",
      repo: "git@github.com:aslamjon/flash-card-backend.git",
      path: "/root/flash-card",
      "pre-setup": "pwd",
      "pre-deploy-local": "echo 'This is a local deployment'",
      // "post-deploy": "cp ../.env ./ && npm install && pm2 startOrRestart ecosystem.config.js --env production",
      "post-deploy": "npm install && pm2 startOrRestart ecosystem.config.js --env production",
    },
  },
};
