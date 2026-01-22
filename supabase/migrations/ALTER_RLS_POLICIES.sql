
-- dices
DROP POLICY IF EXISTS "authenticated can view dices" ON dices;
CREATE POLICY "admins can view dices"
  ON dices
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- scenarios
DROP POLICY IF EXISTS "authenticated can view published scenarios" ON scenarios;
CREATE POLICY "admins can view scenarios"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- narratives
DROP POLICY IF EXISTS "authenticated can view narratives" ON narratives;
CREATE POLICY "admins can view narratives"
  ON narratives
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- narrative_nodes
DROP POLICY IF EXISTS "authenticated can view narrative_nodes" ON narrative_nodes;
CREATE POLICY "admins can view narrative_nodes"
  ON narrative_nodes
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- narrative_node_choices
DROP POLICY IF EXISTS "authenticated can view narrative_node_choices" ON narrative_node_choices;
CREATE POLICY "admins can view narrative_node_choices"
  ON narrative_node_choices
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- narrative_dice_rolls
DROP POLICY IF EXISTS "authenticated can view narrative_dice_rolls" ON narrative_dice_rolls;
CREATE POLICY "admins can view narrative_dice_rolls"
  ON narrative_dice_rolls
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- quests
DROP POLICY IF EXISTS "authenticated can view published quests" ON quests;
CREATE POLICY "admins can view quests"
  ON quests
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- quest_branches
DROP POLICY IF EXISTS "authenticated can view quest_branches" ON quest_branches;
CREATE POLICY "admins can view quest_branches"
  ON quest_branches
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- chapters
DROP POLICY IF EXISTS "authenticated can view published chapters" ON chapters;
CREATE POLICY "admins can view chapters"
  ON chapters
  FOR SELECT
  TO authenticated
  USING (is_admin());
