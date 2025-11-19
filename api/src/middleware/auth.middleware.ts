import { Request, Response, NextFunction } from 'express';
import { deleteJwtCookie, createToken } from '../utils/tokens';
import { UnauthorizedError } from "../utils/errors";
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { TokenRecord } from '../records/token.record';

const JWT_SECRET = process.env.JWT_SECRET || '';

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.['jwt'];
        if (!token) {
            throw new UnauthorizedError('Brak tokenu autoryzacji.');
        }

        let decoded: { id: string };

        try {
            decoded = verify(token, JWT_SECRET) as { id: string };
        } catch (e) {
            if (e instanceof TokenExpiredError) {
                throw new UnauthorizedError('Token wygasł.');
            }
            throw new UnauthorizedError('Nieprawidłowy token.');
        }

        const refreshTokenId = decoded.id;

        const user = await TokenRecord.findUserByTokenId(refreshTokenId);

        if (!user) {
            deleteJwtCookie(res);
            throw new UnauthorizedError('Sesja wygasła lub została zakończona.');
        }

        const newToken = createToken(refreshTokenId);
        res.cookie('jwt', newToken.accessToken, {
            secure: false,
            domain: 'localhost',
            httpOnly: true,
            maxAge: newToken.expiresIn * 1000,
        });

        req.user = user;
        req.tokenId = refreshTokenId;

        next();
    } catch (error) {
        deleteJwtCookie(res);
        next(error);
    }
}
