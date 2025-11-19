import { v4 as uuid } from 'uuid';
import { sign, verify, TokenExpiredError } from 'jsonwebtoken';
import { UserRecord } from '../records/user.record';
import { Response } from 'express';
import { TokenRecord } from '../records/token.record';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET nie jest zdefiniowany w .env');
}

export async function generateToken(user: UserRecord): Promise<string> {
    let token: TokenRecord;
    let tokenFound: TokenRecord | null;

    do {
        token = new TokenRecord({
            id: uuid(),
            user_id: user.id,
        });
        tokenFound = await TokenRecord.findById(token.id);
    } while (!!tokenFound);

    await token.save();
    return token.id;
}

export function createToken(id: string): { accessToken: string, expiresIn: number } {
    const payload = { id };
    const expiresIn = 60 * 60 * 24; // 24 godziny

    const accessToken = sign(payload, JWT_SECRET, { expiresIn });

    return { accessToken, expiresIn };
}

export function deleteJwtCookie(res: Response): void {
    res.clearCookie('jwt', {
        secure: false,
        domain: 'localhost',
        httpOnly: true,
    });
}
