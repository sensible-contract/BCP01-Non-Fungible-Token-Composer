// @ts-nocheck
const {
  bsv,
  buildContractClass,
  Bytes,
  getPreimage,
  num2bin,
  PubKey,
  Ripemd160,
  Sha256,
  Sig,
  SigHashPreimage,
  signTx,
  toHex,
} = require("scryptlib");
const { PayloadNFT, ISSUE, TRANSFER } = require("./PayloadNFT");
const { DataLen4, ScriptHelper } = require("./ScriptHelper");
const Signature = bsv.crypto.Signature;
const sighashType =
  Signature.SIGHASH_ANYONECANPAY |
  Signature.SIGHASH_ALL |
  Signature.SIGHASH_FORKID;

class NFT {
  /**
   * @param {Boolean} pubkey
   * @constructor NFT合约 forge
   */
  constructor(pubkey) {
    // @ts-ignore
    const rabinPubKey = BigInt("0x" + pubkey);

    let nftContractDesc;
    const compileBeforeTest = false;
    if (compileBeforeTest) {
      /* 实时编译 */
      nftContractDesc = ScriptHelper.compileContract("nft.scrypt");
    } else {
      /* 预编译 */
      nftContractDesc = ScriptHelper.loadDesc("nft_desc.json");
    }
    const nftContractClass = buildContractClass(nftContractDesc);
    this.nft = new nftContractClass(rabinPubKey);
    this.nftCodePart = this.nft.codePart.toASM();
  }

  setTxGenesisPart({ prevTxId, outputIndex, issueOutputIndex = 0 }) {
    this.nftGenesisPart =
      ScriptHelper.reverseEndian(prevTxId) +
      num2bin(outputIndex, DataLen4) +
      num2bin(issueOutputIndex, DataLen4);
  }

  async makeTxGenesis({
    issuerPk,
    tokenId,
    totalSupply,
    opreturnData,

    utxos,
    utxoAddress,
    feeb,
  }) {
    let tx = new bsv.Transaction().from(
      utxos.map((utxo) => ({
        txId: utxo.txId,
        outputIndex: utxo.outputIndex,
        satoshis: utxo.satoshis,
        script: bsv.Script.buildPublicKeyHashOut(utxoAddress).toHex(),
      }))
    );

    let pl = new PayloadNFT({
      dataType: ISSUE,
      ownerPkh: issuerPk._getID(),
      totalSupply: totalSupply,
      tokenId: tokenId,
    });
    const lockingScript = bsv.Script.fromASM(
      [this.nftCodePart, this.nftGenesisPart, pl.dump()].join(" ")
    );

    tx.addOutput(
      new bsv.Transaction.Output({
        script: lockingScript,
        satoshis: ScriptHelper.getDustThreshold(
          lockingScript.toBuffer().length
        ),
      })
    );
    if (opreturnData) {
      tx.addOutput(
        new bsv.Transaction.Output({
          script: new bsv.Script.buildSafeDataOut(opreturnData),
          satoshis: 0,
        })
      );
    }

    tx.change(utxoAddress);
    tx.fee(
      Math.ceil((tx.serialize(true).length / 2 + utxos.length * 107) * feeb)
    );
    return tx;
  }

