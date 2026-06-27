/**
 * Toastのメッセージ種別
 * readonly Proxy
 */
const $ToastType = new Proxy({
    Error: 'error',
    Warn: 'warn',
    Info: 'info'
  }, {
  get(target, prop, receiver) {
    if (prop in target) {
      return target[prop];
    }
    return undefined;
  },
  set(target, prop, value, receiver) {
    
  }
});

/**
 * 画面右上部にメッセージを表示する
 */
class ToastUI {
  #id;
  #template;
  #timeout;

  /**
   * 
   * @param {*} id 
   * @param {*} templateId 
   * @param {*} timeout 
   */
  constructor(id, templateId, timeout = 5000) {
    this.#id = id;
    this.#template = document.getElementById(templateId);
    this.#timeout = timeout;
  }

  /**
   * メッセージ表示処理の実体
   * @param {*} type メッセージ種別
   * @param {*} message 詳細メッセージ
   * @param {*} summary 概要メッセージ
   * @returns 
   */
  #show = (type, message, summary) => {
    console.group('type is ', type, message, summary);

    // messageもsummaryも未指定の場合はなにもしない
    if (!(!!(message) || !!(summary))) {
      console.error('# toast : message or summary is required.');
      return;
    }

    // template複製
    const $toast = this.#template.content.children[0]?.cloneNode(true);
    const $summary = $toast.querySelector('.toast-summary');
    const $message = $toast.querySelector('.toast-message');
    $toast.dataset.type = type; //  $ToastType : error, warn, info

    // message未指定時はDOMから削除  TODO: textContentが空文字の場合はmessageが見えないようHTML + CSSで調整したい
    if (message) {
      $message.textContent = message;
      console.log('> message is defined. : ', message);
    } else {
      $message.remove();
      console.log('> message is not defined.');
    }

    // summary未指定時はDOMから削除  TODO: textContentが空文字の場合はsummaryが見えないようHTML + CSSで調整したい
    if (summary) {
      $summary.textContent = summary;
      console.log('> summary is defined. : ', summary);
    } else {
      $summary.remove();
      console.log('> summary is not defined.');
    }

    document.getElementById(this.#id).append($toast);
    // show時のアニメーション
    setTimeout(() => {
      $toast.classList.add('ui-appear');
    }, 10);

    // remove時のアニメーション
    setTimeout(() => {
      $toast.classList.add('ui-vanish');
    }, this.#timeout);

    // DOMから削除
    setTimeout(() => {
      $toast.remove();
    }, this.#timeout + 500);

    console.groupEnd();
  };

  /**
   * errorメッセージ表示
   * @param {*} message 詳細メッセージ
   * @param {*} summary 概要メッセージ
   */
  error(message, summary) {
    this.#show($ToastType.Error, message, summary);
  }

  /**
   * warnメッセージ表示
   * @param {*} message 詳細メッセージ
   * @param {*} summary 概要メッセージ
   */
  warn(message, summary) {
    this.#show($ToastType.Warn, message, summary);
  }
  
  /**
   * infoメッセージ表示
   * @param {*} message 詳細メッセージ
   * @param {*} summary 概要メッセージ
   */
  info(message, summary) {
    this.#show($ToastType.Info, message, summary);
  }
}

/**
 * toast UI処理オブジェクトを生成する
 * @param {*} id toast表示エリアのid
 * @param {*} templateId toastひな形templateのid
 * @param {*} timeout toastが表示後、消えるまでの時間 (ms)
 * @returns 
 */
export function createToast(id, templateId, timeout = 5000) {
  return new ToastUI(id, templateId, timeout);
}