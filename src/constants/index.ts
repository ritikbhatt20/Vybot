import { Commands } from '../enums/commands.enum';

export type CommandDescriptions = {
    [key in Commands]: string;
};

export const commandDescriptions: CommandDescriptions = {
    [Commands.KnownAccounts]: '/knownaccounts - 🏷️ View labeled Solana accounts',
    [Commands.TokenBalances]: '/tokenbalances - 💰 View token balances for a Solana account',
    [Commands.Tokens]: '/tokens - 📊 View a list of tracked Solana tokens',
    [Commands.TokenHolders]: '/tokenholders - 👥 View top token holders for a Solana token',
    [Commands.TokenDetails]: '/tokendetails - 📋 View detailed information for a Solana token',
    [Commands.TokenVolume]: '/tokenvolume - 📈 View token volume time series for a Solana token',
    [Commands.TokenHoldersTs]: '/tokenholdersts - 📊 View token holders time series for a Solana token',
    [Commands.TokenTransfers]: '/tokentransfers - 💸 View token transfer transactions for a Solana token',
    [Commands.TokenTrades]: '/tokentrades - 📊 View token trade transactions for a Solana token',
    [Commands.HELP]: '/help - 📚 Get help with using the bot',
    [Commands.MAIN_MENU]: '/main_menu - 🏠 Go back to the main menu',
    [Commands.Cancel]: '/cancel - 🚫 Cancel the current operation',
};

export const BOT_MESSAGES = {
    WELCOME: `👋 <b>Welcome to VybeBot</b>

🚀 Your real-time Solana analytics companion!

VybeBot helps you track and analyze Solana blockchain activity with powerful, user-friendly commands.

Use /knownaccounts to explore labeled accounts, /tokenbalances to check token balances, /tokens to view tracked tokens, /tokenholders to see top token holders, /tokendetails to view token details, /tokenvolume to view token volume trends, /tokenholdersts to view token holders trends, /tokentransfers to view token transfers, /tokentrades to view token trades, or type /help to see all available commands.`,

    HELP_HEADER: `📚<b> VybeBot Commands</b>\n\nHere are all the commands you can use:\n\n`,

    MAIN_MENU: `🏠 <b>VybeBot Main Menu</b>

What would you like to explore today?

Choose an option below or type a command:`,

    ERROR: {
        GENERIC: '❌ Something went wrong. Please try again later.',
        API_ERROR: '❌ Failed to fetch data from the API. Please try again later.',
        INVALID_FORMAT: '❌ Invalid format. Please provide a valid Solana address or filter.',
        INVALID_TIMESTAMP: '❌ Invalid timestamp. Please provide a valid Unix timestamp.',
        INVALID_INTERVAL: '❌ Invalid interval. Please select Hourly, Daily, or Weekly.',
        INVALID_AMOUNT: '❌ Invalid amount. Please provide a valid number.',
        INVALID_RESOLUTION: '❌ Invalid resolution. Please select Hourly, Daily, Weekly, Monthly, or Yearly.',
    },

    KNOWN_ACCOUNTS: {
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

    TOKENS: {
        ASK_FILTER: `📊 <b>Tokens Filter</b>

Enter a filter or press Fetch All to see all tracked tokens:

Examples:
• <code>sortByAsc=marketCap</code> - Sort by market cap ascending
• <code>sortByDesc=price</code> - Sort by price descending
• <code>limit=5,page=0</code> - Limit to 5 tokens, first page`,
        SEARCHING: '🔍 <b>Fetching tokens...</b>',
        NO_RESULTS: '🔍 <b>No tokens found matching your criteria</b>',
        RESULTS_HEADER: '📊 <b>Tracked Solana Tokens</b>\n\n',
    },

    TOKEN_HOLDERS: {
        ASK_MINT_ADDRESS: `👥 <b>Top Token Holders</b>

Enter a token mint address to view its top holders:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        SEARCHING: '🔍 <b>Fetching top token holders...</b>',
        NO_RESULTS: '🔍 <b>No top token holders found for this mint address</b>',
        RESULTS_HEADER: '👥 <b>Top Token Holders</b>\n\n',
    },

    TOKEN_DETAILS: {
        ASK_MINT_ADDRESS: `📋 <b>Token Details</b>

Enter a token mint address to view its details:

Example:
• <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>`,
        SEARCHING: '🔍 <b>Fetching token details...</b>',
        NO_RESULTS: '🔍 <b>No details found for this token</b>',
        RESULTS_HEADER: '📋 <b>Token Details</b>\n\n',
    },

    TOKEN_VOLUME: {
        ASK_MINT_ADDRESS: `📈 <b>Token Volume Time Series</b>

Enter a token mint address to view its volume trends:

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

Enter a token mint address to view its holders trends:

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

Enter a token mint address to view its transfer transactions:

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

Enter a token mint address to view its trade transactions:

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

    CANCEL: '🚫 <b>Operation cancelled</b>',
};
