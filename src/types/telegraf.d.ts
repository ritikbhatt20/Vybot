import { TokenVolumeWizardState, TokenHoldersWizardState, TokenTransfersWizardState, TokenTradesWizardState, ProgramsWizardState } from './index';

declare module 'telegraf/typings/scenes' {
    interface WizardContext {
        wizard: {
            state: TokenVolumeWizardState & TokenHoldersWizardState & TokenTransfersWizardState & TokenTradesWizardState & ProgramsWizardState;
        };
    }
}