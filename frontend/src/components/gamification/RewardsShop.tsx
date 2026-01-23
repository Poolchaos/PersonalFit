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

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gem,
  ShoppingBag,
  Lock,
  CheckCircle,
  X,
  Waves,
  Zap,
  Award,
  Crown,
  Flame,
  Lightbulb,
  Loader2,
  AlertCircle,
  Moon,
  Sun,
  Badge,
  Shield,
  Sparkles,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { gamificationAPI } from '../../api/gamification';
import type { ShopItem } from '../../api/gamification';

// Map icon names to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  waves: <Waves className="w-10 h-10 text-cyan-500" />,
  zap: <Zap className="w-10 h-10 text-purple-500" />,
  award: <Award className="w-10 h-10 text-yellow-500" />,
  gem: <Gem className="w-10 h-10 text-cyan-400" />,
  crown: <Crown className="w-10 h-10 text-yellow-500" />,
  flame: <Flame className="w-10 h-10 text-orange-500" />,
  moon: <Moon className="w-10 h-10 text-indigo-500" />,
  sun: <Sun className="w-10 h-10 text-amber-500" />,
  badge: <Badge className="w-10 h-10 text-amber-600" />,
  trophy: <Award className="w-10 h-10 text-yellow-600" />,
  shield: <Shield className="w-10 h-10 text-blue-500" />,
  sparkles: <Sparkles className="w-10 h-10 text-purple-400" />,
  star: <Star className="w-10 h-10 text-yellow-400" />,
};

interface RewardsShopProps {
  currentGems?: number;
  onClose?: () => void;
}

export const RewardsShop: React.FC<RewardsShopProps> = ({ onClose }) => {
  const [category, setCategory] = useState<ShopItem['category'] | 'all'>('all');
  const queryClient = useQueryClient();

  // Fetch shop items from API
  const { data: shopData, isLoading, error } = useQuery({
    queryKey: ['shop', category === 'all' ? undefined : category],
    queryFn: () => gamificationAPI.getShopItems(category === 'all' ? undefined : category),
    staleTime: 30000,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => gamificationAPI.purchaseItem(itemId),
    onSuccess: (data) => {
      toast.success(`Purchased ${data.purchasedItem.name}!`);
      // Invalidate shop and gamification queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to purchase item');
    },
  });

  const items = shopData?.items || [];
  const userGems = shopData?.userGems || 0;

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getRarityColor = (rarity: ShopItem['rarity']): string => {
    switch (rarity) {
      case 'common':
        return 'text-gray-500 bg-gray-100';
      case 'uncommon':
        return 'text-green-600 bg-green-100';
      case 'rare':
        return 'text-blue-600 bg-blue-100';
      case 'epic':
        return 'text-purple-600 bg-purple-100';
      case 'legendary':
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const handlePurchase = (item: ShopItem) => {
    if (item.owned) {
      toast.error('You already own this item');
      return;
    }

    if (userGems < item.gemsPrice) {
      toast.error(`You need ${item.gemsPrice - userGems} more gems`);
      return;
    }

    purchaseMutation.mutate(item.id);
  };

  // Render icon from the iconMap
  const renderIcon = (iconKey: string) => {
    return iconMap[iconKey] || <Gem className="w-10 h-10 text-gray-400" />;
  };

  return (
    // Modal overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {/* Modal content */}
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between p-6 bg-white border-b border-neutral-200 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Rewards Shop</h2>
          </div>

          {/* Gem Balance */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-cyan-100 px-4 py-2 rounded-full border border-cyan-200">
              <Gem className="w-5 h-5 text-cyan-600" />
              <span className="font-bold text-cyan-700">{userGems} Gems</span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Close shop"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['all', 'theme', 'badge', 'title', 'profile'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
              <p className="text-neutral-500">Loading shop items...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-neutral-700 font-medium">Failed to load shop</p>
              <p className="text-sm text-neutral-500 mt-1">Please try again later</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mb-3" />
              <p className="text-neutral-700 font-medium">No items available</p>
              <p className="text-sm text-neutral-500 mt-1">Check back later for new rewards!</p>
            </div>
          )}

          {/* Items Grid */}
          {!isLoading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {items.map((item: ShopItem) => {
                const isPurchased = item.owned;
                const canAfford = userGems >= item.gemsPrice;

                return (
                  <div
                    key={item.id}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    isPurchased
                      ? 'border-green-400 bg-green-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
                  }`}
                >
                  {/* Rarity Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(item.rarity)}`}
                  >
                    {item.rarity}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex justify-center mb-3">{renderIcon(item.icon)}</div>

                    <h3 className="font-bold text-neutral-900 text-center mb-1">{item.name}</h3>
                    <p className="text-sm text-neutral-500 text-center mb-4">{item.description}</p>

                    {/* Purchase Button */}
                    {isPurchased ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-lg font-semibold bg-green-100 text-green-700 flex items-center justify-center gap-2 border border-green-300"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Owned
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                          canAfford
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        }`}
                      >
                        {!canAfford && <Lock className="w-4 h-4" />}
                        <Gem className="w-4 h-4" />
                        {item.gemsPrice}
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Info */}
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-primary-600" />
              <h4 className="font-semibold text-primary-700">Tip: Earn gems by...</h4>
            </div>
            <ul className="text-sm text-primary-600 space-y-1 ml-7">
              <li>• Reaching level milestones (Level 5, 10, 15, 20)</li>
              <li>• Maintaining workout streaks (7, 14, 30 days)</li>
              <li>• Completing challenges and achievements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsShop;
