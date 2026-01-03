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
import { validationResult } from 'express-validator';
import Equipment from '../models/Equipment';
import { AuthRequest } from '../middleware/auth';

export const getEquipment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, available } = req.query;
    const filter: Record<string, unknown> = { user_id: req.user?.userId };

    if (type) {
      filter.equipment_type = type;
    }

    if (available !== undefined) {
      filter.is_available = available === 'true';
    }

    const equipment = await Equipment.find(filter).sort({ created_at: -1 });

    res.json({ equipment });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEquipment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const equipment = new Equipment({
      user_id: req.user?.userId,
      ...req.body,
    });

    await equipment.save();

    res.status(201).json({ equipment });
  } catch (error: unknown) {
    // Handle duplicate key error (E11000)
    const err = error as { code?: number };
    if (err.code === 11000) {
      console.log('Duplicate equipment detected, ignoring:', req.body.equipment_name);
      // Return existing equipment instead of error
      const existing = await Equipment.findOne({
        user_id: req.user?.userId,
        equipment_name: req.body.equipment_name,
      });
      res.status(200).json({ equipment: existing, message: 'Equipment already exists' });
      return;
    }

    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEquipment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const equipment = await Equipment.findOne({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    Object.assign(equipment, req.body);
    await equipment.save();

    res.json({ equipment });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEquipment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const equipment = await Equipment.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user?.userId,
    });

    if (!equipment) {
      res.status(404).json({ error: 'Equipment not found' });
      return;
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cleanDuplicateEquipment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Get all equipment for this user
    const allEquipment = await Equipment.find({ user_id: userId }).sort({ created_at: 1 });

    const equipmentByName = new Map<string, typeof allEquipment>();

    // Group by equipment_name
    allEquipment.forEach((item) => {
      const name = item.equipment_name;
      if (!equipmentByName.has(name)) {
        equipmentByName.set(name, []);
      }
      equipmentByName.get(name)!.push(item);
    });

    let deletedCount = 0;

    // For each group, keep only the first one and delete the rest
    for (const items of equipmentByName.values()) {
      if (items.length > 1) {
        // Delete duplicates (keep first, delete rest)
        for (let i = 1; i < items.length; i++) {
          await Equipment.deleteOne({ _id: items[i]._id });
          deletedCount++;
        }
      }
    }

    res.json({
      message: `Cleaned ${deletedCount} duplicate equipment items`,
      deletedCount,
      remainingCount: allEquipment.length - deletedCount,
    });
  } catch (error) {
    console.error('Clean duplicate equipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
