export enum Actions {
    KNOWN_ACCOUNTS = 'KNOWN_ACCOUNTS',
    HELP = 'HELP',
    CLOSE = 'CLOSE',
    CANCEL = 'CANCEL',
    MAIN_MENU = 'MAIN_MENU',
}

// Scene actions with consistent prefix to avoid conflicts
export enum SceneActions {
    FILTER_AGAIN = 'FILTER_AGAIN',
    CLOSE_BUTTON = 'CLOSE_BUTTON',
    CANCEL_BUTTON = 'CANCEL_BUTTON',
    FETCH_ALL = 'FETCH_ALL',
}