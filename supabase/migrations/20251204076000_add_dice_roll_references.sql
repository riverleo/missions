-- Add dice_roll_id column to narrative_nodes
alter table narrative_nodes
  add column dice_roll_id uuid references dice_rolls(id) on delete set null;

-- Add dice_roll_id column to narrative_node_choices
alter table narrative_node_choices
  add column dice_roll_id uuid references dice_rolls(id) on delete set null;
