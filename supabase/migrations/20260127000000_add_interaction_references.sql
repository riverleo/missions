-- Add interaction references to behavior_actions and fulfillments
-- This must be done after interactions are created

-- Step 1: Add interaction references to need_behavior_actions
alter table need_behavior_actions
  add column building_interaction_id uuid references building_interactions(id) on delete set null,
  add column item_interaction_id uuid references item_interactions(id) on delete set null,
  add column character_interaction_id uuid references character_interactions(id) on delete set null;

-- Step 2: Add interaction references to condition_behavior_actions
alter table condition_behavior_actions
  add column building_interaction_id uuid references building_interactions(id) on delete set null,
  add column item_interaction_id uuid references item_interactions(id) on delete set null,
  add column character_interaction_id uuid references character_interactions(id) on delete set null;

-- Step 3: Add interaction references to need_fulfillments
alter table need_fulfillments
  add column building_interaction_id uuid references building_interactions(id) on delete set null,
  add column item_interaction_id uuid references item_interactions(id) on delete set null,
  add column character_interaction_id uuid references character_interactions(id) on delete set null;

-- Step 4: Add interaction references to condition_fulfillments
alter table condition_fulfillments
  add column building_interaction_id uuid references building_interactions(id) on delete set null,
  add column item_interaction_id uuid references item_interactions(id) on delete set null,
  add column character_interaction_id uuid references character_interactions(id) on delete set null;
