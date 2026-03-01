export class HttpException extends Error {
    public status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        // Maintenir la trace de la pile pour les erreurs personnalisées
        Error.captureStackTrace(this, this.constructor);
    }
}