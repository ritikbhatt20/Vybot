import { TokenVolumeWizardState, TokenHoldersWizardState } from './index';

declare module 'telegraf/typings/scenes' {
    interface WizardContext {
        wizard: {
            state: TokenVolumeWizardState & TokenHoldersWizardState;
        };
    }
}