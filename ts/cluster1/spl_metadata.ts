import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import wallet from "../wba-wallet.json";
import {
  createMetadataAccountV3,
  updateMetadataAccountV2,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import bs58 from "bs58";

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const umi = createUmi("https://api.devnet.solana.com");
// convert first wallet secretkey to base58
const arraySecretKey = bs58.decode(wallet.secretKey as string);
const keypair = Keypair.fromSecretKey(new Uint8Array(arraySecretKey));

const keypairEddsa = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array(arraySecretKey)
);
const keypairEddsaSigner = createSignerFromKeypair(umi, keypairEddsa);
umi.use(signerIdentity(keypairEddsaSigner));

// Define our Mint address
const mint = new PublicKey("Gw5KHwmczcrjrffkAVhMwzq9JcsmiKDRB7hocH5kmhNP");

// Add the Token Metadata Program
const token_metadata_program_id = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Create PDA for token metadata
const metadata_seeds = [
  Buffer.from("metadata"),
  token_metadata_program_id.toBuffer(),
  mint.toBuffer(),
];
const [metadata_pda, _bump] = PublicKey.findProgramAddressSync(
  metadata_seeds,
  token_metadata_program_id
);

(async () => {
  try {
    const tx = createMetadataAccountV3(umi, {
      metadata: publicKey(metadata_pda.toString()),
      mint: publicKey(mint.toString()),
      mintAuthority: keypairEddsaSigner,
      payer: keypairEddsaSigner,
      data: {
        name: "My NFT",
        symbol: "NFT",
        uri: "https://arweave.net/1234",
        sellerFeeBasisPoints: 100,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    });

    const txid = await tx.sendAndConfirm(umi);
    console.log(`Your metadata txid: ${txid.signature}`);

    // const updateMetadata = await updateMetadataAccountV2(umi, {
    //   metadata: publicKey(metadata_pda.toString()),
    //   updateAuthority: keypairEddsaSigner,
    //   data: {
    //     name: "Test update",
    //     symbol: "NFT",
    //     uri: "test.com",
    //     sellerFeeBasisPoints: 100,
    //     creators: null,
    //     collection: null,
    //     uses: null,
    //   },
    //   primarySaleHappened: false,
    //   isMutable: true,
    // });

    // const txId = await updateMetadata.sendAndConfirm(umi);
    // console.log(`Your update metadata txid: ${txId.signature}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
