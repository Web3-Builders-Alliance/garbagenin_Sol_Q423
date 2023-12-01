import wallet from "../wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createBundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import { readFile } from "fs/promises";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");
const bundlrUploader = createBundlrUploader(umi);

const arraySecretKey = bs58.decode(wallet.secretKey as string);
const keypair = Keypair.fromSecretKey(new Uint8Array(arraySecretKey));

const keypairEddsa = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(arraySecretKey)
);
const keypairEddsaSigner = createSignerFromKeypair(umi, keypairEddsa);
umi.use(signerIdentity(keypairEddsaSigner));

(async () => {
  try {
    const content = await readFile("../ts/cluster1/images/generug.png");
    const image = createGenericFile(content, "generug.png", {
      contentType: "image/png",
    });

    const [myUri] = await bundlrUploader.upload([image]);
    console.log("Your image URI: ", myUri);

    //Your image URI:  https://arweave.net/wHcc6_cU5JFaLxQQNuzLzrFWjANhHYCxH5hhyG3DWfg
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
