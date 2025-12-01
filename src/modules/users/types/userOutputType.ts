export type UserOutput = {
  id?: string;
  login: string;
  email: string;
  passwordHash?: string;
  createdAt: Date;
  emailConfirmation?: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };
};
