export type UserDB = {
  id?: string;
  login: string;
  email: string;
  passwordHash: string;
  createdAt: Date;

  emailConfirmation: {
    confirmationCode: string | null;
    expirationDate: Date | null;
    isConfirmed: boolean;
  };

  passwordRecovery?: {
    recoveryCode: string | null;
    passRecoveryExpDate: Date | null;
    isUsed: boolean;
  };
};
