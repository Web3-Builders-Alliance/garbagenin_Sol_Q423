import {
  Commitment,
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  Signer,
} from "@solana/web3.js";
import wallet from "./wallet/wba-wallet.json";
import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  publicKey,
  signerIdentity,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import {
  publicKey as publicKeySerializer,
  string,
} from "@metaplex-foundation/umi/serializers";
import { base58 } from "@metaplex-foundation/umi/serializers";

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

//Create a Umi instance
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signerKeypair = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signerKeypair));

const mint = publicKey("HLwrECFiSrTGJUGaxbEEe4f8AVi2TUWwE9wpLoaqUoM4");
const tokenMetadataProgramId = publicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const seeds = [
  string({ size: "variable" }).serialize("metadata"),
  publicKeySerializer().serialize(tokenMetadataProgramId),
  publicKeySerializer().serialize(mint),
];
const metadata_pda = umi.eddsa.findPda(tokenMetadataProgramId, seeds);

(async () => {
  let tx = createMetadataAccountV3(umi, {
    metadata: metadata_pda,
    mint: publicKey(mint),
    mintAuthority: signerKeypair,
    payer: signerKeypair,
    data: {
      name: "WBA Garbage Cheese",
      symbol: "WGC",
      uri: "",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = base58.deserialize(result.signature);
  console.log(
    `Succesfully Minted!. Transaction Here: https://solana.fm/tx/${signature[0]}?cluster=devnet`
  );
})();