  async makeTxIssue({
    issuerTxId,
    issuerOutputIndex,
    issuerLockingScript,
    satotxData,

    issuerPk,
    receiverAddress,
    metaTxId,
    opreturnData,

    utxos,
    utxoAddress,
    feeb,
  }) {
    let tx = new bsv.Transaction().from(
      utxos.map((utxo) => ({
        txId: utxo.txId,
        outputIndex: utxo.outputIndex,
        satoshis: utxo.satoshis,
        script: bsv.Script.buildPublicKeyHashOut(utxoAddress).toHex(),
      }))
    );

    let pl = new PayloadNFT();
    pl.read(issuerLockingScript.toBuffer());

    pl.tokenId = pl.tokenId + 1n;

    let reachTotalSupply = pl.tokenId >= pl.totalSupply;
    const newLockingScript0 = bsv.Script.fromASM(
      [this.nftCodePart, this.nftGenesisPart, pl.dump()].join(" ")
    );

    pl.dataType = TRANSFER;
    pl.ownerPkh = receiverAddress.hashBuffer;
    pl.metaTxId = metaTxId;
    const newLockingScript1 = bsv.Script.fromASM(
      [this.nftCodePart, this.nftGenesisPart, pl.dump()].join(" ")
    );

    tx.addInput(
      new bsv.Transaction.Input({
        output: new bsv.Transaction.Output({
          script: issuerLockingScript,
          satoshis: ScriptHelper.getDustThreshold(
            issuerLockingScript.toBuffer().length
          ),
        }),
        prevTxId: issuerTxId,
        outputIndex: issuerOutputIndex,
        script: bsv.Script.empty(),
      })
    );
    if (!reachTotalSupply) {
      tx.addOutput(
        new bsv.Transaction.Output({
          script: newLockingScript0,
          satoshis: ScriptHelper.getDustThreshold(
            newLockingScript0.toBuffer().length
          ),
        })
      );
    }

    tx.addOutput(
      new bsv.Transaction.Output({
        script: newLockingScript1,
        satoshis: ScriptHelper.getDustThreshold(
          newLockingScript1.toBuffer().length
        ),
      })
    );

    if (opreturnData) {
      tx.addOutput(
        new bsv.Transaction.Output({
          script: new bsv.Script.buildSafeDataOut(opreturnData),
          satoshis: 0,
        })
      );
    }

    tx.change(utxoAddress);

    const curInputIndex = tx.inputs.length - 1;
    const curInputSatoshis = tx.inputs[curInputIndex].output.satoshis;
    const nftOutputSatoshis = tx.outputs[reachTotalSupply ? 0 : 1].satoshis;

    let sigInfo = await ScriptHelper.signers[0].satoTxSigUTXOSpendBy(
      satotxData
    );
    let script = new bsv.Script(sigInfo.script);
    let preDataPartHex = ScriptHelper.getDataPartFromScript(script);

    //let the fee to be exact in the second round
    for (let c = 0; c < 2; c++) {
      tx.fee(
        Math.ceil((tx.serialize(true).length / 2 + utxos.length * 107) * feeb)
      );
      const changeAmount = tx.outputs[tx.outputs.length - 1].satoshis;

      let sigBuf = Buffer.alloc(71, 0);
      // let sigBuf = signTx(
      //   tx,
      //   new bsv.PrivateKey(
      //     ""
      //   ),
      //   issuerLockingScript.toASM(),
      //   ScriptHelper.getDustThreshold(issuerLockingScript.toBuffer().length),
      //   curInputIndex,
      //   sighashType
      // );

      this.nft.txContext = {
        tx: tx,
        inputIndex: curInputIndex,
        inputSatoshis: curInputSatoshis,
      };

      const preimage = getPreimage(
        tx,
        issuerLockingScript.toASM(),
        curInputSatoshis,
        curInputIndex,
        sighashType
      );

      let unlockingContract = this.nft.issue(
        new SigHashPreimage(toHex(preimage)),
        BigInt("0x" + sigInfo.sigBE),
        new Bytes(sigInfo.payload),
        new Bytes(sigInfo.padding),
        new Bytes(preDataPartHex),
        new Bytes(
          opreturnData
            ? new bsv.Script.buildSafeDataOut(opreturnData).toHex()
            : ""
        ),
        new Sig(toHex(sigBuf)),
        new PubKey(toHex(issuerPk)),
        new Bytes(metaTxId),
        new Ripemd160(toHex(receiverAddress.hashBuffer)),
        nftOutputSatoshis,
        new Ripemd160(toHex(utxoAddress.hashBuffer)),
        changeAmount
      );

      // console.log(tx.serialize());
      // let ret = unlockingContract.verify();
      // if (ret.success == false) {
      //   console.error(ret);
      //   throw "end";
      // }
      // console.log("success");

      tx.inputs[curInputIndex].setScript(unlockingContract.toScript());
    }

    return tx;
  }

