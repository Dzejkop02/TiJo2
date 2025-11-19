import { UserRecord } from '../../records/user.record';

declare global {
    namespace Express {
        interface Request {
            user?: UserRecord;
            tokenId?: string;
        }
    }
}
