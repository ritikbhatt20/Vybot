import { TokenVolumeWizardState, TokenHoldersWizardState, TokenTransfersWizardState } from './index';

declare module 'telegraf/typings/scenes' {
    interface WizardContext {
        wizard: {
            state: TokenVolumeWizardState & TokenHoldersWizardState & TokenTransfersWizardState;
        };
    }
}