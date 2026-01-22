# RLS Policies Summary

## Master Data Tables (Admin Only - Will be managed via Snapshots)
| TABLE                          | INSERT | SELECT | UPDATE | DELETE |
|--------------------------------|--------|--------|--------|--------|
| behavior_priorities            | admin  | admin  | admin  | admin  |
| building_conditions            | admin  | admin  | admin  | admin  |
| building_interaction_actions   | admin  | admin  | admin  | admin  |
| building_interactions          | admin  | admin  | admin  | admin  |
| building_states                | admin  | admin  | admin  | admin  |
| buildings                      | admin  | admin  | admin  | admin  |
| chapters                       | admin  | admin  | admin  | admin  |
| character_bodies               | admin  | admin  | admin  | admin  |
| character_body_states          | admin  | admin  | admin  | admin  |
| character_face_states          | admin  | admin  | admin  | admin  |
| character_interaction_actions  | admin  | admin  | admin  | admin  |
| character_interactions         | admin  | admin  | admin  | admin  |
| character_needs                | admin  | admin  | admin  | admin  |
| characters                     | admin  | admin  | admin  | admin  |
| condition_behavior_actions     | admin  | admin  | admin  | admin  |
| condition_behaviors            | admin  | admin  | admin  | admin  |
| condition_effects              | admin  | admin  | admin  | admin  |
| condition_fulfillments         | admin  | admin  | admin  | admin  |
| conditions                     | admin  | admin  | admin  | admin  |
| dices                          | admin  | admin  | admin  | admin  |
| item_interaction_actions       | admin  | admin  | admin  | admin  |
| item_interactions              | admin  | admin  | admin  | admin  |
| item_states                    | admin  | admin  | admin  | admin  |
| items                          | admin  | admin  | admin  | admin  |
| narrative_dice_rolls           | admin  | admin  | admin  | admin  |
| narrative_node_choices         | admin  | admin  | admin  | admin  |
| narrative_nodes                | admin  | admin  | admin  | admin  |
| narratives                     | admin  | admin  | admin  | admin  |
| need_behavior_actions          | admin  | admin  | admin  | admin  |
| need_behaviors                 | admin  | admin  | admin  | admin  |
| need_fulfillments              | admin  | admin  | admin  | admin  |
| needs                          | admin  | admin  | admin  | admin  |
| quest_branches                 | admin  | admin  | admin  | admin  |
| quests                         | admin  | admin  | admin  | admin  |
| scenario_snapshots             | admin  | admin  | admin  | admin  |
| scenarios                      | admin  | admin  | admin  | admin  |
| terrains                       | admin  | admin  | admin  | admin  |
| terrains_tiles                 | admin  | admin  | admin  | admin  |
| tile_states                    | admin  | admin  | admin  | admin  |
| tiles                          | admin  | admin  | admin  | admin  |

## World Data Tables (User Game Data)
| TABLE                       | INSERT      | SELECT | UPDATE      | DELETE |
|-----------------------------|-------------|--------|-------------|--------|
| worlds                      | owner/admin | public | owner/admin | admin  |
| world_building_conditions   | owner/admin | owner  | owner/admin | admin  |
| world_buildings             | owner/admin | public | owner/admin | admin  |
| world_character_needs       | owner/admin | public | owner/admin | admin  |
| world_characters            | owner/admin | public | owner/admin | admin  |
| world_items                 | owner/admin | public | owner/admin | admin  |
| world_tile_maps             | owner/admin | public | owner/admin | admin  |

## Player Data Tables (User Progress Data)
| TABLE                 | INSERT | SELECT | UPDATE | DELETE |
|-----------------------|--------|--------|--------|--------|
| player_chapters       | player | player | -      | -      |
| player_quest_branches | player | player | -      | -      |
| player_quests         | player | player | -      | -      |
| player_rolled_dices   | player | player | -      | -      |
| player_scenarios      | player | player | -      | -      |

## System Tables
| TABLE      | INSERT | SELECT      | UPDATE      | DELETE |
|------------|--------|-------------|-------------|--------|
| players    | player | owner/admin | owner/admin | -      |
| user_roles | admin  | owner/admin | admin       | -      |

## Notes
- **admin**: Only admin users can access
- **owner**: World owner or record owner can access
- **owner/admin**: Either owner or admin can access
- **player**: Player (logged in user) can access their own data
- **public**: Anyone can view (but soft-deleted records are filtered)
- **-**: No policy (operation not allowed)

## Snapshot Strategy
All master data tables (admin-only) will be managed through snapshots:
1. Admin edits master data in admin panel
2. Admin creates a snapshot of the scenario
3. New worlds reference a specific snapshot
4. Changes to master data don't affect existing worlds
5. Worlds load data from their referenced snapshot
