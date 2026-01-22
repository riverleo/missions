
-- world_building_conditions (SELECT를 public으로 변경)
DROP POLICY IF EXISTS "world owner can view world_building_conditions" ON world_building_conditions;
CREATE POLICY "anyone can view world_building_conditions"
  ON world_building_conditions
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);
