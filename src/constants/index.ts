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
    [Commands.Programs]: '/programs - 🛠️ View Solana programs with on-chain IDLs',
    [Commands.ProgramTxCount]: '/programtxcount - 📈 View transaction count time series for a Solana program',
    [Commands.ProgramIxCount]: '/programixcount - 📈 View instruction count time series for a Solana program',
    [Commands.ProgramActiveUsersTs]: '/programactiveusersts - 📈 View active users time series for a Solana program',
    [Commands.ProgramActiveUsers]: '/programactiveusers - 📈 View active users for a Solana program',
    [Commands.ProgramDetails]: '/programdetails - 📋 View details for a Solana program',
    [Commands.ProgramRanking]: '/programranking - 🏆 View top-ranked Solana programs',
    [Commands.HELP]: '/help - 📚 Get help with using the bot',
    [Commands.MAIN_MENU]: '/main_menu - 🏠 Go back to the main menu',
    [Commands.Cancel]: '/cancel - 🚫 Cancel the current operation',
};

export const BOT_MESSAGES = {
    WELCOME: `👋 <b>Welcome to VybeBot</b>

🚀 Your real-time Solana analytics companion!

VybeBot helps you track and analyze Solana blockchain activity with powerful, user-friendly commands.

Use /knownaccounts to explore labeled accounts, /tokenbalances to check token balances, /tokens to view tracked tokens, /tokenholders to see top token holders, /tokendetails to view token details, /tokenvolume to view token volume trends, /tokenholdersts to view token holders trends, /tokentransfers to view token transfers, /tokentrades to view token trades, /programs to view Solana programs, /programtxcount to view program transaction counts, /programixcount to view program instruction counts, /programactiveusersts to view program active users time series, /programactiveusers to view program active users, /programdetails to view program details, /programranking to view top-ranked programs, or type /help to see all available commands.`,

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
        INVALID_RANGE: '❌ Invalid range. Please select a valid time range (4h, 12h, 24h, 1d, 7d, 30d).',
        INVALID_DAYS: '❌ Invalid number of days. Please select a number between 1 and 30.',
        INVALID_LIMIT: '❌ Invalid limit. Please provide a non-negative number.',
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
• <code>4vPTz6bXmxsgJRUoetsdBaHTkU14khdKsmjs6rJRbLxj</code>`,
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

    PROGRAMS: {
        ASK_FILTER: `🛠️ <b>Programs Filter</b>

Enter label filters or press Fetch All to see all Solana programs with on-chain IDLs:

Examples:
• <code>DEFI,NFT</code> - Find programs with these labels
• <code>WALLET</code> - Filter by a single label`,
        SEARCHING: '🔍 <b>Fetching programs...</b>',
        NO_RESULTS: '🔍 <b>No programs found matching your criteria</b>',
        RESULTS_HEADER: '🛠️ <b>Solana Programs</b>\n\n',
    },

    PROGRAM_TX_COUNT: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Transaction Count Time Series</b>

Enter a program address to view its transaction count trends:

Example:
• <code>SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf</code>`,
        ASK_RANGE: `⏰ <b>Time Range</b>

Select the time range for transaction count data:

Options: 4 Hours, 12 Hours, 24 Hours, 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching transaction count data...</b>',
        NO_RESULTS: '🔍 <b>No transaction count data found for this program and range</b>',
        RESULTS_HEADER: '📈 <b>Program Transaction Count Time Series</b>\n\n',
    },

    PROGRAM_IX_COUNT: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Instruction Count Time Series</b>

Enter a program address to view its instruction count trends:

Example:
• <code>SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf</code>`,
        ASK_RANGE: `⏰ <b>Time Range</b>

Select the time range for instruction count data:

Options: 4 Hours, 12 Hours, 24 Hours, 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching instruction count data...</b>',
        NO_RESULTS: '🔍 <b>No instruction count data found for this program and range</b>',
        RESULTS_HEADER: '📈 <b>Program Instruction Count Time Series</b>\n\n',
    },

    PROGRAM_ACTIVE_USERS_TS: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Active Users Time Series</b>

Enter a program address to view its active users time series trends:

Example:
• <code>SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf</code>`,
        ASK_RANGE: `⏰ <b>Time Range</b>

Select the time range for active users time series data:

Options: 4 Hours, 12 Hours, 24 Hours, 1 Day, 7 Days, 30 Days`,
        SEARCHING: '🔍 <b>Fetching active users time series data...</b>',
        NO_RESULTS: '🔍 <b>No active users time series data found for this program and range</b>',
        RESULTS_HEADER: '📈 <b>Program Active Users Time Series</b>\n\n',
    },

    PROGRAM_ACTIVE_USERS: {
        ASK_PROGRAM_ADDRESS: `📈 <b>Program Active Users</b>

Enter a program address to view its active users:

Example:
• <code>SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf</code>`,
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

Enter a program address to view its details:

Example:
• <code>SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf</code>`,
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

    CANCEL: '🚫 <b>Operation cancelled</b>',
};
