import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import { Program, Wallet, AnchorProvider, Address } from "@coral-xyz/anchor";
import { WbaVault, IDL } from "../programs/wba_vault";
import wallet from "../wba-wallet.json";
import bs58 from "bs58";

// D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o

// convert first wallet secretkey to base58
const arraySecretKey = bs58.decode(wallet.secretKey as string);
const keypair = Keypair.fromSecretKey(new Uint8Array(arraySecretKey));

// Commitment
const commitment: Commitment = "confirmed";

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
const vaultState = Keypair.generate();
console.log(`Vault public key: ${vaultState.publicKey.toBase58()}`);

// Create the PDA for our enrollment account
// Seeds are "auth", vaultState
// Create PDA for token metadata
const vaultAuth_seeds = [Buffer.from("auth"), vaultState.publicKey.toBuffer()];
const [vaultAuth, _bump] = PublicKey.findProgramAddressSync(
  vaultAuth_seeds,
  program.programId
);

const vaultAuthKey_seeds = [Buffer.from("vault"), vaultAuth.toBuffer()];
const [vaultAuthKey, _bumpKey] = PublicKey.findProgramAddressSync(
  vaultAuthKey_seeds,
  program.programId
);
// Execute our enrollment transaction
(async () => {
  try {
    const signature = await program.methods
      .initialize()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth: vaultAuth,
        vault: vaultAuthKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair, vaultState])
      .rpc();

    console.log(
      `Init success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
