import { TokenVolumeWizardState, TokenHoldersWizardState, TokenTransfersWizardState, TokenTradesWizardState, ProgramsWizardState, ProgramTxCountWizardState, ProgramIxCountWizardState, ProgramActiveUsersTsWizardState, ProgramActiveUsersWizardState, ProgramDetailsWizardState } from './index';

declare module 'telegraf/typings/scenes' {
    interface WizardContext {
        wizard: {
            state: TokenVolumeWizardState & TokenHoldersWizardState & TokenTransfersWizardState & TokenTradesWizardState & ProgramsWizardState & ProgramTxCountWizardState & ProgramIxCountWizardState & ProgramActiveUsersTsWizardState & ProgramActiveUsersWizardState & ProgramDetailsWizardState;
        };
    }
}