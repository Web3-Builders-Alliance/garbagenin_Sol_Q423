use crate::state::Escrow;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, transfer, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    taker: Signer<'info>, // signer
    #[account(mut)]
    maker: SystemAccount<'info>,
    mint_a: Account<'info, Mint>, // mint a
    mint_b: Account<'info, Mint>, // mint b

    #[account(
    init_if_needed,
    payer = taker,
    associated_token::mint = mint_a,
    associated_token::authority = taker
  )]
    taker_ata_a: Account<'info, TokenAccount>, // this ata will receiving of mint_a

    #[account(
    mut,
    associated_token::mint = mint_b,
    associated_token::authority = taker
  )]
    taker_ata_b: Account<'info, TokenAccount>, // sending mint b to receive mint a

    #[account(
    init_if_needed,
    payer = taker,
    associated_token::mint = mint_b,
    associated_token::authority = maker
  )]
    maker_ata_b: Account<'info, TokenAccount>,

    #[account(
    mut,
    seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
    bump = escrow.bump,
    has_one = mint_a, // for security purpose
    has_one = mint_b, // for security purpose
    close = maker // only for PDAs
  )]
    escrow: Account<'info, Escrow>,

    #[account(
      mut,
      token::mint = mint_a,
      token::authority = escrow
    )]
    vault: Account<'info, TokenAccount>,

    associated_token_program: Program<'info, AssociatedToken>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

impl<'info> Take<'info> {
    // taker_ata_a transfer maker_ata_b to maker
    pub fn transfer(&mut self) -> Result<()> {
        let accounts = Transfer {
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let ctx = CpiContext::new(self.token_program.to_account_info(), accounts);

        transfer(ctx, self.escrow.receive)
    }

    // Withdraw from vault to the taker_ata_a
    pub fn withdraw(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            &signer_seeds,
        );

        transfer(ctx, self.escrow.receive)
    }

    // close the vault account
    pub fn close(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts,
            &signer_seeds,
        );

        close_account(ctx)
    }
}
