/**
 * 割り勘の授受テキストを生成する
 *
 * @param {Array} members 担当者リスト
 * @param {Array} prices 未完了の支払額リスト
 * @param {String} target_member 担当者
 * @return {String}
 * @customfunction
 */
function howMuchToPayToWhom(members, prices, target_member) {
  // 二次元配列を一次元配列に変換
  members = members.map((v) => v[0]);
  prices = prices.map((v) => v[0]);

  // 1人あたり支払い額を算出
  var amount = sum(prices),
    count = prices.length,
    avg_price = amount / count;

  // 担当者別のオブジェクトを生成し配列化する。
  // 支払額の少ない順に並び替える。
  var objects = [];
  for (var i = 0; i < members.length; i++) {
    var object = {};

    object["name"] = members[i];
    object["price"] = prices[i];
    object["text"] = "";

    var default_price_to_pay = avg_price - prices[i];
    object["default_price_to_pay"] = default_price_to_pay;
    object["price_to_pay"] =
      default_price_to_pay > 0 ? default_price_to_pay : 0;

    var price_to_recive =
      default_price_to_pay < 0 ? Math.abs(default_price_to_pay) : 0;
    object["price_to_recive"] = price_to_recive;

    objects.push(object);
  }
  objects = objects.sort((a, b) => a.price_to_pay - b.price_to_pay);

  // 授受アクションのテキストを生成する。
  for (var object of objects) {
    // 支払額が0円以下の場合はスキップ。(受取アクションのテキストも同時に生成されるため)
    if (object.price_to_pay <= 0) {
      continue;
    }

    // 支払残額が0円になるまで受取額が多い順に割り振っていく。
    while (object.price_to_pay > 0) {
      var payer_text = "",
        receiver_text = "";
      var receiver_object = getReceiverObject(objects);
      if (object.price_to_pay < receiver_object.price_to_recive) {
        payer_text +=
          receiver_object.name + "に" + object.price_to_pay + "円、";
        receiver_text += object.name + "から" + object.price_to_pay + "円、";
        receiver_object.price_to_recive -= object.price_to_pay;
        object.price_to_pay = 0;
      } else {
        payer_text +=
          receiver_object.name +
          "に" +
          receiver_object.price_to_recive +
          "円、";
        receiver_text +=
          object.name + "から" + receiver_object.price_to_recive + "円、";
        object.price_to_pay -= receiver_object.price_to_recive;
        receiver_object.price_to_recive = 0;
      }
      object.text += payer_text;
      receiver_object.text += receiver_text;
    }
  }

  // 支払者・受取者・精算済(ちょうど支払った場合)別に動詞テキストを決定
  objects.forEach((object) => {
    if (object.default_price_to_pay > 0) object.text += "支払う。";
    else if (object.default_price_to_pay < 0) object.text += "受け取る。";
    else object.text = "支払い・受け取りはなし。";
  });

  // ターゲットとなる名前でオブジェクトを取り出し、授受アクションのテキストのみを返す。
  var target_object = objects.find((object) => object.name == target_member);
  return target_object.text;
}

/**
 * 配列の合計値を取得する関数
 *
 * @param {Array[Number]} array
 * @return {Number}
 */
function sum(array) {
  var amount = 0;
  array.forEach((v) => (amount += v));
  return amount;
}

/**
 * 最も受取残額が多い担当者を取得する関数
 *
 * @param {Array[Object]} objects
 * @return {Object}
 */
function getReceiverObject(objects) {
  var receiver_objects = objects
    .filter((obj) => obj.price_to_recive > 0)
    .sort((a, b) => b.price_to_recive - a.price_to_recive);
  if (receiver_objects.length == 0) return null;
  else return receiver_objects[0];
}
