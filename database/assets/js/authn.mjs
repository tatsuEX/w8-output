import { hash } from "./textUtils.mjs";

// ===== 定数 =====
const SALT = 'saWEW3sawsafAW==Safw3_sa+2SDF';
const PRIVATE_CONSTRUCTOR_KEY = Symbol();

/**
 * public ログインコンテキスト
 */
export class LoginContext {
  #loginUser = null;
  #users;

  constructor() {
    // localStorageにログイン情報が存在する場合はログイン済みにする
    this.#loginUser = localStorage?.sso?.loginUser || null;
    this.#users = localStorage.users || [];
  }

  get isLogin() {
    return this.#loginUser !== null;
  }

  /**
   * Sign in : ユーザ検証
   * @param {*} email 
   * @param {*} password 
   */
  async signin(email, password) {
    console.log('### LoginContext signin ###');
    if (!!!(this.#loginUser)) {
      return;
    }
    this.#loginUser = null;

    const [user, ...otherUsers] = this.#users.filter((u) => u.email === email);
    console.log(user);
    
    if (!!!(user)) {
      throw new Error(`ユーザ ${email} は登録されていません。\n先に Sign up してください。`, 'ユーザ未登録');
    }

    user.verify(password);

    this.#loginUser = user;
    localStorage.sso = {
      loginUser: user
    };
    this.#users.push(user);
  }

  signup(loginUser) {

  }

  /**
   * ログインユーザ名
   * @readonly
   * @type {*}
   */
  get username() {
    return this.#loginUser?.username || guest.username;
  }

}

/**
 * private ユーザ情報
 */
class User {
  #username;
  #email;
  #password;

  constructor(username = 'ゲスト', email = 'guest@sample.com', password = '', symbol) {
    if (symbol !== PRIVATE_CONSTRUCTOR_KEY) {
      return new Error('static createからのみインスタンス化可能にしたいです');
    }
    this.#username = username;
    this.#email = email;
    this.#password = password;
  }

  get username() {
    return this.#username;
  }

  get email() {
    return this.#email;
  }

  static async create(username = 'ゲスト', email = 'guest@sample.com', password = '') {
    const password_hash = await hash(password + SALT);

    return new User(username, email, password_hash, PRIVATE_CONSTRUCTOR_KEY);
  }

  /**
   * 
   * @param {*} password 
   * @returns 
   */
  verify(password) {
    if (this.#password === password) {
      return;
    }
    throw new Error('signin is failed');
  }
}


const guest = await User.create();

/**
 * ログインコンテキスト
 */
export const loginContext = new LoginContext();
