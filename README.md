# Vybe Telegram Bot

The Vybe Telegram Bot is a powerful tool designed for real-time analytics and exploration on the Solana blockchain. Built with NestJS and integrated with the Telegraf library, this bot provides users with seamless access to a wide range of on-chain analytics, including price-related metrics, wallet tracking, token metrics, and decentralized exchange (DEX) and automated market maker (AMM) program data through an intuitive Telegram interface.

## Features

The bot offers a comprehensive set of functionalities across multiple modules, accessible via commands and interactive scenes. Below are the key features grouped by module:

### Prices Module
1. **Pyth Accounts Explorer**
   - Retrieve Pyth accounts filtered by `productId`, `priceFeedId`, or `symbol`.
   - Display account details such as symbol, price feed ID, and product ID.
   - Example Command: `/pythaccounts`
   - Metrics Provided:
     - Symbol (e.g., BTC/USD)
     - Price Feed ID (Solana address)
     - Product ID (Solana address)

2. **Pyth Price Explorer**
   - Fetch real-time price data for a specific price feed ID.
   - Display price, confidence interval, last updated timestamp, valid slot, and exponential moving averages (EMA).
   - Example Command: `/pythprice`
   - Metrics Provided:
     - Price Feed Account (Solana address)
     - Current Price
     - Confidence Interval
     - Last Updated Timestamp
     - Valid Slot
     - 1H EMAC and EMAP

3. **Pyth Price Time Series Explorer**
   - Retrieve historical price data within a specified time range and resolution (hourly, daily, weekly, monthly, yearly).
   - Display price, confidence, valid slot, and timestamp for each data point.
   - Example Command: `/pythpricets`
   - Metrics Provided:
     - Price at specific timestamps
     - Confidence Interval
     - Valid Slot
     - Timestamp

4. **Pyth Price OHLC Explorer**
   - Fetch Open, High, Low, Close (OHLC) data for a price feed ID within a specified time range and resolution.
   - Display OHLC values, average price, and average confidence.
   - Example Command: `/pythpriceohlc`
   - Metrics Provided:
     - Open, High, Low, Close Prices
     - Average Price
     - Average Confidence
     - Time Bucket Start

5. **Pyth Product Explorer**
   - Retrieve metadata for a specific product ID.
   - Display product details such as description, symbol, asset type, quote, base, schedule, and generic symbol.
   - Example Command: `/pythproduct`
   - Metrics Provided:
     - Product ID (Solana address)
     - Description
     - Symbol (e.g., BTC/USD)
     - Asset Type
     - Quote and Base Currencies
     - Schedule
     - Generic Symbol

6. **DEX and AMM Programs Explorer**
   - Fetch a list of DEX and AMM programs on the Solana blockchain.
   - Display program names and IDs.
   - Example Command: `/dexamm`
   - Metrics Provided:
     - Program Name
     - Program ID (Solana address)

7. **Token OHLCV Explorer**
   - Fetch Open, High, Low, Close, Volume (OHLCV) data for a token mint address within a specified time range and resolution (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1mo).
   - Example Command: `/tokenohlcv`
   - Metrics Provided:
     - Open, High, Low, Close Prices
     - Volume
     - Time Bucket Start

### Known Accounts Module
1. **Known Accounts Explorer**
   - Retrieve labeled Solana accounts filtered by labels, name, or entity.
   - Example Command: `/knownaccounts`
   - Metrics Provided:
     - Account Name
     - Address (Solana address)
     - Labels (e.g., DEFI, NFT)
     - Entity (e.g., Solana Foundation)

2. **Token Balances Explorer**
   - View token balances for a specific Solana account address.
   - Example Command: `/tokenbalances`
   - Metrics Provided:
     - Token Name and Symbol
     - Mint Address
     - Amount
     - Value (USD)
     - 1-Day Change

3. **Token Balances Time Series Explorer**
   - Retrieve historical token balances for a Solana account over a specified number of days (1-30).
   - Example Command: `/tokenbalancests`
   - Metrics Provided:
     - Date
     - Token Value (USD)
     - Stake Value (USD and SOL)
     - System Value (USD)

