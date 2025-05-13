import { Commands } from '../enums/commands.enum';

export type CommandDescriptions = {
    [key in Commands]: string;
};

export const commandDescriptions: CommandDescriptions = {
    [Commands.KnownAccounts]: '/knownaccounts - 🏷️ View labeled Solana accounts',
    [Commands.TokenBalances]: '/tokenbalances - 💰 View token balances for a Solana account',
    [Commands.TokenBalancesTs]: '/tokenbalancests - 📈 View token balances time series for a Solana account',
    [Commands.WalletPnl]: '/walletpnl - 📊 View wallet trading performance and PnL analysis',
    [Commands.NftOwners]: '/nftowners - 🎨 View owners of an NFT collection',
    [Commands.Tokens]: '/tokens - 📊 View a list of tracked Solana tokens',
    [Commands.TokenHolders]: '/tokenholders - 👥 View top token holders for a Solana token',
    [Commands.TokenDetails]: '/tokendetails - 📋 View detailed information for a Solana token',
    [Commands.TokenVolume]: '/tokenvolume - 📈 View token volume time series for a Solana token',
    [Commands.TokenHoldersTs]: '/tokenholdersts - 📊 View token holders time series for a Solana token',
    [Commands.TokenTransfers]: '/tokentransfers - 💸 View token transfer transactions for a Solana token',
    [Commands.TokenTrades]: '/tokentrades - 📊 View token trade transactions for a Solana token',
    [Commands.TokenOhlcv]: '/tokenohlcv - 📊 View token OHLCV price data',
    [Commands.Programs]: '/programs - 🛠️ View Solana programs with on-chain IDLs',
    [Commands.ProgramTxCount]: '/programtxcount - 📈 View transaction count time series for a Solana program',
    [Commands.ProgramIxCount]: '/programixcount - 📈 View instruction count time series for a Solana program',
    [Commands.ProgramActiveUsersTs]: '/programactiveusersts - 📈 View active users time series for a Solana program',
    [Commands.ProgramActiveUsers]: '/programactiveusers - 📈 View active users for a Solana program',
    [Commands.ProgramDetails]: '/programdetails - 📋 View details for a Solana program',
    [Commands.ProgramRanking]: '/programranking - 🏆 View top-ranked Solana programs',
    [Commands.PythAccounts]: '/pythaccounts - 📈 View Pyth oracle price accounts',
    [Commands.PythPrice]: '/pythprice - 💸 View Pyth oracle price data for a price feed',
    [Commands.PythPriceTs]: '/pythpricets - 📈 View Pyth oracle price time series data',
    [Commands.PythPriceOhlc]: '/pythpriceohlc - 📊 View Pyth oracle OHLC price data',
    [Commands.PythProduct]: '/pythproduct - 📋 View Pyth oracle product metadata',
    [Commands.DexAmm]: '/dexamm - 🛠️ View DEX and AMM programs for trades and prices',
    [Commands.Markets]: '/markets - 📊 View available markets for a Solana program',
    [Commands.TokenPrice]: '/tokenprice - 💰 View token price and 24h price change for a Solana token',
    [Commands.HELP]: '/help - 📚 Get help with using the bot',
    [Commands.MAIN_MENU]: '/main_menu - 🏠 Go back to the main menu',
    [Commands.Alerts]: '/alerts - 🔔 Manage your token price alerts',
    [Commands.Cancel]: '/cancel - 🚫 Cancel the current operation',
};

