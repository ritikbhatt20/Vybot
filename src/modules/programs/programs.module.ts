import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsUpdate } from './programs.update';
import { ProgramsScene } from './programs.scene';
import { ProgramTxCountScene } from './program-tx-count.scene';
import { ProgramIxCountScene } from './program-ix-count.scene';
import { ProgramActiveUsersTsScene } from './program-active-users-ts.scene';
import { ProgramActiveUsersScene } from './program-active-users.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [
        ProgramsService,
        ProgramsUpdate,
        ProgramsScene,
        ProgramTxCountScene,
        ProgramIxCountScene,
        ProgramActiveUsersTsScene,
        ProgramActiveUsersScene,
    ],
    exports: [ProgramsService],
})
export class ProgramsModule { }
