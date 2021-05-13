require("./fix_bsv_in_scrypt");
const { existsSync, readFileSync } = require("fs");
const { compile, bsv, Sha256 } = require("scryptlib");
const path = require("path");
const BN = bsv.crypto.BN;

const inputIndex = 0;
const DataLen = 1;
const DataLen4 = 4;
const DataLen8 = 8;
const out = path.join(__dirname, "deployments/fixture/autoGen");
const contractScryptPath = path.join(__dirname, "../../../contracts");
const contractJsonPath = path.join(
  __dirname,
  "../../../deployments/fixture/autoGen"
);

class ScriptHelper {
  static prepare(signers) {
    this.signers = signers;
  }
  /**
   * reverse hexStr byte order
   * @param {Sha256} hexStr
   */
  static reverseEndian(hexStr) {
    let num = new BN(hexStr, "hex");
    let buf = num.toBuffer();
    return buf.toString("hex").match(/.{2}/g).reverse().join("");
  }

  static compileContract(fileName, isDebug) {
    const filePath = path.join(this.contractScryptPath, fileName);
    const out = this.contractJsonPath;

    const result = compile(
      { path: filePath },
      {
        desc: true,
        debug: isDebug ? true : false,
        sourceMap: isDebug ? true : false,
        outputDir: out,
      }
    );

    if (result.errors.length > 0) {
      console.log(`Compile contract ${filePath} fail: `, result.errors);
      throw result.errors;
    }

    return result;
  }

  static loadDesc(fileName) {
    const filePath = path.join(this.contractJsonPath, `${fileName}`);
    if (!existsSync(filePath)) {
      throw new Error(
        `Description file ${filePath} not exist!\nIf You already run 'npm run watch', maybe fix the compile error first!`
      );
    }
    return JSON.parse(readFileSync(filePath).toString());
  }

  static getDataPart(hex, outputIndex) {
    let _res = new bsv.Transaction(hex);
    return this.getDataPartFromScript(_res.outputs[outputIndex].script);
  }

  static getDataPartFromScript(script) {
    let chunks = script.chunks;
    let opreturnIdx = -1;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].opcodenum == 106) {
        opreturnIdx = i;
        break;
      }
    }

    if (opreturnIdx == -1) return "";
    let parts = chunks.splice(opreturnIdx, chunks.length);
    let genesisPart = parts[1];
    let dataPart = parts[2];
    if (!dataPart) return "";
    return dataPart.len.toString(16) + dataPart.buf.toString("hex");
  }

  /**
   *
   * 9 8字节的金额1字节的脚本长度，安全点可以设为2字节
   * 148是P2PKH是输入脚本的大小
   */
  static getDustThreshold(lockingScriptSize) {
    return 3 * Math.ceil((250 * (lockingScriptSize + 9 + 148)) / 1000);
  }
}

ScriptHelper.contractJsonPath = contractJsonPath;
ScriptHelper.contractScryptPath = contractScryptPath;

module.exports = {
  inputIndex,
  DataLen,
  DataLen4,
  DataLen8,
  ScriptHelper,
};
