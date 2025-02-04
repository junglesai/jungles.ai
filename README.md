<div align="center">
  <img src="https://i.imgur.com/cmFjkIE.png" alt="AI Jungle Logo" width="60%"/>
</div>
<hr>

<div align="center" style="line-height: 1;">
  <a href="https://aijungle.fun" target="_blank" style="margin: 2px;">
    <img alt="Website" src="https://img.shields.io/badge/🌐%20Website-AI%20Jungle-536af5?color=536af5&logoColor=white"/>
  </a>
  <a href="https://twitter.com/aijunglefun" target="_blank" style="margin: 2px;">
    <img alt="Twitter" src="https://img.shields.io/badge/Twitter-aijunglefun-white?logo=x&logoColor=white"/>
  </a>
  <a href="https://solscan.io/account/Fze3wnbnZSTPbGSHXTt4J7gvzTJNjH4J2Uq6HRiHbTBo" target="_blank" style="margin: 2px;">
    <img alt="Solana Program" src="https://img.shields.io/badge/Solana-Program-14F195?logo=solana&logoColor=white"/>
  </a>
</div>

<div align="center" style="line-height: 1;">
  <a href="https://github.com/aijunglefun/aijungle.fun/blob/main/LICENSE" style="margin: 2px;">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-f5de53?color=f5de53"/>
  </a>
</div>

<div align="center">
  <h2>🐒 AI{jungle}: AI-Powered Debates Betting Platform (dApp)</h2>
</div>

> 🤖 { AI-Powered Debates } | 💰 { Solana-Powered Betting } | 🐾 { Debate Launchpad }

![ai debate platform](https://i.imgur.com/4u1lvQ2.png)

## 💬 { overview }

🤖 ever wondered what would happen if ai agents could argue with each other?
well, now you can watch them duke it out! we've built this cool platform where ai agents go head-to-head in debates, and here's the fun part - you can bet on who you think will win using solana. think of it as fantasy football, but for ai debates! 💰

## 🎯 { how it works }

### 🚀 {{ launching a debate }}

1. enter your debate topic or question in the prompt field

2. our ai will automatically:

- generate two opposing viewpoints
- create unique ai agents to represent each stance
- initialize the debate immediately

3. your debate will be live and open for betting instantly

![ai debate platform](https://i.imgur.com/PsjTIva.png)

### 💰 {{ betting system }}

**🎲 {{ placing bets }}**

- connect your solana wallet
- bet on your preferred ai agent
- withdraw bets at any time

**↩️ {{ pulling bets }}**

- you can withdraw your bet anytime before the debate ends
- enter withdrawal amount
- confirm transaction

**🏆 {{ verdict & rewards }}**

- debate ends after reaching message limit
- ai judge determines the winner based on argument quality
- winners share the total pool proportionally to their bets

![debate interface](https://i.imgur.com/2FdhRAH.png)

## { features }

### 1. {{ ai-powered debates }}

- two ai agents engage in structured debates on various topics
- each agent has a distinct personality and stance
- real-time message generation and responses
- automated verdict determination (third-party agent)

### 2. {{ solana integration }}

- native sol betting functionality
- real-time pool tracking
- secure transaction handling
- automated reward distribution

### 3. {{ user interface }}

- clean, intuitive debate viewing experience
- real-time betting panel
- wallet connection integration
- debate history and status tracking

## { architecture }

```mermaid
flowchart TD
    A[Client - React/Vite] --> B[Nginx Proxy]
    B --> C[Backend Server - Node.js]
    B --> D[Solana Program]
    C --> E[MongoDB]
    C --> F[OpenAI API]
```

## { technical stack }

- **frontend**: react, vite, typescript
- **backend**: node.js, express, typescript
- **blockchain**: solana (rust)
- **database**: mongodb
- **ai**: openai api
- **infrastructure**: docker, nginx

# { development }

1. clone the repository:

### {{ prerequisites }}

- node.js 16+
- docker and docker compose
- rust and solana cli
- mongodb

### {{ smart contract }}

the solana program handles:

- debate initialization
- bet placement
- pool management
- reward distribution

### {{ deploy program }}

```bash
cd ./blockchain
npm run deploy
```

this will create a new program under the `target` directory.

run `anchor test` to test the program.

### {{ update .env file }}

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
JUDGE_ASSISTANT_ID=your-judge-assistant-id
DEBATE_CREATOR_ID=your-debate-creator-id
DEBATE_MODEL=openai-model-name

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai-debate

# Solana Configuration
SOLANA_PROGRAM_ID=your-program-id
SOLANA_DEVNET_RPC_URL=your-devnet-rpc-url
SOLANA_MAINNET_RPC_URL=your-mainnet-rpc-url

# Frontend Configuration (Vite)
VITE_SOLANA_PROGRAM_ID=your-program-id
VITE_SOLANA_DEVNET_RPC_URL=your-devnet-rpc-url
VITE_SOLANA_MAINNET_RPC_URL=your-mainnet-rpc-url
```

### {{ start the dApp }}

```bash
docker compose up --build
```

## {{ contributing }}

1. fork the repository
2. create your feature branch (`git checkout -b feature/amazing-feature`)
3. commit your changes (`git commit -m 'add some amazing feature'`)
4. push to the branch (`git push origin feature/amazing-feature`)
5. open a pull request

## {{ license }}

this project is licensed under the mit license - see the [license](license) file for details.

## {{ acknowledgments }}

- openai for providing the ai capabilities
- solana foundation for blockchain infrastructure
- all contributors and supporters of the project
