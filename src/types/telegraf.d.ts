import { TokenVolumeWizardState, TokenHoldersWizardState, TokenTransfersWizardState, TokenTradesWizardState } from './index';

declare module 'telegraf/typings/scenes' {
    interface WizardContext {
        wizard: {
            state: TokenVolumeWizardState & TokenHoldersWizardState & TokenTransfersWizardState & TokenTradesWizardState;
        };
    }
}