import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "bn.js";

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vault as Program<Vault>;
  const provider = anchor.getProvider();
  const signer = Keypair.generate();

  const vault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), signer.publicKey.toBuffer()],
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

  it("Airdrop", async () => {
    await provider.connection
      .requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL * 10)
      .then(confirm)
      .then(log);
  });

  it("Deposit", async () => {
    const tx = await program.methods
      .deposit(new BN(1e9))
      .accounts({
        signer: signer.publicKey,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Withdraw", async () => {
    const tx = await program.methods
      .withdraw(new BN(1e9))
      .accounts({
        signer: signer.publicKey,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc()
      .then(confirm)
      .then(log);
  });
});
