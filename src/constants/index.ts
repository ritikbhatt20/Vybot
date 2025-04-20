import { Commands } from '../enums/commands.enum';

export type CommandDescriptions = {
    [key in Commands]: string;
};

export const commandDescriptions: CommandDescriptions = {
    [Commands.KnownAccounts]: '/knownaccounts - 🏷️ View labeled Solana accounts',
    [Commands.HELP]: '/help - 📚 Get help with using the bot',
    [Commands.MAIN_MENU]: '/main_menu - 🏠 Go back to the main menu',
    [Commands.Cancel]: '/cancel - 🚫 Cancel the current operation',
};

export const BOT_MESSAGES = {
    WELCOME: `
👋 *Welcome to VybeBot*

🚀 Your real-time Solana analytics companion!

VybeBot helps you track and analyze Solana blockchain activity with powerful, user-friendly commands.

Use /knownaccounts to explore labeled accounts or type /help to see all available commands.
`,
    HELP_HEADER: `*📚 VybeBot Commands*\n\nHere are all the commands you can use:\n\n`,
    MAIN_MENU: `
🏠 *VybeBot Main Menu*

What would you like to explore today?

Choose an option below or type a command:
`,
    ERROR: {
        GENERIC: '❌ Something went wrong. Please try again later.',
        API_ERROR: '❌ Failed to fetch data from the API. Please try again later.',
        INVALID_FORMAT: '❌ Invalid format. Please follow the example format.'
    },
    KNOWN_ACCOUNTS: {
        ASK_FILTER: `
📊 *Known Accounts Filter*

Enter a filter or press Fetch All to see all known accounts:

Examples:
• \`labels=DEFI,NFT\` - Find accounts with these labels
• \`name=Openbook\` - Search by name
• \`entity=Solana Foundation\` - Filter by entity
`,
        SEARCHING: '🔍 *Searching for accounts...*',
        NO_RESULTS: '🔍 No accounts found matching your criteria.',
        RESULTS_HEADER: '📊 *Known Solana Accounts*\n\n',
    },
    CANCEL: '🚫 *Operation cancelled*',
};
