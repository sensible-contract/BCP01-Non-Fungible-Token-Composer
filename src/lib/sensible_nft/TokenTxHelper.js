const { bsv } = require("scryptlib");
const { NFT, sighashType } = require("./NFT");

class TokenTxHelper {
  static getVinsOutputs(tx) {
    let outputs = [];
    for (let i = 0; i < tx.inputs.length; i++) {
      let output = tx.inputs[i].output;
      outputs.push({
        satoshis: output.satoshis,
        script: output.script.toHex(),
      });
    }
    return outputs;
  }

  static async genesis({
    satotxPubKey,

    issuerPk,
    totalSupply,
    opreturnData,

    utxos,
    utxoAddress,
    feeb,
    network = "mainnet",
  }) {
    utxoAddress = new bsv.Address(utxoAddress, network);
    issuerPk = new bsv.PublicKey(issuerPk);
    totalSupply = BigInt(totalSupply);

    const utxoTxId = utxos[0].txId;
    const utxoOutputIndex = utxos[0].outputIndex;

    const nft = new NFT(satotxPubKey);

    nft.setTxGenesisPart({
      prevTxId: utxoTxId,
      outputIndex: utxoOutputIndex,
    });
    let tx = await nft.makeTxGenesis({
      issuerPk,
      tokenId: 0n,
      totalSupply,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
    });

    return {
      raw: tx.serialize(),
      outputs: this.getVinsOutputs(tx),
      sigtype: sighashType,
    };
  }

  static async issue({
    satotxPubKey,

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
    network = "mainnet",
  }) {
    utxoAddress = new bsv.Address(utxoAddress, network);
    issuerPk = new bsv.PublicKey(issuerPk);
    receiverAddress = new bsv.Address(receiverAddress, network);

    const nft = new NFT(satotxPubKey);

    const preIssueTx = new bsv.Transaction(spendByTxHex);
    const issuerLockingScript = preIssueTx.outputs[spendByOutputIndex].script;

    nft.setTxGenesisPart({
      prevTxId: genesisTxId,
      outputIndex: genesisOutputIndex,
    });
    let tx = await nft.makeTxIssue({
      issuerTxId: spendByTxId,
      issuerOutputIndex: spendByOutputIndex,
      issuerLockingScript,
      satotxData: {
        index: preUtxoOutputIndex,
        txId: preUtxoTxId,
        txHex: preUtxoTxHex,
        byTxId: spendByTxId,
        byTxHex: spendByTxHex,
      },

      issuerPk,
      metaTxId,
      receiverAddress,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
    });

    return {
      raw: tx.serialize(),
      outputs: this.getVinsOutputs(tx),
      sigtype: sighashType,
    };
  }

  static async transfer({
    satotxPubKey,

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
    network = "mainnet",
  }) {
    utxoAddress = new bsv.Address(utxoAddress, network);
    senderPk = new bsv.PublicKey(senderPk);
    receiverAddress = new bsv.Address(receiverAddress, network);

    const nft = new NFT(satotxPubKey);

    nft.setTxGenesisPart({
      prevTxId: genesisTxId,
      outputIndex: genesisOutputIndex,
    });

    const spendByTx = new bsv.Transaction(spendByTxHex);
    const transferLockingScript = spendByTx.outputs[spendByOutputIndex].script;

    let tx = await nft.makeTxTransfer({
      transferTxId: spendByTxId,
      transferOutputIndex: spendByOutputIndex,
      transferLockingScript,
      satotxData: {
        index: preUtxoOutputIndex,
        txId: preUtxoTxId,
        txHex: preUtxoTxHex,
        byTxId: spendByTxId,
        byTxHex: spendByTxHex,
      },

      senderPk,
      receiverAddress,
      opreturnData,

      utxos,
      utxoAddress,
      feeb,
    });

    return {
      raw: tx.serialize(),
      outputs: this.getVinsOutputs(tx),
      sigtype: sighashType,
    };
  }
}

module.exports = {
  TokenTxHelper,
};