export const BOT_MESSAGES = {
    WELCOME: `👋 <b>Welcome to VybeBot: Your Ultimate Solana Analytics Wingman!</b>

🌊 Dive into the Solana blockchain with <b>real-time insights</b>!
📈 Track token balances, analyze wallet performance 
🖼️ explore NFT owners , and tap into Pyth oracle prices 
📊—VybeBot's sleek commands make it all a breeze! 😎

<b>Smash that button below</b> to unleash the full power of Solana analytics! 💥✨`,

    HELP_HEADER: `📚<b> VybeBot Commands</b>\n\nHere are all the commands you can use:\n\n`,

    MAIN_MENU: `🏠 <b>VybeBot Main Menu</b>

What would you like to explore today?

Choose an option below or type a command:`,

    ERROR: {
        GENERIC: '❌ Something went wrong. Please try again later.',
        API_ERROR: '❌ Failed to fetch data from the API. Please try again later.',
        INVALID_FORMAT: '❌ Invalid format. Please provide a valid Solana address or program name.',
        INVALID_TIMESTAMP: '❌ Invalid timestamp. Please provide a valid Unix timestamp.',
        INVALID_INTERVAL: '❌ Invalid interval. Please select Hourly, Daily, or Weekly.',
        INVALID_AMOUNT: '❌ Invalid amount. Please provide a valid number.',
        INVALID_RESOLUTION: '❌ Invalid resolution. Please select a valid resolution (e.g., 1s, 1m, 5m, 15m, 30m, 1h, 2h, 3h, 4h, 1d, 1w, 1mo, 1y).',
        INVALID_RANGE: '❌ Invalid range. Please select a valid time range (4h, 12h, 24h, 1d, 7d, 30d).',
        INVALID_DAYS: '❌ Invalid number of days. Please select a number between 1 and 30.',
        INVALID_LIMIT: '❌ Invalid limit. Please provide a non-negative number.',
        INVALID_PAGE: '❌ Invalid page. Please provide a non-negative number.',
        INVALID_MINT_ADDRESS: '❌ Invalid mint address. Please provide a valid Solana mint address.',
        INVALID_ADDRESS: '❌ Invalid address. Please provide a valid Solana address.',
        TIME_RANGE_TOO_LARGE: '⚠️ Time range too large. Please select a shorter time range and try again.',
    },

    KNOWN_ACCOUNTS: {
        MENU: '👤 Discover Accounts Insights:',
        ASK_FILTER: `📊 <b>Known Accounts Filter</b>

Enter a filter or press Fetch All to see all known accounts:

Examples:
• <code>labels=DEFI,NFT</code> - Find accounts with these labels
• <code>name=Openbook</code> - Search by name
• <code>entity=Solana Foundation</code> - Filter by entity`,
        SEARCHING: '🔍 <b>Searching for accounts...</b>',
        NO_RESULTS: '🔍 <b>No accounts found matching your criteria</b>',
        RESULTS_HEADER: '📊 <b>Known Solana Accounts</b>\n\n',
    },

    TOKEN_BALANCES: {
        ASK_ADDRESS: `💰 <b>Token Balances</b>

Enter a Solana account address to view its token balances:

Example:
• <code>D5DabCKBxypZDGS4H8HJtTkdXSKtYiM6N3HiYNYa8U9t</code>`,
        SEARCHING: '🔍 <b>Fetching token balances...</b>',
        NO_RESULTS: '🔍 <b>No token balances found for this address</b>',
        RESULTS_HEADER: '💰 <b>Token Balances</b>\n\n',
    },

    TOKEN_BALANCES_TS: {
        ASK_ADDRESS: `📈 <b>Token Balances Time Series</b>

Enter a Solana account address to view its token balances time series:

Example:
• <code>D5DabCKBxypZDGS4H8HJtTkdXSKtYiM6N3HiYNYa8U9t</code>`,
        ASK_DAYS: `⏰ <b>Time Period</b>

Select the number of previous days to include (1 to 30, default is 14):

Options: 1 Day, 7 Days, 14 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching token balances time series...</b>',
        NO_RESULTS: '🔍 <b>No token balances time series found for this address</b>',
        RESULTS_HEADER: '📈 <b>Token Balances Time Series</b>\n\n',
    },

    WALLET_PNL: {
        ASK_ADDRESS: `📊 <b>Wallet PnL Analysis</b>

Enter a Solana account address to view its trading performance and PnL:

Example:
• <code>D5DabCKBxypZDGS4H8HJtTkdXSKtYiM6N3HiYNYa8U9t</code>`,
        ASK_RESOLUTION: `⏰ <b>Time Period</b>

Select the time period for PnL analysis:

Options: 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching wallet PnL data...</b>',
        NO_RESULTS: '🔍 <b>No PnL data found for this address</b>',
        RESULTS_HEADER: '📊 <b>Wallet PnL Analysis</b>\n\n',
    },

    NFT_OWNERS: {
        MENU: '🎨 Dive into NFTs features:',
        ASK_ADDRESS: `🎨 <b>NFT Collection Owners</b>

Enter an NFT collection address to view its owners:

Example:
• <code>J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w</code>`,
        SEARCHING: '🔍 <b>Fetching NFT collection owners...</b>',
        NO_RESULTS: '🔍 <b>No owners found for this collection</b>',
        RESULTS_HEADER: '🎨 <b>NFT Collection Owners</b>\n\n',
    },

    PRICES: {
        MENU: '💲 Discover Prices Insights:',
        PYTH_ACCOUNTS: {
            ASK_FILTER: `📈 <b>Pyth Accounts</b>

Enter a filter to search for Pyth oracle price accounts or press Fetch All to see all accounts:

Examples:
• <code>productId=6bQMDtuAmRgjvymdWk9w4tTc9YyuXcjMxF8MyPHXejsx</code>
• <code>priceFeedId=FNNvb1AFDnDVPkocEri8mWbJ1952HQZtFLuwPiUjSJQ</code>
• <code>symbol=Crypto.APT/USD</code>`,
            SEARCHING: '🔍 <b>Fetching Pyth accounts...</b>',
            NO_RESULTS: '🔍 <b>No Pyth accounts found matching your criteria</b>',
            RESULTS_HEADER: '📈 <b>Pyth Oracle Price Accounts</b>\n\n',
        },
        PYTH_PRICE: {
            ASK_PRICE_FEED_ID: `💸 <b>Pyth Price</b>

Enter a Pyth price feed ID to view its price data:

Example:
• <code>JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB</code>`,
            SEARCHING: '🔍 <b>Fetching Pyth price data...</b>',
            NO_RESULTS: '🔍 <b>No price data found for this price feed ID</b>',
            RESULTS_HEADER: '💸 <b>Pyth Price Data</b>\n\n',
        },
        PYTH_PRICE_TS: {
            ASK_PRICE_FEED_ID: `📈 <b>Pyth Price Time Series</b>

Enter a Pyth price feed ID to view its historical price data:

Example:
• <code>JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB</code>`,
            ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
            ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
            ASK_RESOLUTION: `⏰ <b>Resolution</b>

Select the time resolution for price data:

Options: Hourly, Daily, Weekly, Monthly, Yearly`,
            SEARCHING: '🔍 <b>Fetching Pyth price time series data...</b>',
            NO_RESULTS: '🔍 <b>No price time series data found for this price feed ID and criteria</b>',
            RESULTS_HEADER: '📈 <b>Pyth Price Time Series Data</b>\n\n',
        },
        PYTH_PRICE_OHLC: {
            ASK_PRICE_FEED_ID: `📊 <b>Pyth Price OHLC</b>

Enter a Pyth price feed ID to view its OHLC data:

Example:
• <code>JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB</code>`,
            ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
            ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
            ASK_RESOLUTION: `⏰ <b>Resolution</b>

Select the time resolution for OHLC data:

Options: Hourly, Daily, Weekly, Monthly, Yearly`,
            SEARCHING: '🔍 <b>Fetching Pyth OHLC data...</b>',
            NO_RESULTS: '🔍 <b>No OHLC data found for this price feed ID and criteria</b>',
            RESULTS_HEADER: '📊 <b>Pyth Price OHLC Data</b>\n\n',
        },
        PYTH_PRODUCT: {
            ASK_PRODUCT_ID: `📋 <b>Pyth Product</b>

Enter a Pyth product ID to view its metadata:

Example:
• <code>6bQMDtuAmRgjvymdWk9w4tTc9YyuXcjMxF8MyPHXejsx</code>`,
            SEARCHING: '🔍 <b>Fetching Pyth product metadata...</b>',
            NO_RESULTS: '🔍 <b>No product metadata found for this product ID</b>',
            RESULTS_HEADER: '📋 <b>Pyth Product Metadata</b>\n\n',
        },
        DEX_AMM: {
            SEARCHING: '🔍 <b>Fetching DEX and AMM programs...</b>',
            NO_RESULTS: '🔍 <b>No DEX or AMM programs found</b>',
            RESULTS_HEADER: '🛠️ <b>DEX and AMM Programs</b>\n\n',
        },
        TOKEN_PRICE: {
            ASK_MINT_ADDRESS: `💰 <b>Token Price Explorer</b>

Enter a Solana mint address to view the token price and 24h change:

Example:
• <code>So11111111111111111111111111111111111111112</code>`,
            SEARCHING: '🔍 <b>Fetching token price...</b>',
            NO_RESULTS: '❌ <b>No price data found for the given mint address</b>',
            RESULTS_HEADER: '<b>Token Price Data</b>\n\n',
        },
    },

    MARKETS: {
        MENU: '📊 Discover Markets Insights:',
        ASK_PROGRAM_ID: `📊 <b>Markets</b>

Enter a Solana program ID to view its available markets:

Example:
• <code>Gswppe6ERWKpUTXvRPfXdzHhiCyJvLadVvXGfdpBqcE1</code>`,
        ASK_PAGE: `📄 <b>Page</b>

Enter the page number (0 or higher, default is 0):

Example:
• <code>0</code>`,
        ASK_LIMIT: `📏 <b>Limit</b>

Enter the maximum number of markets to retrieve (default is 10):

Example:
• <code>5</code>`,
        SEARCHING: '🔍 <b>Fetching markets...</b>',
        NO_RESULTS: '🔍 <b>No markets found for this program ID</b>',
        RESULTS_HEADER: '📊 <b>Available Markets</b>\n\n',
    },

    TOKENS: {
        MENU: '📊 Discover Tokens Insights:',
        ASK_FILTER: `📊 <b>Tokens Filter</b>

Enter a filter or press Fetch All to see all tracked tokens:

Examples:
• <code>sortByAsc=marketCap</code> - Sort by market cap ascending
• <code>sortByDesc=price</code> - Sort by price descending
• <code>limit=5,page=0</code> - Limit to 5 tokens, first page`,
        SEARCHING: '🔍 <b>Fetching tokens...</b>',
        NO_RESULTS: '❌ <b>No tokens found for the given criteria</b>',
        RESULTS_HEADER: '📊 <b>Tracked Solana Tokens</b>\n\n',
    },

    TOKEN_HOLDERS: {
        ASK_MINT_ADDRESS: `👥 <b>Top Token Holders</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its top holders:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        SEARCHING: '🔍 <b>Fetching top token holders...</b>',
        NO_RESULTS: '🔍 <b>No top token holders found for this mint address</b>',
        RESULTS_HEADER: '👥 <b>Top Token Holders</b>\n\n',
    },

    TOKEN_DETAILS: {
        ASK_MINT_ADDRESS: `📋 <b>Token Details</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its details:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        SEARCHING: '🔍 <b>Fetching token details...</b>',
        NO_RESULTS: '🔍 <b>No details found for this token</b>',
        RESULTS_HEADER: '📋 <b>Token Details</b>\n\n',
    },

    TOKEN_VOLUME: {
        ASK_MINT_ADDRESS: `📈 <b>Token Volume Time Series</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its volume trends:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
        ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
        ASK_INTERVAL: `⏰ <b>Interval</b>

Select the time interval for volume data:

Options: Hourly, Daily, Weekly`,
        SEARCHING: '🔍 <b>Fetching token volume data...</b>',
        NO_RESULTS: '🔍 <b>No volume data found for this token and time range</b>',
        RESULTS_HEADER: '📈 <b>Token Volume Time Series</b>\n\n',
        TIME_RANGE_TOO_LARGE: '⚠️ <b>Time range too large</b>\n\nPlease select a shorter time range and try again.',
    },

    TOKEN_HOLDERS_TS: {
        ASK_MINT_ADDRESS: `📊 <b>Token Holders Time Series</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its holders trends:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
        ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
        SEARCHING: '🔍 <b>Fetching token holders data...</b>',
        NO_RESULTS: '🔍 <b>No holders data found for this token and time range</b>',
        RESULTS_HEADER: '📊 <b>Token Holders Time Series</b>\n\n',
        TIME_RANGE_TOO_LARGE: '⚠️ <b>Time range too large</b>\n\nPlease select a shorter time range and try again.',
    },

    TOKEN_TRANSFERS: {
        ASK_MINT_ADDRESS: `💸 <b>Token Transfers</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its transfer transactions:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
        ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
        ASK_MIN_AMOUNT: `💵 <b>Minimum Amount</b>

Enter the minimum transfer amount (in smallest units, e.g., lamports for SOL) or skip:

Example:
• <code>1000000</code> (0.001 SOL for SOL token)`,
        ASK_MAX_AMOUNT: `💵 <b>Maximum Amount</b>

Enter the maximum transfer amount (in smallest units, e.g., lamports for SOL) or skip:

Example:
• <code>1000000000</code> (1 SOL for SOL token)`,
        SEARCHING: '🔍 <b>Fetching token transfers data...</b>',
        NO_RESULTS: '🔍 <b>No transfer transactions found for this token and criteria</b>',
        RESULTS_HEADER: '💸 <b>Token Transfer Transactions</b>\n\n',
        INVALID_AMOUNT_RANGE: '❌ Minimum amount cannot be greater than maximum amount. Please try again.',
    },

    TOKEN_TRADES: {
        ASK_MINT_ADDRESS: `📊 <b>Token Trades</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its trade transactions:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
        ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
        ASK_RESOLUTION: `⏰ <b>Resolution</b>

Select the time resolution for trade data:

Options: Hourly, Daily, Weekly, Monthly, Yearly`,
        SEARCHING: '🔍 <b>Fetching token trades data...</b>',
        NO_RESULTS: '🔍 <b>No trade transactions found for this token and criteria</b>',
        RESULTS_HEADER: '📊 <b>Token Trade Transactions</b>\n\n',
        TIME_RANGE_TOO_LARGE: '⚠️ <b>Time range too large</b>\n\nPlease select a shorter time range and try again.',
    },

    TOKEN_OHLCV: {
        ASK_MINT_ADDRESS: `📊 <b>Token OHLCV</b>

Enter a token mint address or name (e.g., SOL, USDC) to view its OHLCV data:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        ASK_START_TIME: `📅 <b>Start Time</b>

Enter the start time as a Unix timestamp (seconds):

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
        ASK_END_TIME: `📅 <b>End Time</b>

Enter the end time as a Unix timestamp (seconds):

Example:
• <code>1745625600</code> (2024-10-29 00:00:00 UTC)`,
        ASK_RESOLUTION: `⏰ <b>Resolution</b>

Select the time resolution for OHLCV data:

Options: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1mo`,
        SEARCHING: '🔍 <b>Fetching token OHLCV data...</b>',
        NO_RESULTS: '🔍 <b>No OHLCV data found for this mint address and criteria</b>',
        RESULTS_HEADER: '📊 <b>Token OHLCV Data</b>\n\n',
    },

    PROGRAMS: {
        MENU: '🛠️ Discover Programs Insights:',
        ASK_FILTER: `🛠️ <b>Programs Filter</b>

Enter a Solana program name (e.g., Serum, Raydium) or address to filter programs, or press Fetch All to see all programs:

Examples:
• <code>Serum</code> - Search by program name
• <code>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</code> - Search by program address
• <code>DEFI,NFT</code> - Filter by labels`,
        SEARCHING: '🔍 <b>Fetching programs...</b>',
        NO_RESULTS: '🔍 <b>No programs found matching your criteria</b>',
        RESULTS_HEADER: '🛠️ <b>Solana Programs</b>\n\n',
    },

    PROGRAM_TX_COUNT: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Transaction Count Time Series</b>

Enter a Solana program name (e.g., Serum, Raydium) or address to view its transaction count trends:

Example:
• <code>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</code>`,
        ASK_RANGE: `⏰ <b>Time Range</b>

Select the time range for transaction count data:

Options: 4 Hours, 12 Hours, 24 Hours, 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching transaction count data...</b>',
        NO_RESULTS: '🔍 <b>No transaction count data found for this program and range</b>',
        RESULTS_HEADER: '📈 <b>Program Transaction Count Time Series</b>\n\n',
    },

    PROGRAM_IX_COUNT: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Instruction Count Time Series</b>

