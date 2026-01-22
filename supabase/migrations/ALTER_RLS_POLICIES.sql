
-- world_building_conditions (SELECT를 public으로 변경)
DROP POLICY IF EXISTS "world owner can view world_building_conditions" ON world_building_conditions;
CREATE POLICY "anyone can view world_building_conditions"
  ON world_building_conditions
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

-- scenario_snapshots (SELECT를 public으로 변경)
DROP POLICY IF EXISTS "admins can view scenario_snapshots" ON scenario_snapshots;
CREATE POLICY "anyone can view scenario_snapshots"
  ON scenario_snapshots
  FOR SELECT
  TO public
  USING (true);
