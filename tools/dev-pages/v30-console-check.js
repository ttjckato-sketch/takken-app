// v30 Runtime Console Check
// ブラウザのコンソール (F12) に貼り付けて実行してください

(async function checkV30() {
    console.log('=== v30 Runtime Check ===');

    try {
        // dbインスタンスを取得
        const db = window.db;
        if (!db) {
            console.error('db not found. Please run on the app page.');
            return;
        }

        // Dexie version
        const dbVersion = db.verno;
        console.log('dexie_version:', dbVersion);

        // v30 stores check
        const hasQuestionExplanations = db.tables.some(t => t.name === 'question_explanations');
        const hasChoiceExplanations = db.tables.some(t => t.name === 'choice_explanations');
        console.log('question_explanations_exists:', hasQuestionExplanations);
        console.log('choice_explanations_exists:', hasChoiceExplanations);

        // Counts
        const qeCount = hasQuestionExplanations ? await db.question_explanations.count() : 'N/A';
        const ceCount = hasChoiceExplanations ? await db.choice_explanations.count() : 'N/A';
        console.log('question_explanations_count:', qeCount);
        console.log('choice_explanations_count:', ceCount);

        // Existing DB
        const hqiCount = await db.high_quality_input_units.count();
        console.log('high_quality_input_units_count:', hqiCount);

        const allSourceQuestions = await db.source_questions.toArray();
        const sqChintai = allSourceQuestions.filter(q => q.exam_type === 'chintai').length;
        const sqTakken = allSourceQuestions.filter(q => q.exam_type === 'takken').length;

        const allSourceChoices = await db.source_choices.toArray();
        const sqChintaiIds = allSourceQuestions.filter(q => q.exam_type === 'chintai').map(q => q.id);
        const scChintai = allSourceChoices.filter(c => sqChintaiIds.includes(c.question_id)).length;

        const sqTakkenIds = allSourceQuestions.filter(q => q.exam_type === 'takken').map(q => q.id);
        const scTakken = allSourceChoices.filter(c => sqTakkenIds.includes(c.question_id)).length;

        console.log('source_questions_chintai:', sqChintai);
        console.log('source_choices_chintai:', scChintai);
        console.log('source_questions_takken:', sqTakken);
        console.log('source_choices_takken:', scTakken);

        const studyEventsCount = await db.study_events.count();
        console.log('study_events_count:', studyEventsCount);
        console.log('study_events_readable:', studyEventsCount >= 0);

        // Judgment
        const isPass =
            dbVersion === 30 &&
            hasQuestionExplanations &&
            hasChoiceExplanations &&
            qeCount === 0 &&
            ceCount === 0 &&
            hqiCount === 20 &&
            sqChintai === 500 &&
            scChintai === 2000 &&
            sqTakken === 1024 &&
            scTakken === 1024;

        console.log('=== Result ===');
        console.log(isPass ? 'A - v30実行時確認PASS' : 'C - 停止・修正優先');
        console.log('Details:', {
            dexie_version: dbVersion,
            version_upgrade_success: dbVersion === 30,
            question_explanations_exists: hasQuestionExplanations,
            choice_explanations_exists: hasChoiceExplanations,
            question_explanations_count: qeCount,
            choice_explanations_count: ceCount,
            high_quality_input_units_count: hqiCount,
            source_questions_chintai: sqChintai,
            source_choices_chintai: scChintai,
            source_questions_takken: sqTakken,
            source_choices_takken: scTakken,
            study_events_readable: studyEventsCount >= 0
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
