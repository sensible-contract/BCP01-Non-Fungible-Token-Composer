# BCP01-Non-Fungible-Token-Composer

This project can help you to generate a BCP01-Non-Fungible-Token transaction template without signatures.

## Protocol

【ISSUE】

```
[code part](variable,end with OP_RETURN(0x6a))
[data part](all 79 bytes)
	[genesis part](all 41 bytes)
		prefix 				(1 bytes)	the data length coming：0x28=40
		pre_txid 			(32 bytes) 	previous txid
		output_index 		(4 bytes) 	previous tx outputIndex
		issue_output_index 	(4 bytes)	issue output index
	[payload for ISSUE](all 38 bytes)
		prefix 				(1 bytes)  	the data length coming：0x25=37
		issuer_pkh  		(20 bytes)  the PublicKeyHash of Issuer
		token_id 			(8 bytes) 	the index of NFT
		total_supply 		(8 bytes) 	the total supply of NFT
		data_type 			(1 bytes)  	data type,ISSUE=00,
```

【TRANSFER】

```
[code part](variable,end with OP_RETURN(0x6a))
[data part](all 111 bytes)
	[genesis part](all 41 bytes)
		prefix 				(1 bytes)	the data length coming：0x28=40
		pre_txid 			(32 bytes) 	previous txid
		output_index 		(4 bytes) 	previous tx outputIndex
		issue_output_index 	(4 bytes)	issue output index
	[payload for TRANSFER](all 62 bytes)
		prefix 				(1 bytes)  	the data length coming：0x3d=61
		token_pkh   		(20 bytes)  the owner's PublicKeyHash
		token_id 			(8 bytes) 		the index of NFT
		meta_txid 			(32 bytes)	the root txid of metaid, which show the stat of NFT
		data_type 			(1 bytes)  	data type,TRANSFER=01
```

## How to Build

```
npm install
npm gen-desc
```

## How to Run

To run the node , you at least need

- <a href="https://github.com/sensible-contract/satotx">satotx</a> support

Here is a example for config

```
src/config/signer.json
{
  "default": {
    "satotxApiPrefix": "https://api.satotx.com",
    "satotxPubKey": "25108ec89eb96b99314619eb5b124f11f00307a833cda48f5ab1865a04d4cfa567095ea4dd47cdf5c7568cd8efa77805197a67943fe965b0a558216011c374aa06a7527b20b0ce9471e399fa752e8c8b72a12527768a9fc7092f1a7057c1a1514b59df4d154df0d5994ff3b386a04d819474efbd99fb10681db58b1bd857f6d5"
  },
  "production": {
    "satotxApiPrefix": "https://api.satotx.com",
    "satotxPubKey": "25108ec89eb96b99314619eb5b124f11f00307a833cda48f5ab1865a04d4cfa567095ea4dd47cdf5c7568cd8efa77805197a67943fe965b0a558216011c374aa06a7527b20b0ce9471e399fa752e8c8b72a12527768a9fc7092f1a7057c1a1514b59df4d154df0d5994ff3b386a04d819474efbd99fb10681db58b1bd857f6d5"
  }
}
```

and then just run

```
node src/app.js
```

or run in production

```
node src/app.js env=production
```

## <span id="apimethod">Api Method</span>

