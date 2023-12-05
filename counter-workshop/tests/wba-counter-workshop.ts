import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { WbaCounterWorkshop } from "../target/types/wba_counter_workshop";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import wallet from "../tests/wallet.json";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const signer = Keypair.fromSecretKey(new Uint8Array(wallet));
console.log(signer.publicKey.toString());

describe("wba-counter-workshop", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .WbaCounterWorkshop as Program<WbaCounterWorkshop>;
  const provider = anchor.getProvider();

  const counterPda = PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), signer.publicKey.toBuffer()],
    program.programId
  )[0];

  const confirm = async (signature: string): Promise<string> => {
    const block = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
    );
    return signature;
  };

  xit("Airdrop", async () => {
    await provider.connection
      .requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
  });

  xit("Initialize", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        signer: signer.publicKey,
        counter: counterPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("Increment", async () => {
    const tx = await program.methods
      .increment()
      .accounts({
        signer: signer.publicKey,
        counter: counterPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("Decrement", async () => {
    const tx = await program.methods
      .decrement()
      .accounts({
        signer: signer.publicKey,
        counter: counterPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("InitializeMint", async () => {
    //EDDY84KCLErFCJFxudK8t1C3jri7dMU25HM3yKJt1snY
    const mint = Keypair.generate();
    console.log(mint.publicKey.toString());
    const tx = await program.methods
      .initializeMint()
      .accounts({
        signer: signer.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        counter: counterPda,
      })
      .signers([signer, mint])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("CheckCounter", async () => {
    // Paste here the mint address for challenge1 token
    const mint = new PublicKey("EDDY84KCLErFCJFxudK8t1C3jri7dMU25HM3yKJt1snY");

    const ownerAta = getOrCreateAssociatedTokenAccount(
      provider.connection,
      signer,
      mint,
      signer.publicKey
    );

    const tx = await program.methods
      .checkCounter()
      .accounts({
        signer: signer.publicKey,
        counter: counterPda,
        mint: mint,
        tokenAcct: (await ownerAta).address,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
  });
});

// wallet address: FNtr4A5qeT4oRwJSufKM3ja4toKTY9tfajCjTGZp9mZR
// mint address: EDDY84KCLErFCJFxudK8t1C3jri7dMU25HM3yKJt1snY
// pda: GXspCrYZm9Pthodntffy79Tez6mpQqDv3tPEK8H3zMJv
