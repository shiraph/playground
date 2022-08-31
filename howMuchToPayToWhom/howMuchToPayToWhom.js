/**
 * @classdesc 割り勘参加者たちを表現するモデル
 * @constructor
 */
class User {
  /**
   * constructor
   *
   * @param {string} name
   * @param {number} payedPrice
   */
  constructor(name, payedPrice) {
    this.name = name;
    this.payedPrice = payedPrice;
    this.actionDetail = "";
  }

  /**
   * 合計値と個人の支払い状況から算出した値で初期化する
   *
   * @param {number} avgPrice
   */
  initialize(avgPrice) {
    this.defaultPriceToPay = avgPrice - this.payedPrice;
    this.priceToPay = this.defaultPriceToPay > 0 ? this.defaultPriceToPay : 0;
    this.priceToReceive =
      this.defaultPriceToPay < 0 ? Math.abs(this.defaultPriceToPay) : 0;
    if (this.defaultPriceToPay > 0) this.action = ActionType.PAY;
    else if (this.defaultPriceToPay < 0) this.action = ActionType.RECEIVE;
    else this.action = ActionType.NO_ACTION;
  }
}

/**
 * 割り勘の授受種別
 */
const ActionType = {
  PAY: "支払う。",
  RECEIVE: "受け取る。",
  NO_ACTION: "支払い・受け取りはなし。",
};

/**
 * 割り勘の授受テキストを生成する
 *
 * @param {Array} names 担当者リスト
 * @param {Array} prices 未完了の支払額リスト
 * @param {String} targetName 担当者
 * @return {String}
 * @customfunction
 */
function howMuchToPayToWhom(names, prices, targetName) {
  // 二次元配列を一次元配列に変換
  let userNames = names.map((v) => v[0]);
  let payedPrices = prices.map((v) => v[0]);
  let avgPrice = sum(payedPrices) / payedPrices.length;

  // 支払額の少ない順に並び替える。
  let users = userNames
    .map((name, i) => {
      var user = new User(name, payedPrices[i]);
      user.initialize(avgPrice);
      return user;
    })
    .sort((a, b) => a.priceToPay - b.priceToPay);
  let targetUser = settle(users).find((user) => user.name == targetName);
  return targetUser.actionDetail + targetUser.action;
}

/**
 * 配列の合計値を取得する関数
 *
 * @param {Array[number]} array
 * @return {number}
 */
function sum(array) {
  return array.reduce((a, b) => a + b);
}

/**
 * 最も受取額が多いUserを取得する関数
 *
 * @param {Array[User]} users
 * @return {User}
 */
function getReceiver(users) {
  return users
    .filter((user) => user.priceToReceive > 0)
    .reduce((a, b) => (a.priceToReceive > b.priceToReceive ? a : b), 0);
}

/**
 * 決済を行う関数
 *
 * @param {Array[User]} users
 * @returns
 */
function settle(users) {
  let settledUsers = users;
  // 授受アクションのテキストを生成する。
  for (let user of settledUsers) {
    // 支払額が0円以下の場合はスキップ
    if (user.priceToPay <= 0) continue;

    // 支払残額が0円になるまで受取額が多い順に割り振っていく。
    while (user.priceToPay > 0) {
      let receiver = getReceiver(settledUsers);
      if (!receiver) return;

      let floatingPrice =
        user.priceToPay < receiver.priceToReceive
          ? user.priceToPay
          : receiver.priceToReceive;

      user.actionDetail += genText(
        receiver.name,
        floatingPrice,
        ActionType.PAY
      );
      receiver.actionDetail += genText(
        user.name,
        floatingPrice,
        ActionType.RECEIVE
      );
      user.priceToPay -= floatingPrice;
      receiver.priceToReceive -= floatingPrice;
    }
  }
  return settledUsers;
}

/**
 * 詳細情報生成
 *
 * @param {string} name
 * @param {number} price
 * @param {ActionType} actionType
 * @returns
 */
function genText(name, price, actionType) {
  return name + (actionType == ActionType.PAY ? "に" : "から") + price + "円、";
}
