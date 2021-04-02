const { bsv } = require("scryptlib/dist");
const { app } = require("../app");
const { NetMgr } = require("../domain/NetMgr");
const { TokenTxHelper } = require("../lib/sensible_nft/TokenTxHelper");
exports.default = function () {
  NetMgr.listen("POST", "/genesis", async function (req, res, params, body) {
    const oracle = app.get("oracleConfig");
    let {
      issuerPk,
      totalSupply,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
      network,
    } = body;
    return await TokenTxHelper.genesis({
      satotxPubKey: oracle.satotxPubKey,

      issuerPk,
      totalSupply,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
      network,
    });
  });

  NetMgr.listen("POST", "/issue", async function (req, res, params, body) {
    let {
      genesisTxId,
      genesisOutputIndex,
      preUtxoTxId,
      preUtxoOutputIndex,
      preUtxoTxHex,
      spendByTxId,
      spendByOutputIndex,
      spendByTxHex,

      issuerPk,
      receiverAddress,
      metaTxId,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
      network,
    } = body;
    const oracle = app.get("oracleConfig");

    return await TokenTxHelper.issue({
      satotxPubKey: oracle.satotxPubKey,

      genesisTxId,
      genesisOutputIndex,
      preUtxoTxId,
      preUtxoOutputIndex,
      preUtxoTxHex,
      spendByTxId,
      spendByOutputIndex,
      spendByTxHex,

      issuerPk,
      receiverAddress,
      metaTxId,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
      network,
    });
  });

  NetMgr.listen("POST", "/transfer", async function (req, res, params, body) {
    const oracle = app.get("oracleConfig");
    let {
      genesisTxId,
      genesisOutputIndex,
      preUtxoTxId,
      preUtxoOutputIndex,
      preUtxoTxHex,
      spendByTxId,
      spendByOutputIndex,
      spendByTxHex,

      senderPk,
      receiverAddress,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
      network,
    } = body;
    return await TokenTxHelper.transfer({
      satotxPubKey: oracle.satotxPubKey,

      genesisTxId,
      genesisOutputIndex,
      preUtxoTxId,
      preUtxoOutputIndex,
      preUtxoTxHex,
      spendByTxId,
      spendByOutputIndex,
      spendByTxHex,

      senderPk,
      receiverAddress,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
      network,
    });
  });
};
