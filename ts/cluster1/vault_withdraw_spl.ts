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
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { WbaVault, IDL } from "../programs/wba_vault";
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

const token_decimals = 6;

// Mint address
const mint = new PublicKey("Gw5KHwmczcrjrffkAVhMwzq9JcsmiKDRB7hocH5kmhNP");

// Execute our enrollment transaction
(async () => {
  try {
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
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const vaultAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      vaultAuth,
      true
    );

    console.log(`Vault ata is: ${ownerAta.address.toBase58()}`);
    const signature = await program.methods
      .withdrawSpl(new BN(500000))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState,
        vaultAuth: vaultAuth,
        systemProgram: SystemProgram.programId,
        ownerAta: ownerAta.address,
        vaultAta: vaultAta.address,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
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