  async makeTxTransfer({
    transferTxId,
    transferOutputIndex,
    transferLockingScript,
    satotxData,

    senderPk,
    receiverAddress,
    opreturnData,

    utxos,
    utxoAddress,
    feeb,
  }) {
    let tx = new bsv.Transaction().from(
      utxos.map((utxo) => ({
        txId: utxo.txId,
        outputIndex: utxo.outputIndex,
        satoshis: utxo.satoshis,
        script: bsv.Script.buildPublicKeyHashOut(utxoAddress).toHex(),
      }))
    );

    let pl = new PayloadNFT();
    pl.read(transferLockingScript.toBuffer());

    this.nft.setDataPart(this.nftGenesisPart + " " + pl.dump());

    pl.ownerPkh = receiverAddress.hashBuffer;
    const newLockingScript0 = bsv.Script.fromASM(
      [this.nftCodePart, this.nftGenesisPart, pl.dump()].join(" ")
    );

    tx.addInput(
      new bsv.Transaction.Input({
        output: new bsv.Transaction.Output({
          script: transferLockingScript,
          satoshis: ScriptHelper.getDustThreshold(
            transferLockingScript.toBuffer().length
          ),
        }),
        prevTxId: transferTxId,
        outputIndex: transferOutputIndex,
        script: bsv.Script.empty(),
      })
    );

    tx.addOutput(
      new bsv.Transaction.Output({
        script: newLockingScript0,
        satoshis: ScriptHelper.getDustThreshold(
          newLockingScript0.toBuffer().length
        ),
      })
    );

    if (opreturnData) {
      tx.addOutput(
        new bsv.Transaction.Output({
          script: new bsv.Script.buildSafeDataOut(opreturnData),
          satoshis: 0,
        })
      );
    }

    tx.change(utxoAddress);

    const curInputIndex = tx.inputs.length - 1;
    const curInputSatoshis = tx.inputs[curInputIndex].output.satoshis;
    const nftOutputSatoshis = tx.outputs[0].satoshis;
    let sigBuf = Buffer.alloc(71, 0);
    let sigInfo = await ScriptHelper.signers[0].satoTxSigUTXOSpendBy(
      satotxData
    );
    let script = new bsv.Script(sigInfo.script);
    let preDataPartHex = ScriptHelper.getDataPartFromScript(script);

    for (let c = 0; c < 2; c++) {
      tx.fee(
        Math.ceil((tx.serialize(true).length / 2 + utxos.length * 107) * feeb)
      );
      const changeAmount = tx.outputs[tx.outputs.length - 1].satoshis;

      this.nft.txContext = {
        tx: tx,
        inputIndex: curInputIndex,
        inputSatoshis: curInputSatoshis,
      };

      const preimage = getPreimage(
        tx,
        transferLockingScript.toASM(),
        curInputSatoshis,
        curInputIndex,
        sighashType
      );

      let unlockingContract = this.nft.issue(
        new SigHashPreimage(toHex(preimage)),
        BigInt("0x" + sigInfo.sigBE),
        new Bytes(sigInfo.payload),
        new Bytes(sigInfo.padding),
        new Bytes(preDataPartHex),
        new Bytes(
          opreturnData
            ? new bsv.Script.buildSafeDataOut(opreturnData).toHex()
            : ""
        ),
        new Sig(sigBuf.toString("hex")),
        new PubKey(toHex(senderPk)),
        new Bytes(""),
        new Ripemd160(toHex(receiverAddress.hashBuffer)),
        nftOutputSatoshis,
        new Ripemd160(toHex(utxoAddress.hashBuffer)),
        changeAmount
      );

      tx.inputs[curInputIndex].setScript(unlockingContract.toScript());
    }

    return tx;
  }
}

module.exports = {
  NFT,
  sighashType,
};
