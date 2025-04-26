import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsUpdate } from './programs.update';
import { ProgramsScene } from './programs.scene';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [SharedModule],
    providers: [ProgramsService, ProgramsUpdate, ProgramsScene],
    exports: [ProgramsService],
})
export class ProgramsModule { }