Enter a Solana program name (e.g., Serum, Raydium) or address to view its instruction count trends:

Example:
• <code>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</code>`,
        ASK_RANGE: `⏰ <b>Time Range</b>

Select the time range for instruction count data:

Options: 4 Hours, 12 Hours, 24 Hours, 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching instruction count data...</b>',
        NO_RESULTS: '🔍 <b>No instruction count data found for this program and range</b>',
        RESULTS_HEADER: '📈 <b>Program Instruction Count Time Series</b>\n\n',
    },

    PROGRAM_ACTIVE_USERS_TS: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Active Users Time Series</b>

Enter a Solana program name (e.g., Serum, Raydium) or address to view its active users time series trends:

Example:
• <code>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</code>`,
        ASK_RANGE: `⏰ <b>Time Range</b>

Select the time range for active users time series data:

Options: 4 Hours, 12 Hours, 24 Hours, 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching active users time series data...</b>',
        NO_RESULTS: '🔍 <b>No active users time series data found for this program and range</b>',
        RESULTS_HEADER: '📈 <b>Program Active Users Time Series</b>\n\n',
    },

    PROGRAM_ACTIVE_USERS: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Active Users</b>

Enter a Solana program name (e.g., Serum, Raydium) or address to view its active users:

Example:
• <code>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</code>`,
        ASK_DAYS: `⏰ <b>Time Period</b>