4. **Wallet Profit and Loss (PnL) Explorer**
   - Analyze trading performance and PnL for a Solana account over a specified time period (1d, 7d, 30d).
   - Example Command: `/walletpnl`
   - Metrics Provided:
     - Win Rate (%)
     - Realized and Unrealized PnL (USD)
     - Unique Tokens Traded
     - Average Trade (USD)
     - Total Trades
     - Winning and Losing Trades
     - Trade Volume (USD)
     - Best and Worst Performing Tokens
     - Per-Token Metrics (Buys, Sells, Realized/Unrealized PnL)

### Tokens Module
1. **Tokens Explorer**
   - Retrieve a list of tracked Solana tokens with filtering and sorting options (e.g., by market cap, price).
   - Example Command: `/tokens`
   - Metrics Provided:
     - Token Name and Symbol
     - Mint Address
     - Market Cap
     - Price

2. **Top Token Holders Explorer**
   - View top holders for a specific token mint address.
   - Example Command: `/tokenholders`
   - Metrics Provided:
     - Holder Address
     - Amount Held

3. **Token Details Explorer**
   - Retrieve detailed information for a specific token mint address.
   - Example Command: `/tokendetails`
   - Metrics Provided:
     - Token Name and Symbol
     - Mint Address
     - Supply
     - Decimals
     - Metadata

4. **Token Volume Time Series Explorer**
   - View volume trends for a token mint address over a specified time range and interval (hourly, daily, weekly).
   - Example Command: `/tokenvolume`
   - Metrics Provided:
     - Volume (USD)
     - Timestamp

5. **Token Holders Time Series Explorer**
   - View trends in token holders for a token mint address over a specified time range.
   - Example Command: `/tokenholdersts`
   - Metrics Provided:
     - Number of Holders
     - Timestamp

6. **Token Transfers Explorer**
   - Retrieve token transfer transactions for a token mint address within a specified time range and amount range.
   - Example Command: `/tokentransfers`
   - Metrics Provided:
     - Transaction ID
     - Source and Destination Addresses
     - Amount
     - Timestamp

7. **Token Trades Explorer**
   - Retrieve trade transactions for a token mint address within a specified time range and resolution.
   - Example Command: `/tokentrades`
   - Metrics Provided:
     - Transaction ID
     - Trade Amount (USD)
     - Timestamp

### Programs Module
1. **Programs Explorer**
   - Retrieve Solana programs with on-chain IDLs, filtered by labels (e.g., DEFI, NFT).
   - Example Command: `/programs`
   - Metrics Provided:
     - Program Name
     - Program ID (Solana address)
     - Labels

2. **Program Transaction Count Time Series Explorer**
   - View transaction count trends for a program address over a specified time range (4h, 12h, 24h, 1d, 7d, 30d).
   - Example Command: `/programtxcount`
   - Metrics Provided:
     - Transaction Count
     - Timestamp

3. **Program Instruction Count Time Series Explorer**
   - View instruction count trends for a program address over a specified time range.
   - Example Command: `/programixcount`
   - Metrics Provided:
     - Instruction Count
     - Timestamp

4. **Program Active Users Time Series Explorer**
   - View active users trends for a program address over a specified time range.
   - Example Command: `/programactiveusersts`
   - Metrics Provided:
     - Active Users Count
     - Timestamp

5. **Program Active Users Explorer**
   - View active users for a program address over a specified number of days (1-30).
   - Example Command: `/programactiveusers`
   - Metrics Provided:
     - User Address
     - Transaction or Instruction Count

6. **Program Details Explorer**
   - Retrieve detailed information for a specific program address.
   - Example Command: `/programdetails`
   - Metrics Provided:
     - Program Name
     - Program ID
     - Metadata

7. **Program Ranking Explorer**
   - View top-ranked Solana programs based on a specified interval (daily, weekly, monthly).
   - Example Command: `/programranking`
   - Metrics Provided:
     - Program Name
     - Program ID
     - Ranking Score

### NFT Module
1. **NFT Collection Owners Explorer**
   - View owners of a specific NFT collection address.
   - Example Command: `/nftowners`
   - Metrics Provided:
     - Owner Address
     - Number of NFTs Owned

### Markets Module
1. **Markets Explorer**
   - Retrieve available markets for a specific Solana program ID with pagination.
   - Example Command: `/markets`
   - Metrics Provided:
     - Market Name and ID
     - Program Name and ID
     - Base Token Name and Symbol
     - Quote Token Name and Symbol
     - Updated At Timestamp

