import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  BN,
} from "@coral-xyz/anchor";
import { WbaVault, IDL } from "../programs/wba_vault";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import wallet from "../wba-wallet.json";
import bs58 from "bs58";

// convert first wallet secretkey to base58
const arraySecretKey = bs58.decode(wallet.secretKey as string);
const keypair = Keypair.fromSecretKey(new Uint8Array(arraySecretKey));

// Commitment
const commitment: Commitment = "finalized";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const program = new Program<WbaVault>(
  IDL,
  "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address,
  provider
);

// Create a random keypair
const vaultState = new PublicKey(
  "F4UUiFsmysjsDwtKiduDuo2kXwjGaEZFbAnQvTc94iA2"
);

const vaultAuth_seeds = [Buffer.from("auth"), vaultState.toBuffer()];
const [vaultAuth, _bump] = PublicKey.findProgramAddressSync(
  vaultAuth_seeds,
  program.programId
);

const vaultAuthKey_seeds = [Buffer.from("vault"), vaultAuth.toBuffer()];
const [vaultAuthKey, _bumpKey] = PublicKey.findProgramAddressSync(
  vaultAuthKey_seeds,
  program.programId
);

// Mint address
const mint = new PublicKey("2anY1SPTdaMr6EvqHZt2t8nW52K5xxVWRbmTwFYhJdNx");

// Execute our deposit transaction
(async () => {
  try {
    const metadataProgram = new PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );
    const metadataAccount = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), metadataProgram.toBuffer(), mint.toBuffer()],
      metadataProgram
    )[0];
    const masterEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgram.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      metadataProgram
    )[0];

    // b"metadata", MetadataProgramID.key.as_ref(), mint.key.as_ref() "master"
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const ownerAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
      undefined,
      commitment
    );

    console.log(`Owner ata is: ${ownerAta.address.toBase58()}`);
    // // Get the token account of the fromWallet address, and if it does not exist, create it
    const vaultAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      vaultAuth,
      true
    );

    console.log(`Vault ata is: ${ownerAta.address.toBase58()}`);

    const signature = await program.methods
      .withdrawNft()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState,
        vaultAuth: vaultAuth,
        ownerAta: ownerAta.address,
        vaultAta: vaultAta.address,
        tokenMint: mint,
        nftMetadata: metadataAccount,
        nftMasterEdition: masterEdition,
        metadataProgram: metadataProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log(
      `Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