Select the number of previous days to include (1 to 30, default is 14):

Options: 1 Day, 7 Days, 14 Days, 30 Days`,
        ASK_SORT: `🔍 <b>Sort Order</b>

Select how to sort the active users:

Options: By Transaction Count or Instruction Count, High to Low or Low to High`,
        SEARCHING: '🔍 <b>Fetching active users data...</b>',
        NO_RESULTS: '🔍 <b>No active users found for this program and period</b>',
        RESULTS_HEADER: '📈 <b>Program Active Users</b>\n\n',
    },

    PROGRAM_DETAILS: {
        ASK_PROGRAM_ADDRESS: `📋 <b>Program Details</b>

Enter a Solana program name (e.g., Serum, Raydium) or address to view its details:

Example:
• <code>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</code>`,
        SEARCHING: '🔍 <b>Fetching program details...</b>',
        NO_RESULTS: '🔍 <b>No details found for this program</b>',
        RESULTS_HEADER: '📋 <b>Program Details</b>\n\n',
    },

    PROGRAM_RANKING: {
        ASK_LIMIT: `🏆 <b>Program Rankings</b>

Enter the number of programs to display (e.g., 10) or select an option:

Example:
• <code>10</code>`,
        ASK_INTERVAL: `📅 <b>Ranking Interval</b>

