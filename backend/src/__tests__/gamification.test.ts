import {
  calculateLevel,
  getXpForNextLevel,
  getLevelProgress,
  calculateWorkoutXp,
  updateStreak,
  checkAchievements,
  getLevelTitle,
  XP_REWARDS,
  LEVEL_THRESHOLDS,
} from '../services/gamificationService';

describe('GamificationService', () => {
  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for XP below first threshold', () => {
      expect(calculateLevel(499)).toBe(1);
    });

    it('should return level 2 at 500 XP', () => {
      expect(calculateLevel(500)).toBe(2);
    });

    it('should return level 5 at 3500 XP', () => {
      expect(calculateLevel(3500)).toBe(5);
    });

    it('should return level 10 at 14500 XP', () => {
      expect(calculateLevel(14500)).toBe(10);
    });

    it('should return max level for XP above highest threshold', () => {
      expect(calculateLevel(100000)).toBe(20);
    });
  });

  describe('getXpForNextLevel', () => {
    it('should return correct XP for next level from level 1', () => {
      expect(getXpForNextLevel(1)).toBe(500); // Level 2 threshold
    });

    it('should return correct XP for next level from level 5', () => {
      expect(getXpForNextLevel(5)).toBe(5100); // Level 6 threshold
    });

    it('should return max threshold when at max level', () => {
      expect(getXpForNextLevel(20)).toBe(LEVEL_THRESHOLDS[19]);
    });
  });

  describe('getLevelProgress', () => {
    it('should return 0% at level threshold', () => {
      expect(getLevelProgress(500)).toBe(0); // Just hit level 2
    });

    it('should return 50% at midpoint of level', () => {
      // Level 2-3: 500 to 1200 = 700 XP range
      // Midpoint: 500 + 350 = 850
      expect(getLevelProgress(850)).toBe(50);
    });

    it('should return 100% at max level', () => {
      expect(getLevelProgress(100000)).toBe(100);
    });

    it('should calculate progress correctly within a level', () => {
      // Level 1-2: 0 to 500 = 500 XP range
      // 250 XP = 50% progress
      expect(getLevelProgress(250)).toBe(50);
    });
  });

  describe('calculateWorkoutXp', () => {
    it('should award base XP for regular workout', () => {
      const result = calculateWorkoutXp({
        isFirstWorkout: false,
        currentStreak: 0,
        hadPersonalRecord: false,
      });

      expect(result.totalXp).toBe(XP_REWARDS.WORKOUT_COMPLETED);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].source).toBe('Workout Completed');
    });

    it('should award first workout bonus', () => {
      const result = calculateWorkoutXp({
        isFirstWorkout: true,
        currentStreak: 0,
        hadPersonalRecord: false,
      });

      expect(result.totalXp).toBe(
        XP_REWARDS.WORKOUT_COMPLETED + XP_REWARDS.FIRST_WORKOUT
      );
      expect(result.breakdown).toHaveLength(2);
    });

    it('should award streak bonus multiplied by streak length', () => {
      const result = calculateWorkoutXp({
        isFirstWorkout: false,
        currentStreak: 7,
        hadPersonalRecord: false,
      });

      const expectedStreakBonus = XP_REWARDS.STREAK_BONUS * 7;
      expect(result.totalXp).toBe(
        XP_REWARDS.WORKOUT_COMPLETED + expectedStreakBonus
      );
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[1].source).toContain('7-Day Streak');
    });

    it('should award PR bonus', () => {
      const result = calculateWorkoutXp({
        isFirstWorkout: false,
        currentStreak: 0,
        hadPersonalRecord: true,
      });

      expect(result.totalXp).toBe(
        XP_REWARDS.WORKOUT_COMPLETED + XP_REWARDS.PERSONAL_RECORD
      );
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[1].source).toBe('Personal Record');
    });

    it('should award all bonuses combined', () => {
      const result = calculateWorkoutXp({
        isFirstWorkout: true,
        currentStreak: 5,
        hadPersonalRecord: true,
      });

      const expectedXp =
        XP_REWARDS.WORKOUT_COMPLETED +
        XP_REWARDS.FIRST_WORKOUT +
        XP_REWARDS.STREAK_BONUS * 5 +
        XP_REWARDS.PERSONAL_RECORD;

      expect(result.totalXp).toBe(expectedXp);
      expect(result.breakdown).toHaveLength(4);
    });
  });

  describe('updateStreak', () => {
    it('should start streak at 1 for first workout', () => {
      const result = updateStreak({
        lastWorkoutDate: undefined,
        workoutDate: new Date('2024-01-01'),
        currentStreak: 0,
      });

      expect(result.newStreak).toBe(1);
      expect(result.streakBroken).toBe(false);
    });

    it('should maintain streak for same day', () => {
      const result = updateStreak({
        lastWorkoutDate: new Date('2024-01-01'),
        workoutDate: new Date('2024-01-01'),
        currentStreak: 3,
      });

      expect(result.newStreak).toBe(3);
      expect(result.streakBroken).toBe(false);
    });

    it('should increase streak for consecutive day', () => {
      const result = updateStreak({
        lastWorkoutDate: new Date('2024-01-01'),
        workoutDate: new Date('2024-01-02'),
        currentStreak: 5,
      });

      expect(result.newStreak).toBe(6);
      expect(result.streakBroken).toBe(false);
    });

    it('should reset streak when missing a day', () => {
      const result = updateStreak({
        lastWorkoutDate: new Date('2024-01-01'),
        workoutDate: new Date('2024-01-03'), // Missed day 2
        currentStreak: 10,
      });

      expect(result.newStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
    });

    it('should handle date-time differences correctly', () => {
      // Different times but same date
      const result = updateStreak({
        lastWorkoutDate: new Date('2024-01-01T08:00:00Z'),
        workoutDate: new Date('2024-01-01T20:00:00Z'),
        currentStreak: 2,
      });

      expect(result.newStreak).toBe(2);
      expect(result.streakBroken).toBe(false);
    });
  });

  describe('checkAchievements', () => {
    it('should return no achievements if all already earned', () => {
      const result = checkAchievements({
        currentAchievements: ['first_workout', 'week_warrior'],
        stats: {
          totalWorkouts: 10,
          currentStreak: 7,
          totalPRs: 0,
          level: 2,
        },
      });

      expect(result).toEqual([]);
    });

    it('should unlock first workout achievement', () => {
      const result = checkAchievements({
        currentAchievements: [],
        stats: {
          totalWorkouts: 1,
          currentStreak: 1,
          totalPRs: 0,
          level: 1,
        },
      });

      expect(result).toContain('first_workout');
    });

    it('should unlock week warrior at 7-day streak', () => {
      const result = checkAchievements({
        currentAchievements: ['first_workout'],
        stats: {
          totalWorkouts: 10,
          currentStreak: 7,
          totalPRs: 0,
          level: 2,
        },
      });

      expect(result).toContain('week_warrior');
    });

    it('should unlock multiple achievements at once', () => {
      const result = checkAchievements({
        currentAchievements: [],
        stats: {
          totalWorkouts: 100,
          currentStreak: 30,
          totalPRs: 5,
          level: 10,
        },
      });

      expect(result).toContain('first_workout');
      expect(result).toContain('week_warrior');
      expect(result).toContain('month_master');
      expect(result).toContain('consistency_king');
      expect(result).toContain('pr_crusher');
      expect(result).toContain('level_5');
      expect(result).toContain('level_10');
    });

    it('should not unlock level achievements until threshold', () => {
      const result = checkAchievements({
        currentAchievements: [],
        stats: {
          totalWorkouts: 50,
          currentStreak: 10,
          totalPRs: 3,
          level: 4,
        },
      });

      expect(result).not.toContain('level_5');
      expect(result).not.toContain('level_10');
    });
  });

  describe('getLevelTitle', () => {
    it('should return correct titles for each level range', () => {
      expect(getLevelTitle(1)).toBe('Beginner');
      expect(getLevelTitle(2)).toBe('Novice');
      expect(getLevelTitle(4)).toBe('Intermediate');
      expect(getLevelTitle(7)).toBe('Advanced');
      expect(getLevelTitle(10)).toBe('Expert');
      expect(getLevelTitle(13)).toBe('Master');
      expect(getLevelTitle(17)).toBe('Elite');
      expect(getLevelTitle(20)).toBe('Legend');
    });

    it('should return max level for levels beyond 20', () => {
      expect(getLevelTitle(25)).toBe('Max Level');
    });
  });
});