### Additional Features
- **Interactive Wizards**: Each feature is implemented as a Telegraf wizard scene, guiding users through input collection (e.g., price feed ID, time range, resolution).
- **Error Handling**: Robust error handling with retry options and user-friendly messages for invalid inputs or API failures.
- **Custom Keyboards**: Inline keyboards for navigation, filtering, and actions like retry, cancel, or return to the main menu.
- **Cancel Command**: Users can cancel any operation using `/cancel`.
- **Main Menu Navigation**: Quick access to the main menu for seamless exploration.
- **Help Command**: Display all available commands with descriptions using `/help`.

## Installation

Follow these steps to set up and run the Vybe Telegram Bot locally or on a server.

### Prerequisites
- **Node.js**: Version 18.x or higher
- **PostgreSQL**: A running PostgreSQL database (local or hosted, e.g., Neon)
- **Telegram Bot Token**: Obtain from BotFather on Telegram
- **Vybe API Key**: Required for accessing the Vybe API (contact @EricVybe on Telegram for a free key during the hackathon)
- **Git**: For cloning the repository
- **Yarn** or **npm**: For package management

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/vybe-bot.git
   cd vybe-bot
   ```

2. **Install Dependencies**
   Using npm:
   ```bash
   npm install
   ```
   Or using Yarn:
   ```bash
   yarn install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the project root and add the following:
   ```env
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
   VYBE_API_URL=https://api.vybenetwork.xyz
   VYBE_API_KEY=your-vybe-api-key
   PORT=3000
   NODE_ENV=development
   ```
   Replace placeholders with your actual values:
   - `TELEGRAM_BOT_TOKEN`: From BotFather
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `VYBE_API_KEY`: From Vybe Network (@EricVybe on Telegram)

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Run the Application**
   For development with hot-reloading:
   ```bash
   npm run start:dev
   ```
   For production:
   ```bash
   npm run start:prod
   ```

6. **Verify the Bot**
   - Open Telegram and start a chat with your bot using the handle associated with your `TELEGRAM_BOT_TOKEN`.
   - Use commands like `/start`, `/pythaccounts`, `/tokenbalances`, or `/markets` to interact.

### Database Setup
- The bot uses Kysely with PostgreSQL for data persistence and session storage.
- Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL`.
- The bot automatically sets up the necessary schema for session storage using the `PgSessionStore`.

### Optional: Linting and Testing
- **Linting**: Run `npm run lint` to check code style with ESLint.
- **Unit Tests**: Run `npm run test` to execute Jest tests.
- **End-to-End Tests**: Run `npm run test:e2e` for integration tests.

## Usage

1. **Start the Bot**
   - Message the bot on Telegram with `/start` to access the main menu.
   - Use commands or interact with inline keyboards to navigate features.

2. **Example Commands**
   - `/pythaccounts`: Start the Pyth Accounts Explorer.
   - `/pythprice`: Fetch current price for a price feed ID.
   - `/pythpricets`: Retrieve historical price data.
   - `/pythpriceohlc`: Get OHLC data.
   - `/tokenohlcv`: Get token OHLCV data.
   - `/pythproduct`: View product metadata.
   - `/dexamm`: List DEX and AMM programs.
   - `/knownaccounts`: Explore labeled Solana accounts.
   - `/tokenbalances`: View token balances for an account.
   - `/walletpnl`: Analyze wallet trading performance.
   - `/nftowners`: View NFT collection owners.
   - `/tokens`: List tracked tokens.
   - `/tokenholders`: View top token holders.
   - `/markets`: View markets for a program.
   - `/cancel`: Cancel the current operation.
   - `/help`: Display all available commands.

3. **Example Interaction**
   - **Command**: `/pythprice`
   - **Bot Response**: "Please provide the Price Feed ID."
   - **User Input**: `8Jq3bUtiU3VBwD2aEPtD3hRuhYgFgYSR3x2fDqXyoW9v`
   - **Bot Output**:
     ```
     📈 Pyth Price Results:
     Price Feed Account: 8Jq3bUtiU3VBwD2aEPtD3hRuhYgFgYSR3x2fDqXyoW9v
     💸 Price: 62345.12
     📊 Confidence: 123.45
     ⏰ Last Updated: Wed, 30 Apr 2025 10:00:00 GMT
     🎰 Valid Slot: 123456789
     📈 1H EMAC: 62200.50
     📉 1H EMAP: 62350.75
     ```

   - **Command**: `/walletpnl`
   - **Bot Response**: "Enter a Solana account address to view its trading performance and PnL."
   - **User Input**: `D5DabCKBxypZDGS4H8HJtTkdXSKtYiM6N3HiYNYa8U9t`
   - **Bot Response**: "Select the time period for PnL analysis: 1 Day, 7 Days, 30 Days."
   - **User Input**: Selects "7 Days"
   - **Bot Output**:
     ```
     📊 Wallet PnL Analysis (7d):
     📈 Win Rate: 65.50%
     💰 Realized PnL (USD): $1250.75
     📊 Unrealized PnL (USD): $320.40
     🔢 Unique Tokens Traded: 12
     💸 Average Trade (USD): $450.25
     📝 Total Trades: 45
     ✅ Winning Trades: 30
     ❌ Losing Trades: 15
     📉 Trade Volume (USD): $20250.00
     🏆 Best Token: SOL
     📉 Worst Token: USDC
     ```

4. **Error Handling**
   - If an API call fails, the bot provides an error message with a "Try Again" button.
   - Invalid inputs (e.g., non-Solana address) prompt user-friendly error messages, e.g., "❌ Invalid format. Please provide a valid Solana address."

## Example Metrics Provided

Below are examples of the metrics returned by key features:

### Pyth Accounts
```markdown
📈 Pyth Accounts Results:
1. BTC/USD
   📍 Price Feed ID: 8Jq3bUtiU3VBwD2aEPtD3hRuhYgFgYSR3x2fDqXyoW9v
   🛠️ Product ID: H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
