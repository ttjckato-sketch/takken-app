/**
 * Extract sample cards for audit
 */
const Dexie = require('dexie');

async function extractSamples() {
  const db = new Dexie('TakkenOS_DB');
  db.version(29).stores({
    understanding_cards: 'card_id, category, *tags, exam_type',
    source_choices: 'id, question_id, option_no, text, is_exam_correct_option'
  });

  await db.open();

  // Get sample cards
  const allCards = await db.understanding_cards
    .where('exam_type')
    .equals('chintai')
    .limit(20)
    .toArray();

  console.log(`\n📊 Sample Cards (${allCards.length}):`);
  console.log('='.repeat(70));

  for (const card of allCards) {
    console.log(`\n【${card.card_id}】`);
    console.log(`Category: ${card.category}`);
    console.log(`Tags: ${card.tags?.join(', ') || 'none'}`);
    console.log(`Question: ${card.sample_question || 'N/A'}`);
    console.log(`Answer: ${card.sample_answer ?? 'N/A'}`);
    console.log(`is_statement_true: ${card.is_statement_true ?? 'null'}`);
    console.log(`Exam Type: ${card.exam_type || 'N/A'}`);
  }

  // Check which cards have matching InputUnits
  const { TAKKEN_PROTOTYPE_UNITS } = require('./src/utils/inputUnitPrototypes.ts');

  console.log('\n\n🔍 InputUnit Matching Check:');
  console.log('='.repeat(70));

  for (const card of allCards.slice(0, 10)) {
    const tags = card.tags || [];
    const category = card.category;

    let matchFound = false;
    let matchReason = '';
    let matchScore = 0;

    // Tag matching
    for (const unit of TAKKEN_PROTOTYPE_UNITS) {
      const matchCount = unit.linked_tags.filter(ut => tags.includes(ut)).length;
      if (matchCount > 0) {
        matchFound = true;
        matchReason = `tag (${matchCount} matches)`;
        matchScore = Math.max(matchScore, matchCount);
      }
    }

    // Category matching
    if (!matchFound) {
      for (const unit of TAKKEN_PROTOTYPE_UNITS) {
        if (unit.category === category || unit.title.includes(category)) {
          matchFound = true;
          matchReason = 'category';
          matchScore = 50;
          break;
        }
      }
    }

    console.log(`\n${card.card_id}:`);
    console.log(`  Match: ${matchFound ? '✅' : '❌'} ${matchReason}`);
    console.log(`  Tags: ${tags.join(', ')}`);
    console.log(`  Category: ${category}`);
  }

  await db.close();
}

extractSamples().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
