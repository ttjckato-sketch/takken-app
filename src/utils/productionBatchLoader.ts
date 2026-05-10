import { db } from '../db';
import { InputUnit } from '../types/inputUnit';

/**
 * P42: Production Batch Loader
 * JSON Seed 形式の高品質 Input を検証・投入・管理する。
 */

export interface BatchManifest {
    batch_id: string;
    item_count: number;
    source: string;
    storage_strategy: string;
    apply_status: 'dry_run_only' | 'approved_for_apply' | 'applied';
    db_write_executed: boolean;
    rollback_key: string;
    expected_categories: Record<string, number>;
}

export interface BatchData {
    batch_id: string;
    origin: string;
    generated_from: string;
    items: InputUnit[];
}

export interface DryRunReport {
    status: 'DRY_RUN_PASS' | 'DRY_RUN_BLOCKED' | 'DRY_RUN_FAIL';
    batch_id: string;
    db_write_executed: boolean;
    apply_executed: boolean;
    rollback_executed: boolean;
    item_count: number;
    valid_item_count: number;
    invalid_schema_count: number;
    duplicate_generated_id_count: number;
    collision_count: number;
    forbidden_risk_count: number;
    missing_visual_payload_count: number;
    source_trace_missing_count: number;
    source_trace_A_count: number;
    target_store_exists: boolean;
    apply_blocked_by_missing_store: boolean;
    errors: string[];
}

/**
 * マニフェストの基本検証
 */
export const validateBatchManifest = (manifest: any): string[] => {
    const errors: string[] = [];
    if (!manifest.batch_id) errors.push('Missing batch_id');
    if (typeof manifest.item_count !== 'number') errors.push('Invalid item_count');
    if (manifest.apply_status !== 'dry_run_only' && manifest.apply_status !== 'approved_for_apply') {
        errors.push(`Invalid apply_status: ${manifest.apply_status}`);
    }
    return errors;
};

/**
 * 禁止されたリスクフラグの混入チェック
 */
const FORBIDDEN_RISKS = [
    'law_revision_risk',
    'tax_year_dependency',
    'broken_short_text',
    'recovery_pending',
    'count_combination',
    'ai_guess_required',
    'old_law_suspected',
    'duplicate_or_overlap_risk'
];

/**
 * 旗艦論点やソース母集団との ID 衝突チェック (Dry-run 版: Read-only)
 */
export const checkBatchCollisions = async (items: InputUnit[]): Promise<{ count: number; details: string[] }> => {
    let count = 0;
    const details: string[] = [];
    
    // 注意: IndexedDB の store が存在しない場合はチェックをスキップ (またはエラー)
    const storeExists = db.tables.some(t => t.name === 'high_quality_input_units');
    
    for (const item of items) {
        // 1. ソース母集団 (source_choices) との衝突確認 (ID 体系が違うはずだが念のため)
        const choice = await db.source_choices.get(item.unit_id);
        if (choice) {
            count++;
            details.push(`Collision with source_choice: ${item.unit_id}`);
        }
        
        // 2. 将来の HQI ストアとの衝突確認
        if (storeExists) {
            const existing = await db.table('high_quality_input_units').get(item.unit_id);
            if (existing) {
                count++;
                details.push(`Collision with existing HQI: ${item.unit_id}`);
            }
        }
    }
    
    return { count, details };
};

/**
 * Production Dry-run 実行
 */
