import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  serviceAccounts: {
    google: {
      clientEmail: string;
      privateKey: string;
    };
  };
}

interface GoogleServiceAccountScheme {
  private_key: string;
  client_email: string;
}

const readGoogleServiceAccount = (): GoogleServiceAccountScheme => {
  const googleSaPath = path.join('.', 'secret', 'google_sa.json');

  if (fs.existsSync(googleSaPath)) {
    return JSON.parse(
      fs.readFileSync(path.join('.', 'secret', 'google_sa.json'), {
        encoding: 'utf-8'
      })
    ) as GoogleServiceAccountScheme;
  }

  return {
    /* eslint-disable-next-line @typescript-eslint/camelcase */
    client_email: '',
    /* eslint-disable-next-line @typescript-eslint/camelcase */
    private_key: ''
  };
};


export const createAppConfig = (): AppConfig => {
  const googleSA = readGoogleServiceAccount();
  return {
    serviceAccounts: {
      google: {
        clientEmail: googleSA.client_email,
        privateKey: googleSA.private_key
      }
    }
  };
};

export const appConfig = createAppConfig();
