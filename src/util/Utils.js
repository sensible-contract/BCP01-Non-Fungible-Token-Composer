const readline = require("readline");
class Utils {
  static getErrorString(error) {
    if (!error) {
      return "";
    }
    if (typeof error == "object") {
      var str = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      return str;
    } else {
      return error.toString();
    }
  }

  static getRandom(min, max) {
    return min + Math.floor(Math.random() * (max - min));
  }

  static async sleep(time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time * 1000);
    });
  }

  static isNull(val) {
    if (typeof val == "undefined" || val == null || val == "undefined") {
      return true;
    } else {
      return false;
    }
  }

  static readSyncByRl(tips) {
    tips = tips || "> ";
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(tips, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}

module.exports = {
  Utils,
};
