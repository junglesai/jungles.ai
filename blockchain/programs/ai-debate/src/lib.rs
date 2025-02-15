use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_lang::system_program;

declare_id!("BWKfeKhge25YuAzDTb3waLC8Y8nVNAiPFvX9TUAo2V1r");

#[program]
mod ai_debate {
    use super::*;

    pub fn initialize_jungle(ctx: Context<InitializeJungle>) -> Result<()> {
        let jungle = &mut ctx.accounts.jungle;
        jungle.authority = ctx.accounts.authority.key();
        jungle.init_cost = 100_000_000;
        Ok(())
    }

    pub fn initialize_debate(ctx: Context<InitializeDebate>, agent_a: Pubkey, agent_b: Pubkey) -> Result<()> {
        require!(ctx.accounts.jungle.authority != Pubkey::default(), CustomError::JungleNotInitialized);

        invoke(
            &system_instruction::transfer(
                ctx.accounts.user.key,
                &ctx.accounts.jungle.authority,
                ctx.accounts.jungle.init_cost,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.jungle_authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let debate = &mut ctx.accounts.debate;
        debate.agent_a = agent_a;
        debate.agent_b = agent_b;
        debate.total_agent_a = 0;
        debate.total_agent_b = 0;
        debate.finalized = false;
        debate.winning_agent = None;
        debate.authority = ctx.accounts.user.key();
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, on_agent_a: bool) -> Result<()> {
        require!(!ctx.accounts.debate.finalized, CustomError::DebateAlreadyFinalized);

        invoke(
            &system_instruction::transfer(
                ctx.accounts.user.key,
                ctx.accounts.debate.to_account_info().key,
                amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.debate.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let debate = &mut ctx.accounts.debate;
        let user_bet = &mut ctx.accounts.user_bet;

        if on_agent_a {
            debate.total_agent_a += amount;
            user_bet.amount_on_a += amount;
        } else {
            debate.total_agent_b += amount;
            user_bet.amount_on_b += amount;
        }

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, on_agent_a: bool) -> Result<()> {
        let debate = &mut ctx.accounts.debate;
        let user_bet = &mut ctx.accounts.user_bet;

        if debate.finalized {
            let withdrawal_amount = match debate.winning_agent {
                Some(winner) if winner == debate.agent_a && on_agent_a => {
                    if user_bet.amount_on_a > 0 {
                        let total_pool = debate.total_agent_a + debate.total_agent_b;
                        (user_bet.amount_on_a * total_pool) / debate.total_agent_a
                    } else {
                        0
                    }
                },
                Some(winner) if winner == debate.agent_b && !on_agent_a => {
                    if user_bet.amount_on_b > 0 {
                        let total_pool = debate.total_agent_a + debate.total_agent_b;
                        (user_bet.amount_on_b * total_pool) / debate.total_agent_b
                    } else {
                        0
                    }
                },
                _ => 0,
            };
            require!(withdrawal_amount > 0, CustomError::NoWinningsToWithdraw);
            require!(amount <= withdrawal_amount, CustomError::InsufficientBalance);

            user_bet.amount_on_a = 0;
            user_bet.amount_on_b = 0;
        } else {
            let total_available = if on_agent_a {
                user_bet.amount_on_a
            } else {
                user_bet.amount_on_b
            };
            require!(amount <= total_available, CustomError::InsufficientBalance);

            if on_agent_a {
                user_bet.amount_on_a -= amount;
                debate.total_agent_a -= amount;
            } else {
                user_bet.amount_on_b -= amount;
                debate.total_agent_b -= amount;
            }
        }

        let fee = amount / 100;
        let user_amount = amount - fee;

        **ctx.accounts.debate.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += user_amount;

        // Get authority account info and send fee
        let authority_info = ctx.accounts.authority.to_account_info();
        **authority_info.try_borrow_mut_lamports()? += fee;

        Ok(())
    }

    pub fn finalize_debate(ctx: Context<FinalizeDebate>, winning_agent: Pubkey) -> Result<()> {
        let debate = &mut ctx.accounts.debate;

        require!(!debate.finalized, CustomError::DebateAlreadyFinalized);
        require!(
            winning_agent == debate.agent_a || winning_agent == debate.agent_b,
            CustomError::InvalidWinningAgent
        );
        require!(
            ctx.accounts.authority.key() == ctx.accounts.jungle.authority,
            CustomError::UnauthorizedAccess
        );

        debate.finalized = true;
        debate.winning_agent = Some(winning_agent);
        Ok(())
    }

    pub fn update_init_cost(ctx: Context<UpdateInitCost>, new_cost: u64) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.jungle.authority,
            CustomError::UnauthorizedAccess
        );
        
        let jungle = &mut ctx.accounts.jungle;
        jungle.init_cost = new_cost;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeJungle<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8,
        seeds = [b"jungle"],
        bump
    )]
    pub jungle: Account<'info, Jungle>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeDebate<'info> {
    #[account(init, payer = user, space = 8 + Debate::LEN)]
    pub debate: Account<'info, Debate>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is safe because we just transfer SOL to this account
    #[account(
        mut,
        constraint = jungle_authority.key() == jungle.authority @ CustomError::UnauthorizedAccess
    )]
    pub jungle_authority: AccountInfo<'info>,
    #[account(seeds = [b"jungle"], bump)]
    pub jungle: Account<'info, Jungle>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub debate: Account<'info, Debate>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserBet::LEN,
        seeds = [b"user_bet", debate.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub debate: Account<'info, Debate>,
    #[account(
        mut,
        seeds = [b"user_bet", debate.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: This is safe because we just transfer SOL to this account
    #[account(mut, constraint = authority.key() == debate.authority)]
    pub authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeDebate<'info> {
    #[account(mut)]
    pub debate: Account<'info, Debate>,
    #[account(
        constraint = authority.key() == jungle.authority @ CustomError::UnauthorizedAccess
    )]
    pub authority: Signer<'info>,
    #[account(seeds = [b"jungle"], bump)]
    pub jungle: Account<'info, Jungle>,
}

#[derive(Accounts)]
pub struct UpdateInitCost<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut, 
        seeds = [b"jungle"],
        bump
    )]
    pub jungle: Account<'info, Jungle>,
}

#[account]
pub struct Debate {
    pub agent_a: Pubkey,
    pub agent_b: Pubkey,
    pub total_agent_a: u64,
    pub total_agent_b: u64,
    pub finalized: bool,
    pub winning_agent: Option<Pubkey>,
    pub authority: Pubkey,
}

impl Debate {
    const LEN: usize = 32 + 32 + 8 + 8 + 1 + 33 + 32;
}

#[account]
pub struct UserBet {
    pub amount_on_a: u64,
    pub amount_on_b: u64,
}

impl UserBet {
    const LEN: usize = 8 + 8;
}

#[account]
pub struct Jungle {
    pub authority: Pubkey,
    pub init_cost: u64,
}

#[error_code]
pub enum CustomError {
    #[msg("Debate has already been finalized")]
    DebateAlreadyFinalized,
    #[msg("The winning agent is invalid")]
    InvalidWinningAgent,
    #[msg("Insufficient balance for withdrawal")]
    InsufficientBalance,
    #[msg("No winnings to withdraw")]
    NoWinningsToWithdraw,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    #[msg("Jungle not initialized")]
    JungleNotInitialized,
}
