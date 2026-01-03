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

// MongoDB Initialization Script for PersonalFit
// This script runs automatically when the container first starts

db = db.getSiblingDB('personalfit');

// Create indexes for User collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: -1 });

// Create indexes for Equipment collection
db.equipment.createIndex({ user_id: 1, equipment_type: 1 });
db.equipment.createIndex({ user_id: 1, is_available: 1 });
db.equipment.createIndex({ created_at: -1 });

// Create indexes for WorkoutPlan collection
db.workoutplans.createIndex({ user_id: 1, is_active: 1, created_at: -1 });
db.workoutplans.createIndex({ user_id: 1, created_at: -1 });

print('PersonalFit database initialized successfully');
print('Indexes created for users, equipment, and workoutplans collections');
