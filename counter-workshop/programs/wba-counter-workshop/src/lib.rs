use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
declare_id!("EkcUd9hBtGinnG1WqubKutxQwVY7NycmV9jchG1tdMCc");

#[program]
pub mod wba_counter_workshop {

    use anchor_spl::token::{mint_to, MintTo};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count = 0;
        ctx.accounts.counter.bump = ctx.bumps.counter;
        Ok(())
    }

    pub fn increment(ctx: Context<Count>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }

    pub fn decrement(ctx: Context<Count>) -> Result<()> {
        ctx.accounts.counter.count -= 1;
        Ok(())
    }

    pub fn initialize_mint(_ctx: Context<InitializeMint>) -> Result<()> {
        Ok(())
    }

    pub fn check_counter(ctx: Context<CheckCounter>) -> Result<()> {
        if ctx.accounts.counter.count == 5 {
            let accounts = MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_acct.to_account_info(),
                authority: ctx.accounts.counter.to_account_info(),
            };

            let binding = [ctx.bumps.counter];
            let signer_seeds = [&[
                b"counter",
                ctx.accounts.signer.clone().key.as_ref(),
                &binding,
            ][..]];

            let minto_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                accounts,
                &signer_seeds,
            );

            mint_to(minto_ctx, 500000);
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    #[account(init, payer=signer, space=Counter::INIT_SPACE, seeds=[b"counter", signer.key.as_ref()], bump)]
    counter: Account<'info, Counter>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Count<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds=[b"counter", signer.key.as_ref()],
        bump = counter.bump
    )]
    counter: Account<'info, Counter>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckCounter<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    #[account(mut, seeds=[b"counter", signer.key.as_ref()], bump)]
    counter: Account<'info, Counter>,
    #[account(mut)]
    mint: Account<'info, Mint>,

    #[account(mut)]
    token_acct: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = counter,
        mint::freeze_authority = counter,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut, seeds=[b"counter", signer.key.as_ref()], bump=counter.bump)]
    counter: Account<'info, Counter>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    ///CHECK: This is not dangerous because we don't read or write from this account
    pub rent: AccountInfo<'info>,
}

#[account]
pub struct Counter {
    count: u64,
    bump: u8,
}

impl Space for Counter {
    const INIT_SPACE: usize = 8 + 8 + 1;
}
