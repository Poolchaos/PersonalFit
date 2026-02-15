/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
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
  getShopItem,
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
 * Purchase a shop item (atomic operation to prevent race conditions)
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

    // Validate item exists and get price
    const item = getShopItem(itemId);
    if (!item) {
      res.status(400).json({ error: 'Item not found' });
      return;
    }

    // Atomic purchase: only succeeds if user has enough gems AND hasn't already purchased
    // Uses $inc for gem deduction and $addToSet for purchase tracking
    const result = await User.findOneAndUpdate(
      {
        _id: userId,
        'gamification.gems': { $gte: item.gemsPrice },
        'gamification.purchased_items': { $ne: itemId },
      },
      {
        $inc: { 'gamification.gems': -item.gemsPrice },
        $addToSet: { 'gamification.purchased_items': itemId },
      },
      { new: true }
    );

    if (!result) {
      // Determine why the update failed
      const user = await User.findById(userId).select('gamification.gems gamification.purchased_items');
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userGems = user.gamification?.gems || 0;
      const userPurchases = user.gamification?.purchased_items || [];

      if (userPurchases.includes(itemId)) {
        res.status(400).json({ error: 'Item already purchased' });
        return;
      }

      if (userGems < item.gemsPrice) {
        res.status(400).json({
          error: `Not enough gems. Need ${item.gemsPrice}, have ${userGems}`,
        });
        return;
      }

      // Edge case: gamification not initialized
      res.status(400).json({ error: 'Unable to complete purchase' });
      return;
    }

    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      gemsRemaining: result.gamification?.gems,
      purchasedItems: result.gamification?.purchased_items,
    });
  } catch (error) {
    console.error('Purchase item error:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
};

/**
 * Claim milestone rewards (gems) - atomic operation
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

    // First, get user to calculate available rewards
    const user = await User.findById(userId).select(
      'gamification.level gamification.current_streak gamification.milestone_rewards_claimed'
    );
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

    // Calculate totals
    let totalGemsAwarded = 0;
    const newMilestones: string[] = [];

    for (const reward of availableRewards) {
      totalGemsAwarded += reward.gemsReward;
      newMilestones.push(reward.milestoneId);
    }

    // Atomic update: only claim milestones not already claimed
    const result = await User.findOneAndUpdate(
      {
        _id: userId,
        // Ensure none of the new milestones are already claimed
        'gamification.milestone_rewards_claimed': { $nin: newMilestones },
      },
      {
        $inc: {
          'gamification.gems': totalGemsAwarded,
          'gamification.total_gems_earned': totalGemsAwarded,
        },
        $addToSet: {
          'gamification.milestone_rewards_claimed': { $each: newMilestones },
        },
      },
      { new: true }
    );

    if (!result) {
      // Milestones were already claimed (race condition prevented)
      res.json({
        success: true,
        newRewards: [],
        totalGemsAwarded: 0,
        message: 'Rewards already claimed',
      });
      return;
    }

    res.json({
      success: true,
      newRewards: availableRewards,
      totalGemsAwarded,
      totalGems: result.gamification?.gems,
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
