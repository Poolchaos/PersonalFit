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

import mongoose from 'mongoose';
import Equipment from '../src/models/Equipment';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit';

async function cleanDuplicateEquipment() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all equipment grouped by user_id and equipment_name
    const allEquipment = await Equipment.find({}).sort({ created_at: 1 });

    console.log(`Total equipment items: ${allEquipment.length}`);

    const equipmentByUserAndName = new Map<string, any[]>();

    allEquipment.forEach((item) => {
      const key = `${item.user_id}_${item.equipment_name}`;
      if (!equipmentByUserAndName.has(key)) {
        equipmentByUserAndName.set(key, []);
      }
      equipmentByUserAndName.get(key)!.push(item);
    });

    let deletedCount = 0;

    // For each group, keep only the first one and delete the rest
    for (const [key, items] of equipmentByUserAndName.entries()) {
      if (items.length > 1) {
        console.log(`\nFound ${items.length} duplicates for: ${key.split('_').slice(1).join('_')}`);

        // Keep the first item, delete the rest
        const toKeep = items[0];
        const toDelete = items.slice(1);

        console.log(`  Keeping: ${toKeep._id} (created: ${toKeep.created_at})`);

        for (const item of toDelete) {
          console.log(`  Deleting: ${item._id} (created: ${item.created_at})`);
          await Equipment.findByIdAndDelete(item._id);
          deletedCount++;
        }
      }
    }

    console.log(`\nâœ… Cleanup complete!`);
    console.log(`   Deleted ${deletedCount} duplicate items`);
    console.log(`   Remaining equipment items: ${allEquipment.length - deletedCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error cleaning duplicate equipment:', error);
    process.exit(1);
  }
}

cleanDuplicateEquipment();
