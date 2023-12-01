use anchor_lang::prelude::*;

declare_id!("8gnNshfwAdJ5CxT591neRLwdZ2yjmuMnJFwqFVNy2uqQ");

#[program]
pub mod vault {
    use anchor_lang::system_program::{transfer, Transfer};

    use super::*;

    pub fn deposit(ctx: Context<Vault>, lamports: u64) -> Result<()> {
        let accounts = Transfer {
            from: ctx.accounts.signer.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };

        let transfer_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), accounts);

        transfer(transfer_ctx, lamports)
    }

    pub fn withdraw(ctx: Context<Vault>, lamports: u64) -> Result<()> {
        let accounts = Transfer {
            to: ctx.accounts.vault.to_account_info(),
            from: ctx.accounts.signer.to_account_info(),
        };

        let binding = &[ctx.bumps.vault];
        let signer_seeds = [&[b"vault", ctx.accounts.signer.key.as_ref(), binding][..]];
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            accounts,
            &signer_seeds,
        );

        transfer(transfer_ctx, lamports)
    }
}

#[derive(Accounts)]
pub struct Vault<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut, seeds = [b"vault", signer.key.as_ref()], bump )]
    vault: SystemAccount<'info>,
    system_program: Program<'info, System>,
}
