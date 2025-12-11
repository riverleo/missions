-- Add narrative_dice_roll_id column to narrative_nodes
alter table narrative_nodes
  add column narrative_dice_roll_id uuid references narrative_dice_rolls(id) on delete set null;

-- Add narrative_dice_roll_id column to narrative_node_choices
alter table narrative_node_choices
  add column narrative_dice_roll_id uuid references narrative_dice_rolls(id) on delete set null;
