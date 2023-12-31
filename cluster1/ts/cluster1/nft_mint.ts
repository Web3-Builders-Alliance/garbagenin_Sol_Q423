import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
  updateMetadataAccountV2,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../wba-wallet.json";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { create } from "domain";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);
const arraySecretKey = bs58.decode(wallet.secretKey as string);
const keypair = Keypair.fromSecretKey(new Uint8Array(arraySecretKey));

const keypairEddsa = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(arraySecretKey)
);
const keypairEddsaSigner = createSignerFromKeypair(umi, keypairEddsa);
umi.use(signerIdentity(keypairEddsaSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);

(async () => {
  let tx = createNft(umi, {
    mint,
    uri: "https://arweave.net/-96w9ExrejR-diRkNK5GsYJweCI63BRDiwh1vJzbbp8",
    name: "Garbage Rug",
    symbol: "GBR",
    sellerFeeBasisPoints: percentAmount(1, 2),
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = bs58.encode(result.signature);

  console.log(
    `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  // Succesfully Minted! Check out your TX here:
  // https://explorer.solana.com/tx/4C6UofE9vAFaethXHUaBuAAmRmMADsjHuXfaSL3QLv9WwnYDKrGrFnwBjTB3qDwdWXfcKjQA8dVDBJUJC6ZjV7GG?cluster=devnet
  // Mint Address:  6ch897zA26iaqjkZGaeD32gQ69LNQzfAvTxtgCBuwLDo

  // Update Metadata
  // const updateMetadata = updateMetadataAccountV2(umi, {
  //     metadata: mint,
  //     updateAuthority: keypairEddsaSigner,
  //     data: {
  //       name: "Test update",
  //       symbol: "NFT",
  //       uri: "test.com",
  //       sellerFeeBasisPoints: 100,
  //       creators: null,
  //       collection: null,
  //       uses: null,
  //     },
  // });
  console.log("Mint Address: ", mint.publicKey);
})();