```

### Pyth Price
```markdown
📈 Pyth Price Results:
Price Feed Account: 8Jq3bUtiU3VBwD2aEPtD3hRuhYgFgYSR3x2fDqXyoW9v
💸 Price: 62345.12
📊 Confidence: 123.45
⏰ Last Updated: Wed, 30 Apr 2025 10:00:00 GMT
🎰 Valid Slot: 123456789
📈 1H EMAC: 62200.50
📉 1H EMAP: 62350.75
```

### Pyth Price Time Series
```markdown
📈 Pyth Price Time Series Results:
1. Time: Wed, 30 Apr 2025 09:00:00 GMT
   💸 Price: 62200.00
   📊 Confidence: 120.00
   🎰 Valid Slot: 123456700
2. Time: Wed, 30 Apr 2025 08:00:00 GMT
   💸 Price: 62150.00
   📊 Confidence: 118.50
   🎰 Valid Slot: 123456600
```

### Pyth Price OHLC
```markdown
📈 Pyth OHLC Results:
1. Time: Wed, 30 Apr 2025 09:00:00 GMT
   📈 Open: 62200.00
   ⬆️ High: 62350.00
   ⬇️ Low: 62100.00
   📉 Close: 62345.12
   📊 Average Price: 62248.78
   🔍 Average Confidence: 121.25
```

### Pyth Product
```markdown
📈 Pyth Product Results:
📌 Product ID: H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
📝 Description: Bitcoin / USD
💱 Symbol: BTC/USD
📊 Asset Type: Crypto
💵 Quote: USD
⚖️ Base: BTC
📅 Schedule: 24/7
🔖 Generic Symbol: BTCUSD
```

### DEX and AMM Programs
```markdown
📈 DEX and AMM Programs Results:
1. Raydium
   🆔 Program ID: 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
2. Orca
   🆔 Program ID: 9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP
```

### Known Accounts
```markdown
📊 Known Solana Accounts:
1. Openbook
   📍 Address: 4MangoMjicB4nhfBraAv7kZ6q1Hs1A9Q2QLtyCnefCay
   🏷️ Labels: DEX, DEFI
   🏢 Entity: Serum
```

### Token Balances
```markdown
💰 Token Balances:
1. SOL (SOL)
   📍 Address: So11111111111111111111111111111111111111112
   💰 Amount: 100.5
   💵 Value (USD): $1750.25
   📈 1d Change: 2.5%
```

### Token Balances Time Series
```markdown
📈 Token Balances Time Series:
1. Date: 2025-04-30
   💰 Token Value (USD): $2500.00
   🥩 Stake Value (USD): $500.00
   💸 System Value (USD): $1000.00
   🪙 Stake Value (SOL): 25.0
