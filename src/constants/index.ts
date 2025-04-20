import { Commands } from 'src/enums/commands.enum';

type CommandDescriptions = {
    [key in Commands]: string;
};

export const commandDescriptions: CommandDescriptions = {
    [Commands.KnownAccounts]: '/knownaccounts - View labeled Solana accounts',
    [Commands.HELP]: '/help - Get help with using the bot',
    [Commands.MAIN_MENU]: '/main_menu - Go back to the main menu',
    [Commands.Cancel]: '/cancel - Cancel the current operation',
};