- [genesis](#genesis)
- [issue](#issue)
- [transfer](#transfer)

### <span id="genesis">genesis</span>

- params

| param        | required | type   | note                                             |
| ------------ | -------- | ------ | ------------------------------------------------ |
| issuerPk     | true     | string | the PublicKey of the Issuer                      |
| totalSupply  | true     | string | the total supply of the NFT                      |
| opreturnData | false    | string |                                                  |
| utxos        | true     | array  | e.g. [{txId:'xxxx',outputIndex:0,satoshis:1000}] |
| utxoAddress  | true     | string | the Address of the utxos                         |
| feeb         | true     | number | sat/B. the fee rate for this transaction         |
| network      | false    | string | mainnet/testnet/regnet,default is mainnet        |

- req

```shell
curl -X POST -H "Content-Type: application/json" --data '{
  "issuerPk": "027f199aff75ffea9f6100877b09374f2ae6d0aff9566c98e63970f8688f879d4b",
  "totalSupply": "100",
  "opreturnData": "e624fd69683d27c48982e3e62e1e73b276e7b4c7763c514c00091cbcff19f700",
  "utxos": [
    {
      "txId": "24a7b46530f2b48e4136d5ee932d3ce34c212301a934236dad23dddceb40b35f",
      "satoshis": 9220473,
      "outputIndex": 1
    }
  ],
  "utxoAddress": "n1cVHJTB1TNcYmSt66mVzvcFAyxTjPdkGM",
  "feeb": 0.5,
  "network": "testnet"
}' http://127.0.0.1:8091/genesis
```

- rsp

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "raw": "xxxxxxxxxxxx",
    "outputs": [
      {
        "satoshis": 9220473,
        "script": "76a914dc6e764fb3504d8122d381036a969bd0c6c404b988ac"
      }
    ],
    "sigtype": 193
  }
}
```

### <span id="issue">issue</span>

- params

| param              | required | type   | note                                                 |
| ------------------ | -------- | ------ | ---------------------------------------------------- |
| genesisTxId        | true     | string | the txid of last token genesis/issue                 |
| genesisOutputIndex | true     | number | the outputIndex of last token genesis/issue          |
| preUtxoTxId        | true     | string | the previous txid of last token genesis/issue        |
| preUtxoOutputIndex | true     | number | the previous outputIndex of last token genesis/issue |
| preUtxoTxHex       | true     | string | the previous tx-hex-raw of last token genesis/issue  |
| spendByTxId        | true     | string | the previous txid of last token genesis/issue        |
| spendByOutputIndex | true     | number | the previous outputIndex of last token genesis/issue |
| spendByTxHex       | true     | string | the previous tx-hex-raw of last token genesis/issue  |
| issuerPk           | true     | string | the PublicKey of the Issuer                          |
| receiverAddress    | true     | string | the address of the receiver                          |
| metaTxId           | true     | string | the state of NFT                                     |
| opreturnData       | false    | string | allow to add an opreturn output                      |
| utxos              | true     | array  | e.g. [{txId:'xxxx',outputIndex:0,satoshis:1000}]     |
| utxoAddress        | true     | string | the address of the utxos                             |
| feeb               | true     | number | sat/B. the fee rate for this transaction             |
| network            | false    | string | mainnet/testnet/regnet,default is mainnet            |

- req

```shell
curl -X POST -H "Content-Type: application/json" --data '{
  "genesisTxId": "24a7b46530f2b48e4136d5ee932d3ce34c212301a934236dad23dddceb40b35f",
  "genesisOutputIndex": 1,
  "preUtxoTxId": "24a7b46530f2b48e4136d5ee932d3ce34c212301a934236dad23dddceb40b35f",
  "preUtxoOutputIndex": 1,
  "preUtxoTxHex": "xxxxxxxxxx",
  "spendByTxId": "5e6dee61b75bfcc575faae607e7e954b26ce651f9d25870fed31466b09789f7a",
  "spendByOutputIndex": 0,
  "spendByTxHex": "xxxxxxxxxxx",
  "issuerPk": "027f199aff75ffea9f6100877b09374f2ae6d0aff9566c98e63970f8688f879d4b",
  "receiverAddress": "n1cVHJTB1TNcYmSt66mVzvcFAyxTjPdkGM",
  "metaTxId": "5465e83661f189fe2ae2389a98bc9eca3170a39a1a2912d541b25b4f4660f475",
  "opreturnData": null,
  "utxos": [
    {
      "txId": "5e6dee61b75bfcc575faae607e7e954b26ce651f9d25870fed31466b09789f7a",
      "satoshis": 9215666,
      "outputIndex": 2
    }
  ],
  "utxoAddress": "n1cVHJTB1TNcYmSt66mVzvcFAyxTjPdkGM",
  "feeb": 0.5,
  "network": "testnet"
}' http://127.0.0.1:8091/issue
```

- rsp

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "raw": "xxxxxxxxxxxx",
    "outputs": [
      {
        "satoshis": 9215666,
        "script": "76a914dc6e764fb3504d8122d381036a969bd0c6c404b988ac"
      },
      {
        "satoshis": 2844,
        "script": "xxxxxxx"
      }
    ],
    "sigtype": 193
  }
}
```

