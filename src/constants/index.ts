import { Commands } from '../enums/commands.enum';

export type CommandDescriptions = {
    [key in Commands]: string;
};

export const commandDescriptions: CommandDescriptions = {
    [Commands.KnownAccounts]: '/knownaccounts - 🏷️ View labeled Solana accounts',
    [Commands.TokenBalances]: '/tokenbalances - 💰 View token balances for a Solana account',
    [Commands.Tokens]: '/tokens - 📊 View a list of tracked Solana tokens',
    [Commands.TokenHolders]: '/tokenholders - 👥 View top token holders for a Solana token',
    [Commands.HELP]: '/help - 📚 Get help with using the bot',
    [Commands.MAIN_MENU]: '/main_menu - 🏠 Go back to the main menu',
    [Commands.Cancel]: '/cancel - 🚫 Cancel the current operation',
};

export const BOT_MESSAGES = {
    WELCOME: `👋 <b>Welcome to VybeBot</b>

🚀 Your real-time Solana analytics companion!

VybeBot helps you track and analyze Solana blockchain activity with powerful, user-friendly commands.

Use /knownaccounts to explore labeled accounts, /tokenbalances to check token balances, /tokens to view tracked tokens, /tokenholders to see top token holders, or type /help to see all available commands.`,

    HELP_HEADER: `📚<b> VybeBot Commands</b>\n\nHere are all the commands you can use:\n\n`,

    MAIN_MENU: `🏠 <b>VybeBot Main Menu</b>

What would you like to explore today?

Choose an option below or type a command:`,

    ERROR: {
        GENERIC: '❌ Something went wrong. Please try again later.',
        API_ERROR: '❌ Failed to fetch data from the API. Please try again later.',
        INVALID_FORMAT: '❌ Invalid format. Please provide a valid Solana address or filter.',
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

    CANCEL: '🚫 <b>Operation cancelled</b>',
};
