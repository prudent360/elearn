export const PERMISSIONS=[
  'view_dashboard','manage_users','manage_instructors','manage_students',
  'create_courses','edit_courses','delete_courses','publish_courses',
  'manage_quizzes','manage_assignments','manage_certificates',
  'manage_payments','process_refunds','view_financial_reports',
  'manage_email_settings','manage_notifications','manage_platform_settings',
  'manage_integrations','view_analytics','manage_roles'
];
export const ADMIN_PERMISSIONS=PERMISSIONS.filter(p=>p!=='process_refunds');
export function validPermission(value){return PERMISSIONS.includes(value)}
