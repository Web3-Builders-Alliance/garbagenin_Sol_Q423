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
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

    const image =
      "https://arweave.net/wHcc6_cU5JFaLxQQNuzLzrFWjANhHYCxH5hhyG3DWfg";
    const metadata = {
      name: "Garbage Rug",
      symbol: "GBR",
      description: "a rug made of garbage",
      image,
      attributes: [
        { trait_type: "Recycble", value: "True" },
        {
          trait_type: "Stain Resistant",
          value: "False",
        },
        {
          trait_type: "Size",
          value: "5x6",
        },
        {
          trait_type: "Rarity",
          value: "Common",
        },
      ],
      properties: {
        files: [
          {
            type: "image/png",
            uri: image,
          },
        ],
      },
      creators: [],
    };
    const myUri = await bundlrUploader.uploadJson(metadata);
    // Your image URI:  https://arweave.net/-96w9ExrejR-diRkNK5GsYJweCI63BRDiwh1vJzbbp8
    console.log("Your image URI: ", myUri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();
