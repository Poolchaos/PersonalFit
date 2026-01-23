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

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import {
  getAvailableShopItems,
  getShopItemsByCategory,
  validatePurchase,
  checkMilestoneRewards,
} from '../services/rewardsShopService';

/**
 * Get all available shop items
 */
export const getShopItems = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const category = req.query.category as string | undefined;
    let items;

    if (category) {
      items = getShopItemsByCategory(
        category as 'theme' | 'badge' | 'title' | 'avatar' | 'profile',
        user.gamification?.purchased_items || []
      );
    } else {
      items = getAvailableShopItems(user.gamification?.purchased_items || []);
    }

    res.json({
      items,
      userGems: user.gamification?.gems || 0,
    });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Failed to retrieve shop items' });
  }
};

/**
 * Purchase a shop item
 */
export const purchaseItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.body;
    if (!itemId) {
      res.status(400).json({ error: 'Item ID is required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Initialize gamification if needed
    if (!user.gamification) {
      user.gamification = {
        xp: 0,
        level: 1,
        total_workouts_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        total_prs: 0,
        achievements: [],
        gems: 0,
        total_gems_earned: 0,
        purchased_items: [],
        milestone_rewards_claimed: [],
        streak_freezes_available: 0,
        streak_freezes_used_this_month: 0,
      };
    }

    const userGems = user.gamification!.gems || 0;
    const userPurchases = user.gamification!.purchased_items || [];

    // Validate purchase
    const validation = validatePurchase(itemId, userGems, userPurchases);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const item = require('../services/rewardsShopService').getShopItem(itemId);

    // Deduct gems and add to purchases
    if (user.gamification) {
      user.gamification.gems = userGems - item.gemsPrice;
      user.gamification.purchased_items = [...userPurchases, itemId];
    }

    await user.save();

    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      gemsRemaining: user.gamification?.gems,
      purchasedItems: user.gamification?.purchased_items,
    });
  } catch (error) {
    console.error('Purchase item error:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
};

/**
 * Claim milestone rewards (gems)
 */
export const claimMilestoneRewards = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const level = user.gamification?.level || 1;
    const streak = user.gamification?.current_streak || 0;
    const completedMilestones = user.gamification?.milestone_rewards_claimed || [];

    // Check for available milestone rewards
    const availableRewards = checkMilestoneRewards(level, streak, completedMilestones);

    if (availableRewards.length === 0) {
      res.json({
        success: true,
        newRewards: [],
        totalGemsAwarded: 0,
        message: 'No new milestone rewards available',
      });
      return;
    }

    // Award gems
    let totalGemsAwarded = 0;
    const newMilestones: string[] = [];

    for (const reward of availableRewards) {
      totalGemsAwarded += reward.gemsReward;
      newMilestones.push(reward.milestoneId);
    }

    user.gamification!.gems = (user.gamification?.gems || 0) + totalGemsAwarded;
    user.gamification!.total_gems_earned =
      (user.gamification?.total_gems_earned || 0) + totalGemsAwarded;
    user.gamification!.milestone_rewards_claimed = [
      ...completedMilestones,
      ...newMilestones,
    ];

    await user.save();

    res.json({
      success: true,
      newRewards: availableRewards,
      totalGemsAwarded,
      totalGems: user.gamification!.gems,
      message: `Claimed ${totalGemsAwarded} gems!`,
    });
  } catch (error) {
    console.error('Claim milestone rewards error:', error);
    res.status(500).json({ error: 'Failed to claim rewards' });
  }
};

/**
 * Get user's gem balance and purchase history
 */
export const getGemBalance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const gamification = user.gamification || {
      gems: 0,
      total_gems_earned: 0,
      purchased_items: [],
    };

    res.json({
      currentGems: gamification.gems || 0,
      totalGemsEarned: gamification.total_gems_earned || 0,
      purchasedItems: gamification.purchased_items || [],
      itemCount: (gamification.purchased_items || []).length,
    });
  } catch (error) {
    console.error('Get gem balance error:', error);
    res.status(500).json({ error: 'Failed to retrieve gem balance' });
  }
};
