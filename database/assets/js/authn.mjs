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
  
  /**
   ユーザ名
   * @type {string}
   */
  #username;
  
  /**
   * Eメール
   * @type {string}
   */
  #email;
  
  /**
   * パスワード (ハッシュ)
   * @type {string}
   */
  #password;
  
  /**
   * SSOが有効
   * @type {boolean}
   */
  #enableSso;

  /**
   * (private) static createを使用してください
   * @param {string} username ユーザ名
   * @param {string} email Eメール
   * @param {string} password_hash パスワードハッシュ
   * @param {boolean} enableSso SSO設定が有効
   * @param {Symbol} symbol 
   * @returns 
   * @see this.create
   */
  constructor(username = 'ゲスト', email = 'guest@sample.com', password_hash = '', enableSso, symbol) {
    if (symbol !== PRIVATE_CONSTRUCTOR_KEY) {
      return new Error('static createからのみインスタンス化可能にしたいです');
    }
    this.#username = username;
    this.#email = email;
    this.#password = password_hash;
    this.#enableSso = enableSso;
  }

  
  /**
   * ユーザ名
   * @readonly
   */
  get username() {
    return this.#username;
  }

  
  /**
   * Eメール
   * @readonly
   */
  get email() {
    return this.#email;
  }

  
  /**
   * SSO設定が有効
   * @readonly
   */
  get isSsoEnabled() {
    return this.#enableSso;
  }

  /**
   * privateフィールドはスプレッド構文などで公開されないため、publicなオブジェクトを複製する
   * @returns 
   */
  publish() {
    return {
      username: this.username,
      email: this.email,
      password_hash: this.#password,
      sso_enabled: this.isSsoEnabled
    }
  }

  /**
   * ユーザ情報を作成
   * passwordは、本メソッド内でハッシュ化されます
   * @param {string} username ユーザ名
   * @param {string} email Eメール
   * @param {string} password rawパスワード
   * @returns 
   */
  static async create(username = 'ゲスト', email = 'guest@sample.com', password = '', enableSso) {
    const password_hash = await hash(password + SALT);

    // NOTE: passwordはハッシュ化してから保存する。が、constructorを非同期にできないのでstatic factoryメソッドを必ず使用すること
    return new User(username, email, password_hash, enableSso, PRIVATE_CONSTRUCTOR_KEY);
  }

  /**
   * JSONまたはobjectからUserインスタンスを復元する
   * @param {string | object} userInfo ユーザ情報
   * @returns Userインスタンス
   */
  static restore(userInfo) {
    console.log(userInfo);
    if (userInfo == null) {
      return null;
    }
    let _userInfo = null;
    if (typeof userInfo === 'string') {
      _userInfo = localStorage.loginUser != null ? JSON.parse(localStorage.loginUser) : null;
      if (_userInfo == null) {
        return null;
      }
    } else if (Object.prototype.toString.call(userInfo).slice(1, -8) === 'object') {
      const { username, email, password_hash, sso_enabled } = userInfo;
      _userInfo = { username, email, password_hash, sso_enabled };
    }
    const user = new User(_userInfo?.username, _userInfo?.email, _userInfo?.password_hash, _userInfo?.sso_enabled || false, PRIVATE_CONSTRUCTOR_KEY);
    return user;
  }

  /**
   * パスワード検証
   * @param {string} password_hash ハッシュ化されたパスワード
   * @returns 
   */
  verify(password_hash) {
    if (this.#password === password_hash) {
      return;
    }
    throw new Error('サインインに失敗しました');
  }

  /**
   * ユーザインスタンスの一致判定
   * @param {User} other 
   * @returns 
   */
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
  
  /**
   * Description placeholder
   *
   * @type {User}
   */
  #loginUser = null;
  #userCache = null;
  #users;

  /**
   * LocalStorageのユーザ情報を更新する
   * @param {User} user 
   */
  #updateUser = (user) => {
    this.#loginUser = user;
    // privateメンバが展開されないため、公開用オブジェクトを複製する
    localStorage.loginUser = JSON.stringify(user.publish());
    if (!this.#users.some(u => u.equals(user))) {
      this.#users.push(user);
    }
    // privateメンバが展開されないため、公開用オブジェクトを複製する
    localStorage.users = JSON.stringify(this.#users.map(u => u.publish()));
  };

  /**
   * 
   */
  constructor() {
    console.log('>> LoginContext constructor');
    // localStorageにログイン情報が存在する場合はログイン済みにする
    this.#loginUser = this.#userCache = User.restore(localStorage?.loginUser);
    const users = localStorage.users != null ? JSON.parse(localStorage.users) : [];
    this.#users = users.map(u => User.restore(u));
  }

  /**
   * Sign in : ユーザ検証
   * @param {string} email 
   * @param {string} password rawパスワード
   */
  async signin(email, password) {
    console.log('### LoginContext signin ###');
    this.#loginUser = this.#userCache;

    const [user, ...otherUsers_should_be_empty] = this.#users?.filter((u) => u.email === email);
    
    // assertion
    if ((otherUsers_should_be_empty || []).length > 0) {
      throw new Error('Eメールの重複が発生しています');
    }

    try {
      if (!!!(user)) {
        throw new Error(`ユーザ ${email} は登録されていません。\n先に Sign up してください。`, 'ユーザ未登録');
      }
  
      const password_hash = await hash(password + SALT);
      user.verify(password_hash);
  
      this.#updateUser(user);
    } catch(err) {
      this.#loginUser = null;
      throw err;
    }

    return user;
  }

  /**
   * ユーザ登録
   * @param {string} username 
   * @param {string} email 
   * @param {string} password rawパスワード
   * @param {boolean} enableSso SSOが有効
   */
  async signup(username, email, password, enableSso = false) {
    const user = await User.create(username, email, password, enableSso);

    this.#updateUser(user);
  }

  signout(callback, ...args) {
    this.#loginUser = null;

    new Promise((res, rej) => {
      res(callback(args));
    })
    .then((a) => {
      location.href = 'signin.html#ssoDisabled';
    });

  }

  
  /**
   * ログイン済み判定
   * @readonly
   * @type {boolean}
   */
  get isLogin() {
    return this.#loginUser != null;
  }

  
  /**
   * SSO有効判定
   * @readonly
   */
  get isSsoEnabled() {
    return this.#loginUser.isSsoEnabled;
  }

  /**
   * ログインユーザ名
   * @readonly
   */
  get username() {
    return this.#loginUser?.username || guest.username;
  }

  
  /**
   * Eメール
   * @readonly
   */
  get email() {
    return this.#loginUser?.email || guest.email;
  }

}

// - private object
// ==========================================================================================   -

const guest = await User.create();

// + public object
// ==========================================================================================   +
