module.exports = {
  apps : [{
    name: "BOOK-TID-API",
    script: "./build/server.js",
    instances: "max",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
