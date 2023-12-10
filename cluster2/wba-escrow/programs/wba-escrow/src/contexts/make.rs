use crate::state::Escrow;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)]
    maker: Signer<'info>, // signer
    mint_a: Account<'info, Mint>, // mint a
    mint_b: Account<'info, Mint>, // mint b

    #[account(
    mut,
    associated_token::mint = mint_a,
    associated_token::authority = maker
  )]
    maker_ata_a: Account<'info, TokenAccount>,

    #[account(
    init,
    payer = maker,
    space = Escrow::INIT_SPACE,
    seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
    bump
  )]
    escrow: Account<'info, Escrow>,
    #[account(
      init,
      payer = maker,
      associated_token::mint = mint_a,
      associated_token::authority = escrow
    )]
    vault: Account<'info, TokenAccount>,
    associated_token_program: Program<'info, AssociatedToken>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

impl<'info> Make<'info> {
    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        let accounts = Transfer {
            from: self.maker_ata_a.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };

        let ctx = CpiContext::new(self.token_program.to_account_info(), accounts);

        transfer(ctx, deposit)
    }

    pub fn save(&mut self, seed: u64, receive: u64, bumps: &MakeBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seed,
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            receive,
            bump: bumps.escrow,
        });
        Ok(())
    }
}