Select the interval for the rankings:

Options: Daily (1d), Weekly (7d), Monthly (30d)`,
        ASK_DATE: `📆 <b>Date</b>

Enter the date as a Unix timestamp (e.g., 1744934400) or select Current Date:

Example:
• <code>1744934400</code> (2024-10-21 00:00:00 UTC)`,
        SEARCHING: '🔍 <b>Fetching program rankings...</b>',
        NO_RESULTS: '🔍 <b>No program rankings found</b>',
        RESULTS_HEADER: '🏆 <b>Top Program Rankings</b>\n\n',
    },

    CANCEL: '🚫 <b>Operation cancelled. What would you like to do next?</b>',

    ALERTS: {
        MENU: '🔔 Manage your token price alerts:',
        ASK_MINT_ADDRESS: `🔔 *Add Price Alert*

Enter a token mint address or name (e.g., SOL, USDC) to set a price alert:

Example:
• \`So11111111111111111111111111111111111111112\` (SOL)`,
        ASK_PRICE: `💲 *Target Price*

Enter the target price for the alert (in USD):

Example:
• \`147.50\``,
        SEARCHING: '🔍 <b>Fetching your alerts...</b>',
        NO_ALERTS: '📭 You have no token price alerts set up.',
        RESULTS_HEADER: '🔔 <b>Your Token Price Alerts</b>\n\n',
        ALERT_CREATED: `✅ *Price Alert Created!*

*Token:* \${token}
*Target Price:* $\${price}
*Status:* 🟢 Active

You will be notified when the token price reaches your target.`,
        ALERT_UPDATED: `✅ *Price Alert Updated!*

*Token:* \${token}
*New Target Price:* $\${price}
*Status:* \${status}`,
        ALERT_DELETED: '🗑️ Alert deleted successfully.',
        ALERT_TOGGLED: '✅ Alert ${status} successfully.',
        MAX_ALERTS_REACHED: '❌ You have reached the maximum limit of 10 active alerts. Please delete some alerts before creating new ones.',
        DUPLICATE_ALERT: '❌ You already have an active alert for this token at a similar price point.',
        INVALID_PRICE: '❌ Please enter a valid price between 0 and 1,000,000,000 USD (e.g., 147.50).',
    },
};