export async function dryRunProductionBatch(manifest: BatchManifest, data: BatchData): Promise<DryRunReport> {
    const report: DryRunReport = {
        status: 'DRY_RUN_PASS',
        batch_id: manifest.batch_id,
        db_write_executed: false,
        apply_executed: false,
        rollback_executed: false,
        item_count: data.items.length,
        valid_item_count: 0,
        invalid_schema_count: 0,
        duplicate_generated_id_count: 0,
        collision_count: 0,
        forbidden_risk_count: 0,
        missing_visual_payload_count: 0,
        source_trace_missing_count: 0,
        source_trace_A_count: 0,
        target_store_exists: db.tables.some(t => t.name === 'high_quality_input_units'),
        apply_blocked_by_missing_store: !db.tables.some(t => t.name === 'high_quality_input_units'),
        errors: []
    };

    // 1. Manifest 整合性
    const mErrors = validateBatchManifest(manifest);
    if (mErrors.length > 0) {
        report.status = 'DRY_RUN_FAIL';
        report.errors.push(...mErrors);
    }
    if (manifest.item_count !== data.items.length) {
        report.errors.push(`Item count mismatch: manifest=${manifest.item_count}, actual=${data.items.length}`);
    }

    // 2. Item 検証
    const seenIds = new Set<string>();
    data.items.forEach(item => {
        let isItemValid = true;

        // ID 形式と重複
        if (!item.unit_id?.startsWith('HQI-PROD-B')) {
            report.errors.push(`Invalid ID format: ${item.unit_id}`);
            isItemValid = false;
        }
        if (seenIds.has(item.unit_id)) {
            report.duplicate_generated_id_count++;
            isItemValid = false;
        }
        seenIds.add(item.unit_id);

        // Schema 必須フィールド
        if (!item.title || !item.conclusion || !item.understanding_visual) {
            report.invalid_schema_count++;
            isItemValid = false;
        }

        // Visual Payload
        const vType = item.understanding_visual?.type;
        if (vType && !item[vType as keyof InputUnit]) {
            report.missing_visual_payload_count++;
            isItemValid = false;
        }

        // Source Trace & Risk
        if (!item.source_trace || item.source_trace.length === 0) {
            report.source_trace_missing_count++;
            isItemValid = false;
        } else {
            const hasGradeA = item.source_trace.some(st => (st as any).confidence === 'high');
            if (hasGradeA) report.source_trace_A_count++;
        }

        // Risk Flags (Batch 1 では混入禁止)
        const risks = (item as any).risk_flags || [];
        if (risks.some((r: string) => FORBIDDEN_RISKS.includes(r))) {
            report.forbidden_risk_count++;
            isItemValid = false;
        }

        if (isItemValid) report.valid_item_count++;
    });

    // 3. 衝突チェック (Async)
    const collisionRes = await checkBatchCollisions(data.items);
    report.collision_count = collisionRes.count;
    report.errors.push(...collisionRes.details);

    // 最終ステータス判定
    if (report.invalid_schema_count > 0 || report.forbidden_risk_count > 0 || report.collision_count > 0) {
        report.status = 'DRY_RUN_FAIL';
    } else if (report.apply_blocked_by_missing_store) {
        report.status = 'DRY_RUN_BLOCKED';
    }

    return report;
}

/**
 * P43: Formal Import 実行オプション
 */
export interface FormalImportOptions {
    confirm: boolean;
    dryRun?: boolean;
    batchId: string;
}

/**
 * P43: Formal Import 実行結果
 */
export interface FormalImportResult {
    ok: boolean;
    mode: 'dry_run' | 'formal_import';
    batch_id: string;
    expected_count: number;
    inserted_count: number;
    deleted_count: number;
    skipped_count: number;
    errors: string[];
    before_count: number;
    after_count: number;
    touched_stores: string[];
}

/**
 * P43: Rollback 実行オプション
 */
export interface RollbackOptions {
    confirm: boolean;
    dryRun?: boolean;
}

/**
 * P43: Rollback 実行結果
 */
export interface RollbackResult {
    ok: boolean;
    mode: 'dry_run' | 'rollback';
    batch_id: string;
    expected_count: number;
    deleted_count: number;
    errors: string[];
    before_count: number;
    after_count: number;
    touched_stores: string[];
}

/**
 * P43: High Quality Input Units の正式投入（Batch 1専用）
 *
 * Safety Guards:
 * - confirm === true でなければ実行しない
 * - batch_id が空なら停止
 * - converted_units が20件でなければ停止
 * - validation_failed が0でなければ停止
 * - duplicate_id_count が0でなければ停止
 * - source_trace_grade_A以外が混ざる場合は停止
 * - human_review_required true が混ざる場合は停止
 *
 * Write Targets:
 * - db.high_quality_input_units のみに書き込む
 *
 * Protected Stores (Read-only):
 * - source_choices
 * - is_statement_true
 * - study_events
 * - memory_cards
 * - restoration_candidates
 */
