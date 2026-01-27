-- Create building_items table
-- 건물에 보관 가능한 아이템을 정의하는 테이블
CREATE TABLE building_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES user_roles(id) ON DELETE SET NULL,
  CONSTRAINT uq_building_items_building_item UNIQUE (building_id, item_id)
);

-- Enable RLS
ALTER TABLE building_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "admin can view building items"
  ON building_items FOR SELECT
  USING (is_admin());

CREATE POLICY "admins can insert building items"
  ON building_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "admins can update building items"
  ON building_items FOR UPDATE
  USING (is_admin());

CREATE POLICY "admins can delete building items"
  ON building_items FOR DELETE
  USING (is_admin());

-- Trigger for updated_at
-- Note: building_items는 updated_at 컬럼이 없으므로 트리거 불필요

-- Comments
COMMENT ON TABLE building_items IS '건물에 보관 가능한 아이템을 정의';
