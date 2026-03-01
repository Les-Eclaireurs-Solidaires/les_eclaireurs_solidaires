export type Role = 'ORGANIZER' | 'VOLUNTEER' | 'SUPER_ADMIN';
export type DisplayMode = 'VOLUNTEER_MODE' | 'ORGANIZER_MODE' | 'ADMIN_MODE';

export class UserModel {
    constructor(
        public uuid: string = '',
        public email: string = '',
        public firstName: string = '',
        public lastName: string = '',
        public role: Role = 'VOLUNTEER',
        public token: string = '',
        ){}


}
