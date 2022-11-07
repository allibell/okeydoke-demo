import { Log, User, UserManager } from "oidc-client-ts";

const clientRoot: string = "http://localhost:3000/";

export class AuthService {
  public userManager: UserManager;
  private settings = {
    authority: "https://dev-connect.trinsic.cloud",
    client_id: "verifier-oidc4vp-client",
    redirect_uri: `${clientRoot}redirect`,
    silent_redirect_uri: `${clientRoot}silent-renew`,
    post_logout_redirect_uri: `${clientRoot}`,
    response_type: "code",
    scope: "openid",
    extraQueryParams: {
      "trinsic:ecosystem": "hersh-test",
      "trinsic:schema": "https://dev-schema.trinsic.cloud/hersh-test/test-oidc",
    },
  };
  constructor() {
    this.userManager = new UserManager(this.settings);
    Log.setLogger(console);
  }

  public getUser(): Promise<User | null> {
    return this.userManager.getUser();
  }

  public login(): Promise<void> {
    return this.userManager.signinRedirect();
  }

  public renewToken(): Promise<User | null> {
    return this.userManager.signinSilent();
  }

  public logout(): Promise<void> {
    return this.userManager.signoutRedirect();
  }

  public async signinRedirect() {
    const user = await this.userManager.signinRedirectCallback();
    console.log("Logged in user", user);
  }
}
