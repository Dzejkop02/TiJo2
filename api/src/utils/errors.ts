import { Request, Response, NextFunction } from 'express';

export class ValidationError extends Error {}
export class UnauthorizedError extends Error {}
// class NotFoundError extends Error {}

export function handleError(err: Error, req: Request, res: Response, next: NextFunction): void {

    console.error(err);

    if (err instanceof UnauthorizedError) {
        res.status(401).json({
            ok: false,
            message: err.message,
        });
        return;
    }

    /*
    if (err instanceof NotFoundError) {
        res.status(404).json({
            ok: false,
            message: 'Element o podanym ID nie został znaleziony.',
        });
        return;
    }
    */

    res
        .status(err instanceof ValidationError ? 400 : 500)
        .json({
            ok: false,
            message: err instanceof ValidationError ? err.message : 'Wystąpił nieoczekiwany błąd.',
        });
}