export async function importHighQualityInputUnitsBatch1(
    manifest: BatchManifest,
    data: BatchData,
    options: FormalImportOptions
): Promise<FormalImportResult> {
    const result: FormalImportResult = {
        ok: false,
        mode: options.dryRun ? 'dry_run' : 'formal_import',
        batch_id: options.batchId,
        expected_count: data.items.length,
        inserted_count: 0,
        deleted_count: 0,
        skipped_count: 0,
        errors: [],
        before_count: 0,
        after_count: 0,
        touched_stores: ['high_quality_input_units']
    };

    // Safety Guard 1: confirm flag
    if (!options.dryRun && !options.confirm) {
        result.errors.push('Safety Guard: confirm flag is required for formal import. Set confirm=true or use dryRun=true.');
        return result;
    }

    // Safety Guard 2: batch_id validation
    if (!options.batchId || options.batchId.trim() === '') {
        result.errors.push('Safety Guard: batch_id is required and cannot be empty.');
        return result;
    }

    // Safety Guard 3: item count validation (Batch 1 = 20)
    if (data.items.length !== 20) {
        result.errors.push(`Safety Guard: Expected 20 items for Batch 1, got ${data.items.length}.`);
        return result;
    }

    // Get store reference
    const storeExists = db.tables.some(t => t.name === 'high_quality_input_units');
    if (!storeExists) {
        result.errors.push('Safety Guard: high_quality_input_units store does not exist.');
        return result;
    }

    const hqiStore = db.table('high_quality_input_units');

    // Get before count
    result.before_count = await hqiStore.count();

    // Safety Guard 4: duplicate ID check
    const existingIds = new Set<string>();
    for (const item of data.items) {
        const existing = await hqiStore.get(item.unit_id);
        if (existing) {
            existingIds.add(item.unit_id);
        }
    }
    if (existingIds.size > 0) {
        result.errors.push(`Safety Guard: Duplicate IDs found in high_quality_input_units: ${Array.from(existingIds).join(', ')}`);
        return result;
    }

    // Safety Guard 5: validation check
    const dryRunResult = await dryRunProductionBatch(manifest, data);
    if (dryRunResult.status !== 'DRY_RUN_PASS') {
        result.errors.push(`Safety Guard: Dry-run validation failed. Status: ${dryRunResult.status}`);
        result.errors.push(...dryRunResult.errors);
        return result;
    }

    // Safety Guard 6: source_trace_grade validation (all must be Grade A)
    const nonGradeAItems = data.items.filter(item => {
        const sourceTrace = item.source_trace || [];
        return !sourceTrace.some((st: any) => st.confidence === 'high');
    });
    if (nonGradeAItems.length > 0) {
        result.errors.push(`Safety Guard: ${nonGradeAItems.length} items do not have source_trace_grade A.`);
        return result;
    }

    // Safety Guard 7: human_review_required validation (all must be false)
    const reviewRequiredItems = data.items.filter(item => {
        return (item as any).human_review_required === true;
    });
    if (reviewRequiredItems.length > 0) {
        result.errors.push(`Safety Guard: ${reviewRequiredItems.length} items require human review.`);
        return result;
    }

    // Dry-run mode: return without writing
    if (options.dryRun) {
        result.ok = true;
        result.inserted_count = data.items.length;
        result.after_count = result.before_count;
        return result;
    }

    // Formal import: write to high_quality_input_units only
    try {
        await db.transaction('rw', hqiStore, async () => {
            for (const item of data.items) {
                await hqiStore.add({
                    id: item.unit_id,
                    source_item_id: item.unit_id,
                    batch_id: options.batchId,
                    origin: 'high_quality_input_unit_batch1',
                    category: item.category,
                    review_status: 'auto_ok',
                    source_trace_grade: 'A',
                    visual_type: (item.understanding_visual?.type || 'none') as any,
                    disabled: false,
                    created_at: Date.now(),
                    updated_at: Date.now()
                });
                result.inserted_count++;
            }
        });

        result.after_count = await hqiStore.count();
        result.ok = true;
    } catch (error) {
        result.errors.push(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
}

/**
 * P43: High Quality Input Units の Rollback（batch_id指定）
 *
 * Safety Guards:
 * - confirm === true でなければ実行しない
 * - batch_id が空なら停止
 * - 削除前に対象件数を確認
 *
 * Write Targets:
 * - db.high_quality_input_units のみを削除
 *
 * Protected Stores (Read-only):
 * - source_choices
 * - is_statement_true
 * - study_events
 * - memory_cards
 * - restoration_candidates
 */
export async function rollbackHighQualityInputUnitsBatch(
    batchId: string,
    options: RollbackOptions
): Promise<RollbackResult> {
    const result: RollbackResult = {
        ok: false,
        mode: options.dryRun ? 'dry_run' : 'rollback',
        batch_id: batchId,
        expected_count: 0,
        deleted_count: 0,
        errors: [],
        before_count: 0,
        after_count: 0,
        touched_stores: ['high_quality_input_units']
    };

    // Safety Guard 1: confirm flag
    if (!options.dryRun && !options.confirm) {
        result.errors.push('Safety Guard: confirm flag is required for rollback. Set confirm=true or use dryRun=true.');
        return result;
    }

    // Safety Guard 2: batch_id validation
    if (!batchId || batchId.trim() === '') {
        result.errors.push('Safety Guard: batch_id is required and cannot be empty.');
        return result;
    }

    const storeExists = db.tables.some(t => t.name === 'high_quality_input_units');
    if (!storeExists) {
        result.errors.push('Safety Guard: high_quality_input_units store does not exist.');
        return result;
    }

    const hqiStore = db.table('high_quality_input_units');

    // Get before count
    result.before_count = await hqiStore.count();

    // Count items to delete
    const itemsToDelete = await hqiStore.where('batch_id').equals(batchId).toArray();
    result.expected_count = itemsToDelete.length;

    // Dry-run mode: return without deleting
    if (options.dryRun) {
        result.ok = true;
        result.deleted_count = itemsToDelete.length;
        result.after_count = result.before_count;
        return result;
    }

    // Formal rollback: delete from high_quality_input_units only
    try {
        await db.transaction('rw', hqiStore, async () => {
            const keysToDelete = itemsToDelete.map(item => item.id);
            await hqiStore.bulkDelete(keysToDelete);
            result.deleted_count = keysToDelete.length;
        });

        result.after_count = await hqiStore.count();
        result.ok = true;
    } catch (error) {
        result.errors.push(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
}
