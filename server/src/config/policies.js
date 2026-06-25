/**
 * @fileoverview Centralized security policies
 */
export const policies = {
  restrictedActions: [
    'delete_user_data',
    'modify_system_config',
    'read_environment_variables'
  ],
  dangerousCommands: [
    'rm -rf',
    'drop table',
    'chmod 777'
  ],
  allowedTools: [
    'fetch_data',
    'calculate_metrics',
    'search_documentation',
    'calculator',
    'userProfile',
    'knowledge'
  ]
};
