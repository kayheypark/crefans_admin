import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

interface AuthConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  accessKeyId: string;
  secretAccessKey: string;
}

class CognitoAuth {
  private client: CognitoIdentityProviderClient;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async signIn(username: string, password: string) {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.config.userPoolId,
        ClientId: this.config.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);
      return response.AuthenticationResult;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async getUser(accessToken: string) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: this.extractUsernameFromToken(accessToken),
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  private extractUsernameFromToken(token: string): string {
    // This is a simplified implementation
    // In a real-world scenario, you'd decode the JWT token properly
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || payload.sub;
  }
}

export { CognitoAuth, type AuthConfig };