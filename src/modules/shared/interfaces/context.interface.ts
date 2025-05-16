import { Context as TelegrafContext } from 'telegraf';
import { Update, CallbackQuery, User } from 'telegraf/typings/core/types/typegram';
import { PatternType } from '../../patterns/entities/pattern-alert.entity';

interface PatternCallbackQuery extends CallbackQuery.DataQuery {
    data: string;
}

export interface Context extends TelegrafContext {
    session: {
        selectedToken?: string;
        selectedPatterns?: PatternType[];
        timeframe?: string;
    };
    scene: {
        enter: (sceneName: string) => Promise<void>;
        leave: () => Promise<void>;
    };
    callbackQuery: PatternCallbackQuery;
    from: User;
} 