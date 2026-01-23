/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of PersonalFit.
 *
 * PersonalFit is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

/**
 * Rewards Shop Service
 * Manages cosmetic items and rewards that users can purchase with gems
 */

export interface ShopItem {
  id: string;
  category: 'theme' | 'badge' | 'title' | 'avatar' | 'profile';
  name: string;
  description: string;
  icon: string;
  gemsPrice: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  purchasedAt?: Date;
}

// Available shop items
export const SHOP_ITEMS: Record<string, ShopItem> = {
  // Themes
  theme_dark: {
    id: 'theme_dark',
    category: 'theme',
    name: 'Dark Mode',
    description: 'Sleek dark theme for the app',
    icon: 'moon',
    gemsPrice: 0, // Always unlocked
    rarity: 'common',
  },
  theme_ocean: {
    id: 'theme_ocean',
    category: 'theme',
    name: 'Ocean Breeze',
    description: 'Calming ocean-inspired colors',
    icon: 'waves',
    gemsPrice: 50,
    rarity: 'uncommon',
  },
  theme_sunset: {
    id: 'theme_sunset',
    category: 'theme',
    name: 'Sunset Glow',
    description: 'Warm sunset-inspired colors',
    icon: 'sun',
    gemsPrice: 50,
    rarity: 'uncommon',
  },
  theme_neon: {
    id: 'theme_neon',
    category: 'theme',
    name: 'Neon Nights',
    description: 'Vibrant neon colors',
    icon: 'zap',
    gemsPrice: 100,
    rarity: 'rare',
  },

  // Badges
  badge_gold: {
    id: 'badge_gold',
    category: 'badge',
    name: 'Gold Badge',
    description: 'Show your premium status',
    icon: 'badge',
    gemsPrice: 75,
    rarity: 'uncommon',
  },
  badge_diamond: {
    id: 'badge_diamond',
    category: 'badge',
    name: 'Diamond Badge',
    description: 'Ultra-rare premium badge',
    icon: 'gem',
    gemsPrice: 200,
    rarity: 'legendary',
  },

  // Titles
  title_legend: {
    id: 'title_legend',
    category: 'title',
    name: '"The Legend"',
    description: 'Display this title next to your name',
    icon: 'crown',
    gemsPrice: 150,
    rarity: 'epic',
  },
  title_champion: {
    id: 'title_champion',
    category: 'title',
    name: '"The Champion"',
    description: 'For the workout champions',
    icon: 'trophy',
    gemsPrice: 100,
    rarity: 'rare',
  },
  title_warrior: {
    id: 'title_warrior',
    category: 'title',
    name: '"The Warrior"',
    description: 'For the fitness warriors',
    icon: 'shield',
    gemsPrice: 75,
    rarity: 'uncommon',
  },

  // Profile Effects
  profile_flame: {
    id: 'profile_flame',
    category: 'profile',
    name: 'Flame Border',
    description: 'Flaming profile card border',
    icon: 'flame',
    gemsPrice: 80,
    rarity: 'rare',
  },
  profile_glow: {
    id: 'profile_glow',
    category: 'profile',
    name: 'Glow Effect',
    description: 'Mystical glow around your profile',
    icon: 'sparkles',
    gemsPrice: 120,
    rarity: 'epic',
  },
};

// Milestone rewards (free items at specific levels/streaks)
export const MILESTONE_REWARDS = {
  level_5: {
    id: 'milestone_5',
    type: 'gems' as const,
    amount: 50,
    requirement: 'Reach Level 5',
  },
  level_10: {
    id: 'milestone_10',
    type: 'gems' as const,
    amount: 100,
    requirement: 'Reach Level 10',
  },
  level_15: {
    id: 'milestone_15',
    type: 'gems' as const,
    amount: 150,
    requirement: 'Reach Level 15',
  },
  level_20: {
    id: 'milestone_20',
    type: 'gems' as const,
    amount: 200,
    requirement: 'Reach Level 20',
  },
  streak_7: {
    id: 'streak_7',
    type: 'gems' as const,
    amount: 25,
    requirement: 'Maintain 7-day streak',
  },
  streak_14: {
    id: 'streak_14',
    type: 'gems' as const,
    amount: 50,
    requirement: 'Maintain 14-day streak',
  },
  streak_30: {
    id: 'streak_30',
    type: 'gems' as const,
    amount: 100,
    requirement: 'Maintain 30-day streak',
  },
};

/**
 * Get all available shop items with purchase status
 */
export function getAvailableShopItems(purchasedItems: string[] = []): ShopItem[] {
  return Object.values(SHOP_ITEMS).map((item) => ({
    ...item,
    unlocked: purchasedItems.includes(item.id),
  }));
}

/**
 * Get shop items filtered by category
 */
export function getShopItemsByCategory(
  category: ShopItem['category'],
  purchasedItems: string[] = []
): ShopItem[] {
  return Object.values(SHOP_ITEMS)
    .filter((item) => item.category === category)
    .map((item) => ({
      ...item,
      unlocked: purchasedItems.includes(item.id),
    }));
}

/**
 * Get shop item by ID
 */
export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS[id];
}

/**
 * Validate purchase
 */
export function validatePurchase(
  itemId: string,
  userGems: number,
  userPurchases: string[]
): { valid: boolean; error?: string } {
  const item = getShopItem(itemId);

  if (!item) {
    return { valid: false, error: 'Item not found' };
  }

  if (userPurchases.includes(itemId)) {
    return { valid: false, error: 'Item already purchased' };
  }

  if (userGems < item.gemsPrice) {
    return {
      valid: false,
      error: `Not enough gems. Need ${item.gemsPrice}, have ${userGems}`,
    };
  }

  return { valid: true };
}

/**
 * Get gem rewards for milestones
 */
export function checkMilestoneRewards(
  level: number,
  streak: number,
  completedMilestones: string[]
): { milestoneId: string; gemsReward: number }[] {
  const newRewards: { milestoneId: string; gemsReward: number }[] = [];

  // Check level milestones
  if (level >= 5 && !completedMilestones.includes('milestone_5')) {
    newRewards.push({ milestoneId: 'milestone_5', gemsReward: 50 });
  }
  if (level >= 10 && !completedMilestones.includes('milestone_10')) {
    newRewards.push({ milestoneId: 'milestone_10', gemsReward: 100 });
  }
  if (level >= 15 && !completedMilestones.includes('milestone_15')) {
    newRewards.push({ milestoneId: 'milestone_15', gemsReward: 150 });
  }
  if (level >= 20 && !completedMilestones.includes('milestone_20')) {
    newRewards.push({ milestoneId: 'milestone_20', gemsReward: 200 });
  }

  // Check streak milestones
  if (streak >= 7 && !completedMilestones.includes('milestone_streak_7')) {
    newRewards.push({ milestoneId: 'milestone_streak_7', gemsReward: 25 });
  }
  if (streak >= 14 && !completedMilestones.includes('milestone_streak_14')) {
    newRewards.push({ milestoneId: 'milestone_streak_14', gemsReward: 50 });
  }
  if (streak >= 30 && !completedMilestones.includes('milestone_streak_30')) {
    newRewards.push({ milestoneId: 'milestone_streak_30', gemsReward: 100 });
  }

  return newRewards;
}
