/**
 * DB Audit API
 * Viteのpublicフォルダに配置して、/audit-api.js でアクセス可能
 * ブラウザで直接実行して結果を取得
 */

(function() {
  'use strict';

  window.dbAuditAPI = {
    async getAuditResults() {
      const db = window.db;
      if (!db) {
        return { error: 'db not found' };
      }

      const [
        knowledgeCards,
        understandingCards,
        chintaiCards,
        sourceQuestions,
        sourceQuestionsChintai,
        sourceChoices,
        sourceChoicesChintai,
        studyEvents
      ] = await Promise.all([
        db.knowledge_cards.count(),
        db.understanding_cards.count(),
        db.understanding_cards.where('exam_type').equals('chintai').count(),
        db.source_questions.count(),
        db.source_questions.where('exam_type').equals('chintai').count(),
        db.source_choices.count(),
        db.source_choices.filter(c => c.question_id.startsWith('C-')).count(),
        db.study_events.count()
      ]);

      const importStatus = await db.metadata.get('import_status');
      const importVersion = await db.metadata.get('import_version');
      const highQuality = await db.metadata.get('high_quality_integrated_v1');

      const emptyChoices = await db.source_choices.where('text').equals('').count();
      const shortChoices = await db.source_choices.filter(c => c.text.length < 5).count();
      const nullStatementTruth = await db.source_choices
        .filter(c => c.is_statement_true === null && c.question_id.startsWith('C-'))
        .count();
      const unknownTypeQuestions = await db.source_questions
        .where('exam_type').equals('chintai')
        .and(q => q.question_type === 'unknown')
        .count();
      const countComboQuestions = await db.source_questions
        .where('exam_type').equals('chintai')
        .and(q => q.question_type === 'count_choice' || q.question_type === 'combination')
        .count();

      return {
        knowledge_cards: knowledgeCards,
        understanding_cards: understandingCards,
        understanding_chintai: chintaiCards,
        source_questions: sourceQuestions,
        source_questions_chintai: sourceQuestionsChintai,
        source_choices: sourceChoices,
        source_choices_chintai: sourceChoicesChintai,
        study_events: studyEvents,
        empty_choice_text_count: emptyChoices,
        short_choice_text_count: shortChoices,
        null_is_statement_true_count: nullStatementTruth,
        unknown_question_type_count: unknownTypeQuestions,
        unknown_polarity_count: unknownTypeQuestions, // polarityはquestion_typeから推定
        count_question_count: countComboQuestions,
        combination_question_count: countComboQuestions,
        metadata_import_status: importStatus?.value || null,
        metadata_import_version: importVersion?.value || null,
        high_quality_integrated_v1: highQuality?.value || null
      };
    },

    async getLatestStudyEvent() {
      const db = window.db;
      if (!db) {
        return { error: 'db not found' };
      }

      const events = await db.study_events
        .orderBy('created_at')
        .reverse()
        .limit(1)
        .toArray();

      return events.length > 0 ? events[0] : null;
    },

    async getSampleActiveRecallCard() {
      const db = window.db;
      if (!db) {
        return { error: 'db not found' };
      }

      const cards = await db.understanding_cards
        .where('exam_type')
        .equals('chintai')
        .limit(1)
        .toArray();

      if (cards.length === 0) return null;

      const card = cards[0];
      return {
        card_id: card.card_id,
        exam_type: card.exam_type,
        category: card.category,
        is_statement_true: card.is_statement_true,
        sample_answer: card.sample_answer,
        has_is_statement_true: card.is_statement_true !== undefined && card.is_statement_true !== null
      };
    }
  };

  console.log('✅ DB Audit API loaded');
  console.log('使い方:');
  console.log('  const results = await window.dbAuditAPI.getAuditResults();');
  console.log('  console.table(results);');
})();