### <span id="transfer">transfer</span>

- params

| param              | required | type   | note                                                 |
| ------------------ | -------- | ------ | ---------------------------------------------------- |
| genesisTxId        | true     | string | the txid of last token genesis/issue                 |
| genesisOutputIndex | true     | number | the outputIndex of last token genesis/issue          |
| preUtxoTxId        | true     | string | the previous txid of last token genesis/issue        |
| preUtxoOutputIndex | true     | number | the previous outputIndex of last token genesis/issue |
| preUtxoTxHex       | true     | string | the previous tx-hex-raw of last token genesis/issue  |
| spendByTxId        | true     | string | the previous txid of last token genesis/issue        |
| spendByOutputIndex | true     | number | the previous outputIndex of last token genesis/issue |
| spendByTxHex       | true     | string | the previous tx-hex-raw of last token genesis/issue  |
| senderPk           | true     | string | the PublicKey of the sender                          |
| receiverAddress    | true     | string | the address of the receiver                          |
| opreturnData       | false    | string | allow to add an opreturn output                      |
| utxos              | true     | array  | e.g. [{txId:'xxxx',outputIndex:0,satoshis:1000}]     |
| utxoAddress        | true     | string | the address of the utxos                             |
| feeb               | true     | number | sat/B. the fee rate for this transaction             |
| network            | false    | string | mainnet/testnet/regnet,default is mainnet            |

- req

```shell
curl -X POST -H "Content-Type: application/json" --data '{
  "genesisTxId": "24a7b46530f2b48e4136d5ee932d3ce34c212301a934236dad23dddceb40b35f",
  "genesisOutputIndex": 1,
  "preUtxoTxId": "5e6dee61b75bfcc575faae607e7e954b26ce651f9d25870fed31466b09789f7a",
  "preUtxoOutputIndex": 0,
  "preUtxoTxHex": "xxxxxxxx",
  "spendByTxId": "4efaf300aad4659f5e8357f8d34cf8a00eaeed9aa9326128885ce6993a331c53",
  "spendByOutputIndex": 1,
  "spendByTxHex": "xxxxxxxxx",
  "senderPk": "027f199aff75ffea9f6100877b09374f2ae6d0aff9566c98e63970f8688f879d4b",
  "receiverAddress": "n1cVHJTB1TNcYmSt66mVzvcFAyxTjPdkGM",
  "opreturnData": null,
  "utxos": [
    {
      "txId": "4efaf300aad4659f5e8357f8d34cf8a00eaeed9aa9326128885ce6993a331c53",
      "satoshis": 9206926,
      "outputIndex": 2
    }
  ],
  "utxoAddress": "n1cVHJTB1TNcYmSt66mVzvcFAyxTjPdkGM",
  "feeb": 0.5,
  "network": "testnet"
}' http://127.0.0.1:8091/transfer
```

- rsp

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "raw": "xxxxxxxxxx",
    "outputs": [
      {
        "satoshis": 9206926,
        "script": "76a914dc6e764fb3504d8122d381036a969bd0c6c404b988ac"
      },
      {
        "satoshis": 2862,
        "script": "xxxxxxx"
      }
    ],
    "sigtype": 193
  }
}
```
