import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsUpdate } from './programs.update';
import { ProgramsScene } from './programs.scene';
import { ProgramTxCountScene } from './program-tx-count.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [ProgramsService, ProgramsUpdate, ProgramsScene, ProgramTxCountScene],
    exports: [ProgramsService],
})
export class ProgramsModule { }
