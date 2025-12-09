-- Add dice_roll_id column to narrative_nodes
alter table narrative_nodes
  add column dice_roll_id uuid not null references dice_roll(id) on delete cascade;

-- Add dice_roll_id column to narrative_node_choices
alter table narrative_node_choices
  add column dice_roll_id uuid not null references dice_roll(id) on delete cascade;
