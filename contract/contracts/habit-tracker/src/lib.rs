#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec, Map};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Frequency {
    Daily = 0,
    Weekly = 1,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Habit {
    pub id: u32,
    pub owner: Address,
    pub name: String,
    pub description: String,
    pub frequency: Frequency,
    pub streak: u32,
    pub longest_streak: u32,
    pub total_completions: u32,
    pub last_completed_day: u64,
    pub created_at: u64,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStats {
    pub total_habits: u32,
    pub token_balance: i128,
    pub total_check_ins: u32,
}

#[contracttype]
pub enum DataKey {
    Habit(Address, u32),
    HabitCount(Address),
    TokenBalance(Address),
    TotalCheckIns(Address),
}

const DAY_SECONDS: u64 = 86400;

#[contract]
pub struct HabitTracker;

#[contractimpl]
impl HabitTracker {
    /// Create a new habit for the sender
    pub fn create_habit(env: Env, owner: Address, name: String, description: String, frequency: u32) -> u32 {
        owner.require_auth();

        let count_key = DataKey::HabitCount(owner.clone());
        let mut count: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        count += 1;

        let freq = if frequency == 1 { Frequency::Weekly } else { Frequency::Daily };

        let habit = Habit {
            id: count,
            owner: owner.clone(),
            name,
            description,
            frequency: freq,
            streak: 0,
            longest_streak: 0,
            total_completions: 0,
            last_completed_day: 0,
            created_at: env.ledger().timestamp(),
            is_active: true,
        };

        env.storage().persistent().set(&DataKey::Habit(owner.clone(), count), &habit);
        env.storage().persistent().set(&count_key, &count);

        count
    }

    /// Check-in to a habit and update streaks/rewards
    pub fn check_in(env: Env, owner: Address, habit_id: u32) -> i128 {
        owner.require_auth();

        let habit_key = DataKey::Habit(owner.clone(), habit_id);
        let mut habit: Habit = env.storage().persistent().get(&habit_key).expect("Habit not found");

        if !habit.is_active {
            panic!("Habit is inactive");
        }

        let now_s = env.ledger().timestamp();
        let current_day = now_s / DAY_SECONDS;

        if habit.last_completed_day == current_day {
            panic!("Already checked in today");
        }

        // Streak logic
        if habit.last_completed_day == current_day - 1 {
            habit.streak += 1;
        } else {
            habit.streak = 1;
        }

        if habit.streak > habit.longest_streak {
            habit.longest_streak = habit.streak;
        }

        habit.total_completions += 1;
        habit.last_completed_day = current_day;

        // Reward logic (simple token grant)
        let reward: i128 = match habit.streak {
            100 => 50,
            30 => 20,
            7 => 10,
            3 => 5,
            _ => 1,
        } * 10_000_000; // 7 decimals scale

        let balance_key = DataKey::TokenBalance(owner.clone());
        let balance: i128 = env.storage().persistent().get(&balance_key).unwrap_or(0);
        env.storage().persistent().set(&balance_key, &(balance + reward));

        let checkins_key = DataKey::TotalCheckIns(owner.clone());
        let total_checkins: u32 = env.storage().persistent().get(&checkins_key).unwrap_or(0);
        env.storage().persistent().set(&checkins_key, &(total_checkins + 1));

        env.storage().persistent().set(&habit_key, &habit);

        reward
    }

    /// Deactivate a habit
    pub fn deactivate_habit(env: Env, owner: Address, habit_id: u32) {
        owner.require_auth();
        let habit_key = DataKey::Habit(owner.clone(), habit_id);
        let mut habit: Habit = env.storage().persistent().get(&habit_key).expect("Habit not found");
        habit.is_active = false;
        env.storage().persistent().set(&habit_key, &habit);
    }

    /// View a specific habit
    pub fn get_habit(env: Env, owner: Address, habit_id: u32) -> Habit {
        env.storage().persistent().get(&DataKey::Habit(owner, habit_id)).expect("Habit not found")
    }

    /// List ALL habits for a user
    pub fn get_habits(env: Env, owner: Address) -> Vec<Habit> {
        let count: u32 = env.storage().persistent().get(&DataKey::HabitCount(owner.clone())).unwrap_or(0);
        let mut list = Vec::new(&env);
        for i in 1..=count {
            if let Some(habit) = env.storage().persistent().get::<DataKey, Habit>(&DataKey::Habit(owner.clone(), i)) {
                list.push_back(habit);
            }
        }
        list
    }

    /// List only ACTIVE habits
    pub fn get_active_habits(env: Env, owner: Address) -> Vec<Habit> {
        let count: u32 = env.storage().persistent().get(&DataKey::HabitCount(owner.clone())).unwrap_or(0);
        let mut list = Vec::new(&env);
        for i in 1..=count {
            if let Some(habit) = env.storage().persistent().get::<DataKey, Habit>(&DataKey::Habit(owner.clone(), i)) {
                if habit.is_active {
                    list.push_back(habit);
                }
            }
        }
        list
    }

    /// Check if a habit was completed today
    pub fn is_checked_in_today(env: Env, owner: Address, habit_id: u32) -> bool {
        let habit_key = DataKey::Habit(owner, habit_id);
        if let Some(habit) = env.storage().persistent().get::<DataKey, Habit>(&habit_key) {
            let current_day = env.ledger().timestamp() / DAY_SECONDS;
            habit.last_completed_day == current_day
        } else {
            false
        }
    }

    /// Get user stats
    pub fn get_user_stats(env: Env, owner: Address) -> UserStats {
        let total_habits: u32 = env.storage().persistent().get(&DataKey::HabitCount(owner.clone())).unwrap_or(0);
        let token_balance: i128 = env.storage().persistent().get(&DataKey::TokenBalance(owner.clone())).unwrap_or(0);
        let total_check_ins: u32 = env.storage().persistent().get(&DataKey::TotalCheckIns(owner.clone())).unwrap_or(0);

        UserStats {
            total_habits,
            token_balance,
            total_check_ins,
        }
    }
}