```

### Wallet PnL
```markdown
📊 Wallet PnL Analysis (7d):
📈 Win Rate: 65.50%
💰 Realized PnL (USD): $1250.75
📊 Unrealized PnL (USD): $320.40
🔢 Unique Tokens Traded: 12
💸 Average Trade (USD): $450.25
📝 Total Trades: 45
✅ Winning Trades: 30
❌ Losing Trades: 15
📉 Trade Volume (USD): $20250.00
🏆 Best Token: SOL
📉 Worst Token: USDC
```

### NFT Collection Owners
```markdown
🎨 NFT Collection Owners:
1. Owner: D5DabCKBxypZDGS4H8HJtTkdXSKtYiM6N3HiYNYa8U9t
   🎨 NFTs Owned: 5
```

### Markets
```markdown
📊 Available Markets:
1. SOL/USDC
   🆔 Market ID: 8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6
   Program: Raydium (675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)
   Base Token: SOL (SOL)
   Quote Token: USDC (USDC)
   Updated At: 2025-04-30T10:00:00.000Z
```

## Project Structure

```
vybe-bot/
├── src/
│   ├── modules/
│   │   ├── known-accounts/
│   │   │   ├── known-accounts.module.ts
│   │   │   ├── known-accounts.scene.ts
│   │   │   ├── known-accounts.service.ts
│   │   │   ├── known-accounts.update.ts
│   │   │   ├── token-balances.scene.ts
│   │   │   ├── token-balances-ts.scene.ts
│   │   │   ├── wallet-pnl.scene.ts
│   │   ├── markets/
│   │   │   ├── markets.module.ts
│   │   │   ├── markets.scene.ts
│   │   │   ├── markets.service.ts
│   │   │   ├── markets.update.ts
│   │   ├── nft/
│   │   │   ├── nft.module.ts
│   │   │   ├── nft-collection-owners.scene.ts
│   │   │   ├── nft.service.ts
│   │   │   ├── nft.update.ts
│   │   ├── prices/
│   │   │   ├── dex-amm.scene.ts
│   │   │   ├── prices.module.ts
│   │   │   ├── prices.service.ts
│   │   │   ├── prices.update.ts
│   │   │   ├── pyth-accounts.scene.ts
│   │   │   ├── pyth-price.scene.ts
│   │   │   ├── pyth-price-ts.scene.ts
│   │   │   ├── pyth-price-ohlc.scene.ts
│   │   │   ├── pyth-product.scene.ts
│   │   ├── programs/
│   │   │   ├── programs.module.ts
│   │   │   ├── programs.scene.ts
│   │   │   ├── program-tx-count.scene.ts
│   │   │   ├── program-ix-count.scene.ts
│   │   │   ├── program-active-users-ts.scene.ts
│   │   │   ├── program-active-users.scene.ts
│   │   │   ├── program-details.scene.ts
│   │   │   ├── program-ranking.scene.ts
│   │   ├── tokens/
│   │   │   ├── tokens.module.ts
│   │   │   ├── tokens.scene.ts
│   │   │   ├── token-holders.scene.ts
│   │   │   ├── token-details.scene.ts
│   │   │   ├── token-volume.scene.ts
│   │   │   ├── token-holders-ts.scene.ts
│   │   │   ├── token-transfers.scene.ts
│   │   │   ├── token-trades.scene.ts
│   │   ├── shared/
│   │   │   ├── keyboard.service.ts
│   │   │   ├── vybe-api.service.ts
│   ├── types/
│   ├── enums/
│   ├── constants/
│   ├── utils/
├── .env
├── package.json
├── README.md
```

## Dependencies

Key dependencies include:
- `@nestjs/*`: NestJS framework for building the application
- `nestjs-telegraf`: Integration with Telegraf for Telegram bot functionality
- `telegraf`: Telegram bot framework
- `@solana/web3.js`: Solana blockchain interactions
- `axios`: HTTP requests to the Vybe API
- `kysely` and `pg`: PostgreSQL database integration
- `class-validator` and `class-transformer`: Data validation and transformation

See `package.json` for the full list.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License, making it fully open-source and suitable for commercial use. See the `LICENSE` file for details.

## Contact

For issues or inquiries, contact the me via Telegram (@ritikbhatt020) or open an issue on the GitHub repository. For general support, join the Vybe Network community at https://t.me/VybeNetwork_Official.

## Resources
- [Vybe API Documentation](https://docs.vybenetwork.com)
- [Vybe Analytics](https://www.vybenetwork.com)
- [Telegram Docs](https://core.telegram.org/bots/api)

---

Built with ❤️ by Ritik Bhatt for the Vybe community.