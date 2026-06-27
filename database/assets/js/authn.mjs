import { hash } from "./textUtils.mjs";

// - private 定数
// ==========================================================================================   -

/** 塩化ナトリウム */
const SALT = 'saWEW3sawsafAW==Safw3_sa+2SDF';
/** 疑似的にconstructorをprivate的に使用するためのSymbol */
const PRIVATE_CONSTRUCTOR_KEY = Symbol();

// + public 定数
// ==========================================================================================   +


// - private class
// ==========================================================================================   -

/**
 * private ユーザ情報
 */
class User {
  #username;
  #email;
  #password;

  /**
   * (private) static createを使用してください
   * @param {*} username 
   * @param {*} email 
   * @param {*} password 
   * @param {*} symbol 
   * @returns 
   * @see this.create
   */
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

  /**
   * privateフィールドはスプレッド構文などで公開されないため、publicなオブジェクトを複製する
   * @returns 
   */
  publish() {
    return {
      username: this.username,
      email: this.email
    }
  }

  /**
   * ユーザ情報を作成
   * passwordは、本メソッド内でハッシュ化されます
   * @param {*} username ユーザ名
   * @param {*} email Eメール
   * @param {*} password パスワード
   * @returns 
   */
  static async create(username = 'ゲスト', email = 'guest@sample.com', password = '') {
    const password_hash = await hash(password + SALT);

    // NOTE: passwordはハッシュ化してから保存する。が、constructorを非同期にできないのでstatic factoryメソッドを必ず使用すること
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

  equals(other) {
    if (this == null || other == null) {
      return false;
    }
    return this.email === other.email;
  }
}

// + public class
// ==========================================================================================   +

/**
 * public ログインコンテキスト
 */
export class LoginContext {
  #loginUser = null;
  #users;

  #updateUser = (user) => {
    this.#loginUser = user;
    // privateメンバが展開されないため、公開用オブジェクトを複製する
    localStorage.sso = JSON.stringify({
      loginUser: user.publish()
    });
    if (!this.#users.some(u => u.equals(user))) {
      this.#users.push(user);
    }
    // privateメンバが展開されないため、公開用オブジェクトを複製する
    localStorage.users = JSON.stringify(this.#users.map(u => u.publish()));
  };

  constructor() {
    // localStorageにログイン情報が存在する場合はログイン済みにする
    const ssoUser = localStorage.sso != null ? JSON.parse(localStorage.sso) : null;
    this.#loginUser = ssoUser?.loginUser;
    const users = localStorage.users != null ? JSON.parse(localStorage.users) : [];
    this.#users = users;
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

    this.#updateUser(user);
  }

  async signup(username, email, password) {
    const user = await User.create(username, email, password);

    this.#updateUser(user);
  }
  
  get isLogin() {
    console.log(this.#users);
    // return false;
    return this.#loginUser != null;
  }

  /**
   * ログインユーザ名
   * @readonly
   * @type {*}
   */
  get username() {
    return this.#loginUser?.username || guest.username;
  }

  get email() {
    return this.#loginUser?.email || guest.email;
  }

}

// - private object
// ==========================================================================================   -

const guest = await User.create();

// + public object
// ==========================================================================================   +

/**
 * ログインコンテキスト
 */
export const loginContext = new LoginContext();
