export enum Commands {
    KnownAccounts = 'knownaccounts',
    HELP = 'help',
    MAIN_MENU = 'main_menu',
    Cancel = 'cancel'
}

// Scene actions with consistent prefix to avoid conflicts
export enum SceneActions {
    FILTER_AGAIN = 'FILTER_AGAIN',
    CLOSE_BUTTON = 'CLOSE_BUTTON',
    CANCEL_BUTTON = 'CANCEL_BUTTON',
    FETCH_ALL = 'FETCH_ALL',
}