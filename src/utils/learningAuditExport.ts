/**
 * Export Coverage Map and Audit logic for pure-HTML auditor
 */

import { LEARNING_SCOPE_MAP } from './learningCoverageMap';
import { auditSingleCard, generateGlobalAuditReport } from './learningQualityAudit';

// @ts-ignore
window.LEARNING_SCOPE_MAP = LEARNING_SCOPE_MAP;
// @ts-ignore
window.auditSingleCard = auditSingleCard;
// @ts-ignore
window.generateGlobalAuditReport = generateGlobalAuditReport;

console.log('Learning Audit Utilities Loaded');
