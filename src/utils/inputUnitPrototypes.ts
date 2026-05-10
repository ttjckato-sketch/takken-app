import { InputUnit } from '../types/inputUnit';
import { db } from '../db';

/**
 * P40: Input Unit Prototype Data (宅建・賃貸管理)
 * 法律内容の推測生成を禁止し、法的根拠 (source_trace) を必須とする。
 * 2026-05-03: カテゴリ正規化実施済み (宅建業法, 権利関係, 法令上の制限, 税・その他, 賃貸管理士, 共通/横断)
 */

export const TAKKEN_PROTOTYPE_UNITS: InputUnit[] = [
    {
        unit_id: 'unit_rights_fraud_coercion_001',
        title: '詐欺・強迫（民法96条）',
        category: '権利関係',
        conclusion: '詐欺も強迫も取り消せるが、第三者保護は詐欺だけ問題になる。強迫取消しは善意無過失の第三者にも対抗できる。',
        purpose: '本人の意思決定の自由を保護しつつ、取引の安全（第三者の信頼）との調和を図るため。',
        requirements: [
            '詐欺：欺罔行為（だますこと）により、本人が錯誤に陥り、意思表示をすること',
            '強迫：害悪を告知され、畏怖（おそれること）により、意思表示をすること'
        ],
        legal_effect: '瑕疵ある意思表示として、取り消すことができる。',
        principle: '詐欺・強迫を受けた者は、その意思表示を取り消すことができる。',
        exceptions: [
            '詐欺：善意無過失の第三者には取消しを対抗できない',
            '強迫：善意無過失の第三者に対しても取消しを対抗できる'
        ],
        cases: {
            concrete_example: 'AがBにだまされて土地を売り、Bが事情を知らない善意無過失のCに転売した場合、AはCに土地を返せと言えない。',
            counter_example: 'AがBに脅されて土地を売り、Bが事情を知らない善意無過失のCに転売した場合、AはCに土地を返せと言える。'
        },
        comparison: [
            { target_tag: '虚偽表示', difference: '虚偽表示は最初から「無効」。詐欺・強迫は「取り消すまでは有効」。' }
        ],
        trap_points: [
            '「強迫による取消しは、善意無過失の第三者に対抗できない」とする誤り',
            '「第三者による詐欺は、相手方が善意無過失でも取り消せる」とする誤り'
        ],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '詐欺と強迫の決定的な違い',
            columns: ['詐欺（96条1項）', '強迫（96条1項）'],
            rows: [
                {
                    label: '当事者間',
                    cells: ['取り消せる', '取り消せる'],
                    emphasis: 'neutral'
                },
                {
                    label: '第三者詐欺・強迫',
                    cells: ['相手方が悪意または有過失なら取消可', '相手方の状態を問わず常に取消可'],
                    emphasis: 'rule'
                },
                {
                    label: '取消前の第三者',
                    cells: ['善意無過失の第三者には対抗不可', '善意無過失の第三者にも対抗できる'],
                    emphasis: 'trap'
                }
            ]
        },
        case_patterns: [
            {
                title: '第三者による詐欺（96条2項）',
                situation: 'Aが、Cにだまされて、Bとの間で契約を締結した場合。',
                conclusion: '相手方BがCの詐欺を「知っていた」か「知ることができた」なら取り消せる。',
                reason: '相手方Bが潔白（善意無過失）なら、Bの信頼を優先してAの取消しを制限する。',
                exam_signal: '「第三者CがAを騙し」「AがBと契約」という3人が登場するパターン'
            }
        ],
        trap_details: [
            {
                trap: '強迫も詐欺と同じく善意の第三者を保護すると思い込む',
                why_wrong: '民法は、だまされた側にも一定の落ち度がある詐欺と、完全に自由を奪われた強迫を区別している。',
                correct_rule: '強迫取消しは、絶対的に保護される。善意無過失の第三者にも対抗できる。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「強迫」の2文字',
                check: '即座に「最強の保護」モードへ切り替える',
                answer_pattern: '第三者が善意だろうが、相手方が善意だろうが「取り消せる・対抗できる」が正解。'
            }
        ],
        memory_hook: '「詐欺はサヨナラ（善意無過失に対抗不可）、強迫はキョウレツ（誰にでも対抗可）」',
        check_question: {
            question: 'AがBの強迫により土地を売却し、Bがその土地を善意無過失のCに転売した場合、AはCに対して土地の返還を請求できる。',
            answer: '○',
            explanation: '強迫による取消しは、善意無過失の第三者に対しても対抗することができます。'
        },
        repair_explanation: {
            short_note: '強迫は詐欺より保護が強い！相手や第三者の善意無過失は関係ありません。',
            common_mistake: '詐欺（96条3項）の「善意無過失の第三者に対抗できない」というルールを強迫にも適用してしまうミス。'
        },
        linked_tags: ['詐欺', '強迫', '民法96条'],
        linked_output_modes: ['active_recall', 'memory_recall', 'trap_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '第96条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_jusetsu_35_vs_37',
        title: '35条書面 vs 37条書面',
        category: '宅建業法',
        conclusion: '35条は「契約前・スペック説明」、37条は「契約後・合意書面」。',
        purpose: '情報の非対称性解消と合意内容の証拠化。',
        requirements: ['35条：契約成立までに説明', '37条：契約成立後、遅滞なく交付'],
        legal_effect: '義務違反は業務停止処分等の対象。',
        principle: '35条は買主のみ、37条は両当事者。',
        exceptions: ['業者間取引：35条の説明は不要（交付のみ）、37条は省略不可'],
        cases: {
            concrete_example: '代金の支払時期は37条の必要的記載事項だが、35条では任意。',
            counter_example: '登記の移転時期は35条では不要だが、37条（売買）では必須。'
        },
        comparison: [],
        trap_points: ['「引渡し時期」を35条の必須事項とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '35条と37条の違い',
            columns: ['35条書面', '37条書面'],
            rows: [
                { label: 'タイミング', cells: ['契約成立まで', '契約成立後'], emphasis: 'rule' },
                { label: '相手方', cells: ['買主・借主のみ', '両当事者'], emphasis: 'trap' }
            ]
        },
        check_question: {
            question: '35条書面の説明は、相手方が宅建業者である場合、省略することができる。',
            answer: '○',
            explanation: '業者間取引では35条の説明は不要です。'
        },
        repair_explanation: {
            short_note: '35条（前）と37条（後）の役割の違いを覚えましょう。',
            common_mistake: '業者間なら37条も不要と思い込むミス。'
        },
        linked_tags: ['35条書面', '37条書面', '比較'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法35,37条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_lease_hikaku_master',
        title: '普通借家 vs 定期借家',
        category: '権利関係',
        conclusion: '普通は更新あり、定期は更新なし。',
        purpose: '居住の安定と柔軟な活用の両立。',
        requirements: ['定期：書面と事前説明が必要'],
        legal_effect: '要件を欠くと普通借家として扱われる。',
        principle: '定期借家は期間満了で確定終了。',
        exceptions: ['居住用200㎡未満の中途解約特例'],
        cases: {
            concrete_example: '2年間の期限付きで貸す場合は定期借家。',
            counter_example: '事前説明を怠ると普通借家になる。'
        },
        comparison: [],
        trap_points: ['「定期借家は公正証書必須」とする誤り（書面なら可）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '借家契約比較',
            columns: ['普通借家', '定期借家'],
            rows: [
                { label: '更新', cells: ['あり', 'なし（確定終了）'], emphasis: 'rule' },
                { label: '契約方法', cells: ['自由（口頭可）', '書面が必要'], emphasis: 'trap' }
            ]
        },
        check_question: {
            question: '定期建物賃貸借契約を締結するには、公正証書による書面でなければならない。',
            answer: '×',
            explanation: '公正証書以外の書面でも有効です。'
        },
        repair_explanation: {
            short_note: '定期借家は「書面」が絶対条件です。',
            common_mistake: '公正証書必須と思い込むミス。'
        },
        linked_tags: ['借地借家法', '定期借家'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '366AC0000000090', text: '借地借家法38条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_sublease_master',
        title: 'サブリース（特定賃貸借）',
        category: '賃貸管理士',
        conclusion: '業者によるリスク説明と誇大広告禁止が鉄則。',
        purpose: 'オーナー保護とトラブル防止。',
        requirements: ['事前の重説が必要'],
        legal_effect: '違反には業務停止処分等。',
        principle: 'オーナーがプロでも重説は省略不可。',
        exceptions: ['なし（全オーナー対象）'],
        cases: {
            concrete_example: '家賃減額リスクを隠して勧誘するのは誇大広告。',
            counter_example: '業者も借主なので家賃減額請求は可能。'
        },
        comparison: [],
        trap_points: ['「サブリースならオーナーはいつでも解約できる」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '管理受託 vs サブリース',
            columns: ['管理受託', 'サブリース'],
            rows: [
                { label: '性質', cells: ['代行（委任）', '転貸（賃貸借）'], emphasis: 'rule' }
            ]
        },
        check_question: {
            question: 'サブリース業法における重要事項説明は、オーナーが宅建業者であれば省略できる。',
            answer: '×',
            explanation: '業者間でも重説は必須です。'
        },
        repair_explanation: {
            short_note: 'サブリースは全オーナーを保護します。',
            common_mistake: '宅建業法のルールを混同するミス。'
        },
        linked_tags: ['サブリース', '賃貸住宅管理業法'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '402AC0000000060', text: '賃貸住宅管理業法' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_dev_permission_flow',
        title: '開発許可判定フロー',
        category: '法令上の制限',
        conclusion: '場所と規模でフィルターをかけ、知事の許可が必要か判定する。',
        purpose: '秩序ある街づくり。',
        requirements: ['区画形質の変更'],
        legal_effect: '無許可工事は停止命令対象。',
        principle: '市街化区域は1000㎡以上。調整区域は原則許可。',
        exceptions: ['公益目的（駅・図書館）は不要'],
        cases: {
            concrete_example: '調整区域で50㎡の住宅を建てる際も原則許可が必要。',
            counter_example: '市街化区域で500㎡の造成なら許可不要。'
        },
        comparison: [],
        trap_points: ['「市街化区域ならどんな規模でも許可不要」とする誤り'],
        understanding_visual: {
            type: 'case_flow',
            title: '判定の3ステップ',
            columns: ['STEP', '判定'],
            rows: [
                { label: '1. 目的', cells: ['公益目的？', 'YESなら不要'], emphasis: 'neutral' },
                { label: '2. 場所', cells: ['市街化調整区域？', 'YESなら原則必要'], emphasis: 'trap' },
                { label: '3. 規模', cells: ['市街化区域で1000㎡以上？', 'YESなら必要'], emphasis: 'rule' }
            ]
        },
        check_question: {
            question: '市街化調整区域内の開発行為は、面積に関わらず原則として開発許可が必要である。',
            answer: '○',
            explanation: '調整区域は開発を抑制する場所なので、規模に関わらず許可が必要です。'
        },
        repair_explanation: {
            short_note: '調整区域は面積例外なし、と覚えましょう。',
            common_mistake: '1000㎡以下なら不要と思い込むミス。'
        },
        linked_tags: ['都市計画法', '開発許可'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '343AC0000000100', text: '都市計画法29条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_condo_resolution_master',
        title: '区分所有法：決議要件',
        category: '権利関係',
        conclusion: '過半数、3/4、4/5の3段階。',
        purpose: 'マンションの民主的運営。',
        requirements: ['集会の決議'],
        legal_effect: '全員に拘束力。',
        principle: '普通決議は過半数。',
        exceptions: ['規約変更は3/4、建て替えは4/5'],
        cases: {
            concrete_example: '規約の変更には3/4以上の賛成が必要。',
            counter_example: '管理者の選任は過半数でOK。'
        },
        comparison: [],
        trap_points: ['「規約変更は4/5」とする誤り（正解は3/4）'],
        understanding_visual: {
            type: 'rule_table',
            title: '決議要件まとめ',
            columns: ['内容', '要件'],
            rows: [
                { label: '普通', cells: ['管理者選任', '過半数'], emphasis: 'neutral' },
                { label: '特別', cells: ['規約変更', '3/4'], emphasis: 'rule' },
                { label: '最重要', cells: ['建て替え', '4/5'], emphasis: 'trap' }
            ]
        },
        check_question: {
            question: '管理組合の規約の変更には、区分所有者および議決権の各4分の3以上の決議が必要である。',
            answer: '○',
            explanation: '規約変更は特別決議事項です。'
        },
        repair_explanation: {
            short_note: '3/4（規約）と4/5（建て替え）を区別しましょう。',
            common_mistake: '数字の取り違え。'
        },
        linked_tags: ['区分所有法', '決議'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '337AC0000000069', text: '区分所有法' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_money_management_master',
        title: '金銭管理（分別管理の徹底）',
        category: '賃貸管理士',
        conclusion: '管理業者は「自分の金」と「預かった金」を明確に分け、毎月速やかに送金・報告する義務がある。',
        purpose: 'オーナーの資産（賃料等）の安全を確保し、業者の流用を防止するため。',
        requirements: ['管理受託契約の締結', '専用口座の開設（受託資産口等）'],
        legal_effect: '分別管理を怠ると、業務停止処分や免許取消しの対象となる。',
        principle: '自己の固有財産と分別して管理しなければならない。',
        exceptions: ['特になし（強行規定）'],
        cases: {
            concrete_example: 'オーナーAから預かった家賃を、業者の会社の運転資金用口座に入れておくのは分別管理違反。',
            counter_example: '受託資産口という名称の専用口座を作り、毎月の管理料だけを自社口座へ移すのは正しい。'
        },
        comparison: [],
        trap_points: ['「オーナーの同意があれば、自分の口座で混ぜて管理してよい」とする誤り'],
        
        understanding_visual: {
            type: 'rule_table',
            title: '金銭管理の3大原則',
            columns: ['項目', '遵守すべきルール'],
            rows: [
                {
                    label: '分別管理',
                    cells: ['自己の固有財産と明確に区分けした「受託資産口」等の口座で管理', '流用は一切禁止'],
                    emphasis: 'rule'
                },
                {
                    label: '送金期限',
                    cells: ['原則として、受領した月の翌月末までに送金', '契約の定めに従い遅滞なく実施'],
                    emphasis: 'neutral'
                },
                {
                    label: '定期報告',
                    cells: ['管理業務の実施状況を記した書面を毎月交付', '収支明細の正確な記載'],
                    emphasis: 'rule'
                }
            ]
        },
        trap_details: [
            {
                trap: '「管理会社が預かっている間は、自由に資金運用してもよい」と思い込む',
                why_wrong: '預り金はあくまでオーナーの財産であり、一時的な保管に過ぎない。',
                correct_rule: 'いかなる理由があっても、受託資産を自社の目的で消費・運用してはならない。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「オーナーの承諾」というキーワード',
                check: '分別管理義務の免除に使われていないか確認',
                answer_pattern: '分別管理は「強行規定」なので、オーナーが「混ぜていいよ」と言っても免除されない。'
            }
        ],
        check_question: {
            question: '管理業者は、受領した家賃等について、自己の固有財産と分別して管理しなければならない。',
            answer: '○',
            explanation: '分別管理は賃貸住宅管理業法16条により義務付けられています。'
        },
        repair_explanation: {
            short_note: '混ぜるな危険。預り金は「神聖な他人の金」として扱います。',
            common_mistake: '合意があれば合算可能、とするひっかけに騙されるミス。'
        },
        linked_tags: ['分別管理', '賃貸住宅管理業法'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '402AC0000000060', text: '賃貸管理業法16条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_tax_hikaku_master',
        title: '不動産取得税 vs 固定資産税',
        category: '税・その他',
        conclusion: '取得税は「一度・県」、固定資産税は「毎年・市町村」。',
        purpose: '流通と保有の課税。',
        requirements: ['取得（取得税）', '1/1保有（固定資産税）'],
        legal_effect: '納税義務の発生。',
        principle: '相続は取得税非課税。',
        exceptions: ['免税点（30万・20万）'],
        cases: {
            concrete_example: '相続でもらった家には取得税はかからない。',
            counter_example: '買った家には取得税（一度）と固定資産税（毎年）の両方がかかる。'
        },
        comparison: [],
        trap_points: ['「相続でも不動産取得税がかかる」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '税目比較',
            columns: ['取得税', '固定資産税'],
            rows: [
                { label: '主体', cells: ['都道府県', '市町村'], emphasis: 'rule' },
                { label: '回数', cells: ['一度きり', '毎年'], emphasis: 'neutral' },
                { label: '相続', cells: ['非課税', '課税'], emphasis: 'trap' }
            ]
        },
        check_question: {
            question: '不動産取得税は、相続によって不動産を取得した場合には課税されない。',
            answer: '○',
            explanation: '相続は非課税事項です。'
        },
        repair_explanation: {
            short_note: '相続＝非課税（取得税）、と覚えましょう。',
            common_mistake: '贈与（課税）との混同。'
        },
        linked_tags: ['税金', '不動産取得税'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '325AC0000000226', text: '地方税法' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_registration_master',
        title: '登記の効力（対抗力 vs 公信力）',
        category: '権利関係',
        conclusion: '日本は「対抗要件主義」。先に登記を備えた方が勝つが、登記に「公信力」はないため、信じても真の権利がなければ保護されない。',
        purpose: '公示制度を通じて、不動産取引の安全と第三者への対抗関係を明確にする。',
        requirements: ['登記申請', '登記簿への正確な記載'],
        legal_effect: '第三者に対して、自己の権利を主張（対抗）できるようになる。',
        principle: '二重譲渡の場合、善意・悪意を問わず、先に登記をした者が優先される（177条）。',
        exceptions: ['背信的悪意者（単なる悪意を超えて、嫌がらせ目的等の者）には登記なしでも対抗できる'],
        cases: {
            concrete_example: 'Aが土地をBに売り、次にCに売った。Bが先に登記すれば、Cがどれだけ事情を知っていてもBが勝つ。',
            counter_example: '登記を信じて土地を買っても、真の所有者が別にいた場合、買った人は所有権を取得できない（公信力なし）。'
        },
        comparison: [],
        trap_points: ['「日本には登記の公信力がある」と思い込むミス'],

        understanding_visual: {
            type: 'comparison_matrix',
            title: '登記が持つ力・持たない力',
            columns: ['対抗力 (Confrontation)', '公信力 (Public Reliance)'],
            rows: [
                {
                    label: '意味',
                    cells: ['第三者に権利を主張できる', '登記を信じた者が保護される'],
                    emphasis: 'neutral'
                },
                {
                    label: '日本の制度',
                    cells: ['あり（177条）', 'なし'],
                    emphasis: 'rule'
                },
                {
                    label: '結論',
                    cells: ['先に登記した者が勝つ', '偽の登記を信じても救われない'],
                    emphasis: 'trap'
                }
            ]
        },
        trap_details: [
            {
                trap: '「善意無過失で登記を信じて買ったなら、絶対守られる」と考える',
                why_wrong: '動産（動く物）には公信力があるが、不動産の登記には公信力が認められていない。',
                correct_rule: '登記が真実の権利関係と一致していない場合、登記を信じても権利を取得できないのが日本の原則。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「登記を信頼して」という表現',
                check: '公信力を試すひっかけではないか確認',
                answer_pattern: '不動産登記には公信力がない、という前提で正誤を判断する。'
            }
        ],
        check_question: {
            question: '不動産登記には公信力がないため、登記名義人が真実の権利者でない場合、その登記を信頼して取引をした者は必ずしも保護されない。',
            answer: '○',
            explanation: '日本の不動産登記には、登記の内容が真実であると信頼して取引した者を保護する「公信力」はありません。'
        },
        repair_explanation: {
            short_note: '「登記は早い者勝ち、でも絶対ではない（公信力なし）」が日本の不動産ルールの核心です。',
            common_mistake: '登記があれば100%安心、と勘違いしてしまうミス。'
        },
        linked_tags: ['不動産登記法', '対抗要件', '民法177条'],
        linked_output_modes: ['active_recall', 'trap_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法177条, 不動産登記法' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_genjo_kaifuku_gl',
        title: '原状回復のガイドライン（負担区分の基本）',
        category: '賃貸管理士',
        conclusion: '経年劣化・通常損耗は「大家負担」、故意・過失・善管注意義務違反は「店借人負担」が鉄則。',
        purpose: '退去時の修繕費用負担をめぐる紛争を防止するため、標準的な考え方を示す。',
        requirements: [
            '賃貸借契約の終了・明渡し',
            '損耗・毀損の発生原因の特定'
        ],
        legal_effect: 'ガイドラインに法的拘束力はないが、裁判所は特約の有効性判断の基準とする。',
        principle: '通常の生活でできる汚れ（日焼け、家具の設置跡）は賃料に含まれており、大家が直す。',
        exceptions: [
            '特約：店借人に不利な特約でも、内容が具体的であり、合意が成立していれば有効となる場合がある。'
        ],
        cases: {
            concrete_example: 'タバコのヤニ汚れや壁の落書きは、通常損耗を超えており、店借人の負担となる。',
            counter_example: '冷蔵庫の裏の電気焼け（黒ずみ）は、通常損耗とみなされ、大家の負担となる。'
        },
        comparison: [],
        trap_points: ['「耐用年数を超えれば、わざと壊しても負担ゼロ」とする誤り'],
        
        understanding_visual: {
            type: 'rule_table',
            title: '誰が払う？修繕費用負担マトリクス',
            columns: ['貸主（オーナー）負担', '借主（入居者）負担'],
            rows: [
                {
                    label: '壁紙（クロス）',
                    cells: ['日焼け、電気焼け（黒ずみ）', 'タバコのヤニ、落書き、釘穴'],
                    emphasis: 'rule'
                },
                {
                    label: '床（ボード等）',
                    cells: ['家具の設置跡、ワックスがけ', '引越し時のキズ、飲みこぼしの放置'],
                    emphasis: 'rule'
                },
                {
                    label: '水回り・設備',
                    cells: ['耐用年数経過による故障', '掃除不足によるカビ・水垢の固着'],
                    emphasis: 'trap'
                }
            ]
        },
        trap_details: [
            {
                trap: '原状回復とは「借りた時と全く同じ新品状態に戻すこと」だと思い込む',
                why_wrong: '賃料には「通常使って古くなる分」の対価が含まれているため、新品に戻す必要はない。',
                correct_rule: '借主の義務は、あくまで「借りた当時の状態」ではなく「通常の使用による損耗を除いた状態」に戻すこと。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「クリーニング特約」の有無',
                check: '金額や範囲が具体的か、説明がなされているかを確認',
                answer_pattern: '具体的で合意があれば、通常損耗分でも借主負担とする特約は有効。'
            }
        ],
        check_question: {
            question: '通常の使用で生じた壁紙の日焼けの張替え費用は、原則として貸主が負担すべきとされる。',
            answer: '○',
            explanation: '通常損耗や経年変化による修繕費用は、賃料に含まれると考えられ、貸主が負担するのが原則です。'
        },
        repair_explanation: {
            short_note: '「うっかり・わざと・掃除不足」は入居者、それ以外は大家。',
            common_mistake: '自然な劣化まで借主負担としてしまうミス。'
        },
        linked_tags: ['原状回復', 'ガイドライン', '修繕'],
        linked_output_modes: ['active_recall', 'trap_recall'],
        source_trace: [{ type: 'official_guide', id: 'MLIT_GL', text: '原状回復をめぐるトラブルとガイドライン（国交省）' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_mistake_vs_fraud',
        title: '錯誤 vs 詐欺',
        category: '権利関係',
        conclusion: '錯誤は「自分ひとりの勘違い」、詐欺は「相手にだまされた」。錯誤では自分の重過失が、詐欺では相手の悪意がカギ。',
        purpose: '意思表示の欠陥を整理し、表意者保護と取引の安全のバランスを理解する。',
        requirements: ['錯誤：要素の錯誤があること', '詐欺：欺罔行為と因果関係があること'],
        legal_effect: 'いずれも取り消すことができる。',
        principle: '表意者は取消しを主張できる。',
        exceptions: ['錯誤：表意者に重過失がある場合は原則取消不可', '詐欺：善意無過失の第三者には対抗不可'],
        cases: {
            concrete_example: 'Aが土地の価格を1桁間違えて申し込んだ（錯誤）。BがAをだまして相場より安く買わせた（詐欺）。',
            counter_example: '錯誤があっても、相手方BがAの錯誤を知っていた場合は、Aに重過失があっても取り消せる。'
        },
        comparison: [{ target_tag: '詐欺', difference: '詐欺は他意による欠陥。錯誤は自らの認識のズレ。' }],
        trap_points: ['「錯誤には第三者保護がない」とする誤り（錯誤も善意無過失の第三者に対抗不可）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '錯誤と詐欺の決定的な違い',
            columns: ['錯誤 (95条)', '詐欺 (96条)'],
            rows: [
                { label: '欠陥の原因', cells: ['自分の勘違い', '相手の欺罔（だまし）'], emphasis: 'neutral' },
                { label: '表意者の重過失', cells: ['原則、取消不可になる', '重過失があっても取消可'], emphasis: 'rule' },
                { label: '第三者保護', cells: ['善意無過失なら保護', '善意無過失なら保護'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '錯誤による取消しは、詐欺と違って第三者に対抗できると思い込む',
                why_wrong: '民法改正により、錯誤による取消しも善意無過失の第三者に対抗できなくなった。',
                correct_rule: '錯誤も詐欺も、善意無過失の第三者には勝てない。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「重過失」という語',
                check: '錯誤の問題なら取消しを封じる材料、詐欺なら無視してよい。',
                answer_pattern: '錯誤 ＋ 重過失 ＝ 取消不可（相手が知っていた場合等を除く）。'
            }
        ],
        check_question: {
            question: '表意者に重大な過失があった場合でも、相手方が表意者に錯誤があることを知っていたときは、錯誤による取消しを主張できる。',
            answer: '○',
            explanation: '表意者に重過失があっても、相手方が悪意または共通錯誤の場合は取り消せます。'
        },
        repair_explanation: {
            short_note: '錯誤は「自分のミス」なので重過失チェックが厳しい。詐欺は「相手が悪い」ので緩い。',
            common_mistake: '第三者保護のルールを錯誤と詐欺で別々に覚えてしまうミス。'
        },
        linked_tags: ['錯誤', '詐欺', '意思表示'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法95条, 96条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_rescission_vs_cancellation',
        title: '解除 vs 取消し',
        category: '権利関係',
        conclusion: '取消しは「成立時のキズ（詐欺等）」を理由に、解除は「成立後のトラブル（債務不履行等）」を理由にする。',
        purpose: '契約が消滅する2つのパターンの原因と効果の違いを明確にする。',
        requirements: ['取消し：詐欺・強迫・制限能力・錯誤', '解除：債務不履行・解除権の行使'],
        legal_effect: 'いずれも遡及的に無効となる。',
        principle: '初めから無効であったものとみなされる。',
        exceptions: ['解除：原状回復義務があるが、第三者の権利を害することはできない'],
        cases: {
            concrete_example: 'Aが未成年者で親の同意なく売った（取消し）。Bが代金を払わない（解除）。',
            counter_example: '解除の前の第三者は、登記を備えていれば善意・悪意を問わず保護される場合がある。'
        },
        comparison: [],
        trap_points: ['「どちらも遡及効があるので違いはない」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '解除と取消しの比較',
            columns: ['取消し', '解除'],
            rows: [
                { label: '原因の発生時', cells: ['契約成立時（原始的）', '契約成立後（後発的）'], emphasis: 'rule' },
                { label: '主な理由', cells: ['詐欺、錯誤、制限能力', '債務不履行、合意'], emphasis: 'neutral' },
                { label: '原状回復', cells: ['不当利得返還（現存利益）', '原状回復義務（受領時基準）'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '解除と取消しの原状回復の範囲は同じだと考える',
                why_wrong: '取消し（特に制限能力）は「現に利益を受けている限度」だが、解除は「もらったもの全部（＋利息）」を返す。',
                correct_rule: '解除の方が原状回復の範囲が明確で厳しい。'
            }
        ],
        check_question: {
            question: '債務不履行を理由とする契約の解除は、第三者の権利を害することができない。',
            answer: '○',
            explanation: '民法545条1項但書の規定です。解除前の第三者は登記等があれば保護されます。'
        },
        repair_explanation: {
            short_note: '「最初からダメだった」のが取消し。「後からダメになった」のが解除。',
            common_mistake: '第三者保護の要件（登記の有無）を混同するミス。'
        },
        linked_tags: ['解除', '取消し', '原状回復'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法121条, 541条, 545条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_agency_vs_unauthorized',
        title: '代理 vs 無権代理',
        category: '権利関係',
        conclusion: '代理は「権限あり＋顕名」で本人に効果がいく。無権代理は「権限なし」で本人が追認しない限り本人には関係ない。',
        purpose: '代理制度の基本構造と、勝手に代理された場合の処理（無権代理）を理解する。',
        requirements: ['代理：代理権 ＋ 顕名 ＋ 代理行為', '無権代理：代理権がない状態での代理行為'],
        legal_effect: '代理：本人に効果帰属。無権代理：本人が追認すれば帰属、しなければ不帰属。',
        principle: '本人が認めた（追認した）ときだけ、本人の契約になる。',
        exceptions: ['表見代理：無権代理だが、一定の条件で本人に効果を及ぼす'],
        cases: {
            concrete_example: 'AがBに委任状を渡した（代理）。BがAの委任状を偽造した（無権代理）。',
            counter_example: '顕名がない場合、原則として代理人自身のためにしたものとみなされる。'
        },
        comparison: [],
        trap_points: ['「無権代理は当然に無効である」とする誤り（「本人に効果が及ばない」だけであり、追認の余地がある）'],
        understanding_visual: {
            type: 'case_flow',
            title: '代理が成立するまでのステップ',
            columns: ['フェーズ', 'チェックポイント'],
            rows: [
                { label: '1. 権限の確認', cells: ['本人から代理権をもらったか？', 'NOなら無権代理'], emphasis: 'neutral' },
                { label: '2. 顕名 (けんめい)', cells: ['「本人のためにする」と示したか？', 'NOなら代理人の契約'], emphasis: 'rule' },
                { label: '3. 効果帰属', cells: ['本人の契約として成立', '責任は本人に発生'], emphasis: 'rule' }
            ]
        },
        trap_details: [
            {
                trap: '代理人が自分の利益のために着服した場合、本人は常に無効を主張できる',
                why_wrong: '代理権濫用の場合でも、相手方が善意無過失なら本人は責任を負う。',
                correct_rule: '相手方が悪意または有過失なら、無権代理とみなされる。'
            }
        ],
        check_question: {
            question: '無権代理人が締結した契約について、本人が追認を拒絶した場合、その後は本人が追認しても効力は生じない。',
            answer: '○',
            explanation: '一度追認を拒絶すると、もはや追認することはできません。'
        },
        repair_explanation: {
            short_note: '代理は「委任状と名乗り（顕名）」がセット。無ければ本人は関係なし。',
            common_mistake: '無権代理の相手方の「催告権」と「取消権」の要件（善意・悪意）の混同。'
        },
        linked_tags: ['代理', '無権代理', '追認'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法99条, 113条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_apparent_agency_types',
        title: '表見代理の3類型',
        category: '権利関係',
        conclusion: '本人が「代理権があるようなフリ」をした場合、信じた相手方を守るために本人が責任を負う例外。',
        purpose: '無権代理の中でも、本人に落ち度がある場合の責任追及を整理する。',
        requirements: ['相手方の善意無過失', '本人の帰責事由（原因を作ったこと）'],
        legal_effect: '無権代理であるにもかかわらず、本人に効果が帰属する。',
        principle: '相手方が表見代理を主張すれば、本人は履行を拒めない。',
        exceptions: ['本人が先に追認拒絶し、相手方が履行請求も取消しもしていない場合は個別判断'],
        cases: {
            concrete_example: '委任状を白紙で渡してしまい、勝手な内容を書かれた（110条：権限外の行為）。',
            counter_example: '単に勝手に印鑑を盗まれただけでは、本人に原因がないため表見代理は成立しにくい。'
        },
        comparison: [],
        trap_points: ['「相手方が悪意でも、本人が悪いなら成立する」とする誤り（相手方は善意無過失必須）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '表見代理のパターン',
            columns: ['109条 (表示)', '110条 (権限外)', '112条 (消滅後)'],
            rows: [
                { label: '本人の落ち度', cells: ['「この人が代理人です」と言った', '基本代理権を超えてやった', '昔は代理人だった'], emphasis: 'neutral' },
                { label: '必要なもの', cells: ['代理権授与の表示', '基本代理権', '過去の代理権'], emphasis: 'rule' },
                { label: '相手方の条件', cells: ['善意無過失', '善意無過失', '善意無過失'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '110条（権限外）は、基本代理権がなくても成立する',
                why_wrong: '110条は「もともとある権限を超えた」ことが前提。何も権限がない場合は成立しない。',
                correct_rule: '公法上の権利（登記申請等）でも基本代理権になり得る。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「解任したあと」',
                check: '112条（消滅後）の表見代理を疑う。',
                answer_pattern: '相手方が知らない（善意無過失）なら、本人は「もう代理人じゃない」と言い訳できない。'
            }
        ],
        check_question: {
            question: '代理権が消滅した後に代理人が行った行為について、相手方が善意無過失であれば、本人が責任を負う。',
            answer: '○',
            explanation: '民法112条の代理権消滅後の表見代理です。'
        },
        repair_explanation: {
            short_note: '「本人がきっかけを作った」＋「相手が信じちゃった（善意無過失）」＝本人の負け。',
            common_mistake: '任意代理だけに限定されると思い込むミス（法定代理でも成立する）。'
        },
        linked_tags: ['表見代理', '代理権消滅', '善意無過失'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法109条, 110条, 112条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_farmland_345',
        title: '農地法3条・4条・5条',
        category: '法令上の制限',
        conclusion: '3条は「農地のまま移転」、4条は「自分で転用」、5条は「転用目的で移転」。',
        purpose: '農地の保護と適切な利用転換を管理し、食料自給基盤を維持する。',
        requirements: ['3条：農地委員会等の許可', '4条：知事等の許可', '5条：知事等の許可'],
        legal_effect: '許可なく行った行為は無効であり、原状回復命令や罰則の対象となる。',
        principle: '農地を宅地にするにはチェックが必要。',
        exceptions: ['市街化区域内：4条・5条は農業委員会への「届出」で足りる（3条は許可のまま）'],
        cases: {
            concrete_example: '農家Aが息子Bに耕作目的で農地を譲る（3条）。Aが自分の農地に自宅を建てる（4条）。',
            counter_example: '市街化区域の農地を駐車場にするために買う場合、5条許可ではなく届出でよい。'
        },
        comparison: [],
        trap_points: ['「市街化区域なら3条も届出でよい」とする誤り（3条は許可必須）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '農地法3・4・5条の整理',
            columns: ['3条 (権利移動)', '4条 (転用)', '5条 (転用＋移動)'],
            rows: [
                { label: '農地の変化', cells: ['農地のまま', '農地以外にする', '農地以外にする'], emphasis: 'neutral' },
                { label: '権利の移動', cells: ['あり', 'なし（自分のまま）', 'あり'], emphasis: 'neutral' },
                { label: '許可権者', cells: ['農業委員会', '知事等', '知事等'], emphasis: 'rule' },
                { label: '市街化区域', cells: ['許可必要', '届出でOK', '届出でOK'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '相続で農地を取得する場合も3条許可が必要だとする',
                why_wrong: '相続は「権利移動」だが、許可は不要（届出は必要）。',
                correct_rule: '国や地方公共団体が取得する場合なども許可不要。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「市街化区域」＋「農地法」',
                check: '3条（農地のまま）か、4・5条（転用）かを真っ先に確認。',
                answer_pattern: '3条なら「許可」、4・5条なら「届出」がキーワード。'
            }
        ],
        check_question: {
            question: '市街化区域内にある農地を宅地に転用するため、所有者が自ら造成を行う場合、あらかじめ農業委員会に届け出れば許可は不要である。',
            answer: '○',
            explanation: '農地法4条の特例です。市街化区域内では届出で足ります。'
        },
        repair_explanation: {
            short_note: '「誰が」「何のために」で3/4/5が決まる。市街化区域は「転用」に甘い。',
            common_mistake: '3条許可の許可権者（知事等ではなく農業委員会）を間違えるミス。'
        },
        linked_tags: ['農地法', '転用', '市街化区域'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '327AC0000000229', text: '農地法3条, 4条, 5条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_mortgage_vs_revolving',
        title: '抵当権 vs 根抵当権',
        category: '権利関係',
        conclusion: '抵当権は「特定の借金」を、根抵当権は「一定範囲の不特定の借金」を、極度額の範囲で担保する。',
        purpose: '継続的な取引における担保設定の利便性と、優先弁済権の範囲を明確にする。',
        requirements: ['抵当権：被担保債権の特定', '根抵当権：債権の範囲、債務者、極度額の定め'],
        legal_effect: '不履行時に、目的物件を競売し優先的に弁済を受ける権利。',
        principle: '抵当権：債権が消えれば抵当権も消える（付従性）。根抵当権：元本確定前は債権が一時的にゼロになっても消えない。',
        exceptions: ['根抵当権：元本確定後は、普通の抵当権と同様の性質（付従性）を持つようになる。'],
        cases: {
            concrete_example: '銀行から1,000万円借りて土地に抵当権をつけた。返済すれば抵当権は消える。',
            counter_example: '商売で何度も借り入れをするため、極度額5,000万円の根抵当権を設定した。一度完済しても根抵当権は残る。'
        },
        comparison: [{ target_tag: '抵当権', difference: '根抵当権は、元本確定前は「極度額」までなら何度でも貸し借りできる。' }],
        trap_points: ['「根抵当権も特定の債権しか担保できない」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '抵当権と根抵当権の決定的な違い',
            columns: ['抵当権', '根抵当権'],
            rows: [
                { label: '担保する債権', cells: ['特定の債権（1つ）', '一定範囲の不特定の債権'], emphasis: 'rule' },
                { label: '付従性 (消滅)', cells: ['強い（完済で消える）', '確定前は弱い（消えない）'], emphasis: 'rule' },
                { label: '限度額', cells: ['債権額の全額', '極度額が上限'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「根抵当権者は、極度額を超えても全額優先弁済を受けられる」と思い込む',
                why_wrong: '根抵当権で優先的に守られるのは、あくまであらかじめ決めた「極度額」まで。',
                correct_rule: '極度額は、利息等も含めたすべての優先弁済の絶対的な上限となる。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「不特定の債権」',
                check: '根抵当権の記述であることを確認。',
                answer_pattern: '極度額の範囲内か、元本確定前かのルールを適用する。'
            }
        ],
        check_question: {
            question: '根抵当権は、元本が確定する前であれば、被担保債権の範囲を変更することができる。',
            answer: '○',
            explanation: '元本確定前であれば、後順位抵当権者の承諾なく、債権の範囲を変更できます。'
        },
        repair_explanation: {
            short_note: '抵当権は「1対1」、根抵当権は「極度額内なら何度でも」という性質の違いが重要。',
            common_mistake: '根抵当権の極度額（枠）を、借入額そのものと混同するミス。'
        },
        linked_tags: ['抵当権', '根抵当権', '担保物権'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法369条, 398条の2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_guarantee_vs_joint',
        title: '保証 vs 連帯保証',
        category: '権利関係',
        conclusion: '普通の保証人は「まずは本人に言え（抗弁権）」と言えるが、連帯保証人は本人と全く同じ重い責任を負う。',
        purpose: '保証債務の強度の違いと、連帯保証人への厳しいルールを理解する。',
        requirements: ['保証契約（書面が必要）', '主債務の存在'],
        legal_effect: '主債務者が支払わない場合、代わって履行する義務。',
        principle: '普通の保証人には、催告の抗弁権、検索の抗弁権、分別の利益が認められる。',
        exceptions: ['連帯保証人には、催告・検索の抗弁権、分別の利益が一切認められない。'],
        cases: {
            concrete_example: '債権者が保証人Aに請求した際、Aが「まずは主債務者Bに請求してくれ」と言えるのが普通の保証。',
            counter_example: '連帯保証人Aは、主債務者Bに資力があっても、請求されたら拒むことができない。'
        },
        comparison: [],
        trap_points: ['「連帯保証人にも、まずは本人に請求するよう求める権利がある」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '保証と連帯保証の責任の重さ',
            columns: ['保証人 (普通)', '連帯保証人'],
            rows: [
                { label: '催告の抗弁権', cells: ['あり（本人に先に言え）', 'なし'], emphasis: 'rule' },
                { label: '検索の抗弁権', cells: ['あり（本人の財産を売れ）', 'なし'], emphasis: 'rule' },
                { label: '分別の利益', cells: ['あり（頭割りでOK）', 'なし（全額責任）'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「保証人が3人いれば、連帯保証人でも3分の1だけ払えばよい」と考える',
                why_wrong: '連帯保証人には「分別の利益」がないため、何人いても全員が全額の責任を負う。',
                correct_rule: '債権者は、どの連帯保証人に対してもいきなり全額を請求できる。'
            }
        ],
        check_question: {
            question: '連帯保証人は、債権者から債務の履行を請求されたときは、まず主債務者に催告すべき旨を請求することができる。',
            answer: '×',
            explanation: '連帯保証人には催告の抗弁権はありません。'
        },
        repair_explanation: {
            short_note: '「連帯」がつくと、本人の盾になる権利（抗弁権）がすべて消滅します。',
            common_mistake: '主債務者が破産していない限り、保証人には請求できないと思い込むミス。'
        },
        linked_tags: ['保証', '連帯保証', '抗弁権'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法446条, 454条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_joint_debt_vs_guarantee',
        title: '連帯債務 vs 保証',
        category: '権利関係',
        conclusion: '連帯債務者は「自分自身の借金」として全員が全額の義務を負う。保証人は「他人の借金」を肩代わりする立場。',
        purpose: '複数の責任者がいる場合の、絶対効・相対効および求償関係を整理する。',
        requirements: ['連帯債務：債務の目的が同一、連帯の特約', '保証：保証契約'],
        legal_effect: '連帯債務：各自が独立して全額の履行義務。保証：補充的な履行義務。',
        principle: '連帯債務：一人の身に起きたこと（免除等）は、原則として他の債務者に影響しない（相対効）。',
        exceptions: ['連帯債務：相殺、混同、更改については例外的に他の債務者にも影響する（絶対効）。'],
        cases: {
            concrete_example: '3人で1,500万円を連帯して借りた。1人が500万払えば、残り2人の債務も1,000万に減る（弁済の絶対効）。',
            counter_example: '保証人は主債務者が弁済すれば義務が消えるが、保証人が弁済しても主債務者の求償関係が残るだけ。'
        },
        comparison: [],
        trap_points: ['「連帯債務者の一人に対する免除は、全員の義務を消滅させる」とする誤り（原則、影響しない）'],
        understanding_visual: {
            type: 'case_flow',
            title: '連帯債務の絶対効・相対効フロー',
            columns: ['事象', '他の債務者への影響'],
            rows: [
                { label: '弁済・相殺・更改', cells: ['債務が消滅する行為', '【絶対効】全員の債務が消える'], emphasis: 'rule' },
                { label: '混同', cells: ['債権者と債務者が同一になる', '【絶対効】全員の債務が消える'], emphasis: 'rule' },
                { label: '免除・時効・請求', cells: ['個別の事情', '【相対効】他の人には影響しない'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '改正前は「免除」も絶対効だったが、現在は「相対効」である',
                why_wrong: '民法改正により、一人の債務が免除されても、他の債務者は依然として全額を負うのが原則となった。',
                correct_rule: '一人の債務者に生じた事由は、弁済等を除き、他の債務者に影響しないのが大原則。'
            }
        ],
        check_question: {
            question: '連帯債務者の一人に対してした債務の免除は、他の連帯債務者に対しても、その効力を生ずる。',
            answer: '×',
            explanation: '免除は相対効であり、他の債務者の債務には影響しません。'
        },
        repair_explanation: {
            short_note: '「一人はみんなのために、みんなは一人のために」動くのは「弁済・相殺・更改・混同」だけ。',
            common_mistake: '改正前のルール（免除の絶対効）を適用してしまうミス。'
        },
        linked_tags: ['連帯債務', '絶対効', '相対効'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法436条〜441条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_contract_non_conformity',
        title: '契約不適合責任',
        category: '権利関係',
        conclusion: '「種類・品質・数量」が契約と違う場合、買主は追完、減額、解除、損害賠償の4つを請求できる。',
        purpose: '目的物の欠陥に対する買主の権利を整理し、売主の責任範囲を明確にする。',
        requirements: ['目的物が契約の内容に適合しないこと', '買主の通知（不適合を知ってから1年以内）'],
        legal_effect: '追完請求、代金減額請求、契約解除、損害賠償。',
        principle: '売主は、過失がなくても追完・減額・解除の責任を負う（無過失責任的側面）。',
        exceptions: ['損害賠償だけは、売主に「過失」がある場合のみ請求できる。'],
        cases: {
            concrete_example: '100㎡と言われて買った土地が実際は80㎡だった（数量不足）。20㎡分の代金減額を請求できる。',
            counter_example: '雨漏りを知りながら1年以上放置して売主に言わなかった場合、もはや責任を追及できない。'
        },
        comparison: [],
        trap_points: ['「売主が無過失であれば、損害賠償も請求できる」とする誤り'],
        understanding_visual: {
            type: 'case_flow',
            title: '不適合を発見したときの請求ステップ',
            columns: ['ステップ', '買主ができること'],
            rows: [
                { label: '1. 追完請求', cells: ['「直してくれ」「足りない分を渡せ」', 'まずは修補や代替物の請求'], emphasis: 'neutral' },
                { label: '2. 代金減額請求', cells: ['追完に応じない場合に代金を下げる', '相当の期間を定めて催告した後に実施'], emphasis: 'rule' },
                { label: '3. 解除・賠償', cells: ['契約を白紙に戻す、損害を補填する', '損害賠償のみ売主の過失が必要'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「種類または品質」だけでなく「数量」についても、1年以内の通知が必要だとする',
                why_wrong: '1年以内の通知期間が適用されるのは「種類または品質」のみ。「数量」や「権利」の不適合は時効（5年/10年）まで。',
                correct_rule: '数量不足は外見からわかりやすいため、厳しい通知期間（1年）の対象外。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「知った時から1年以内」',
                check: '品質・種類の不適合かどうかを確認。',
                answer_pattern: '数量不足（80㎡しかなかった等）なら「1年以内」という制限は間違い。'
            }
        ],
        check_question: {
            question: '売買の目的物の数量が不足していた場合、買主がその不足を知った時から1年以内に売主に通知しなければ、売主の責任を追及できない。',
            answer: '×',
            explanation: '数量不足による不適合には、1年以内の通知期間制限は適用されません。'
        },
        repair_explanation: {
            short_note: '品質（雨漏り等）はすぐ言わないとダメ（1年）。数量（面積不足）は5年10年の原則通り。',
            common_mistake: 'すべての不適合に1年の通知期間を適用してしまうミス。'
        },
        linked_tags: ['契約不適合責任', '代金減額', '通知期間'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法562条〜566条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_jusetsu_brokerage_3types',
        title: '媒介契約 3種類の比較',
        category: '宅建業法',
        conclusion: '「自己発見取引」ができるのは一般と専任。「報告義務」と「レインズ登録」が一番厳しいのが専属専任。',
        purpose: '依頼者と業者の権利義務関係を整理し、適切な売却・購入機会を確保する。',
        requirements: ['媒介契約書の交付（34条の2）', '標準媒介契約約款の準拠'],
        legal_effect: '業者への報酬請求権、依頼者の義務（有効期間内等）。',
        principle: '有効期間は専任・専属専任ともに最長3ヶ月。一般媒介には制限なし。',
        exceptions: ['自動更新：特約で自動更新を定めることはできない（依頼者から申し出があれば更新可）。'],
        cases: {
            concrete_example: '専属専任媒介を結んだが、親戚が買いたいと言ってきた。この場合でも業者を通さなければならない。',
            counter_example: '専任媒介なら、自分で見つけてきた相手と契約できる（ただし業者の実費精算が必要な場合あり）。'
        },
        comparison: [],
        trap_points: ['「専任媒介なら、指定流通機構への登録義務はない」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '媒介契約の義務一覧',
            columns: ['一般媒介', '専任媒介', '専属専任媒介'],
            rows: [
                { label: '重複依頼', cells: ['可能', '禁止', '禁止'], emphasis: 'neutral' },
                { label: '自己発見取引', cells: ['可能', '可能', '禁止'], emphasis: 'rule' },
                { label: 'レインズ登録', cells: ['任意', '7日以内', '5日以内'], emphasis: 'rule' },
                { label: '状況報告', cells: ['なし', '2週に1回以上', '1週に1回以上'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '専任媒介と専属専任媒介の「有効期間」に差があると思い込む',
                why_wrong: 'どちらも「3ヶ月」が最長であり、これより長い期間を定めても3ヶ月に短縮される。',
                correct_rule: '有効期間の制限は共通。差が出るのは「報告頻度」と「自分で探せるか」の2点。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「休業日を含まない」',
                check: 'レインズ登録の日数（5日・7日）の計算を確認。',
                answer_pattern: '業者の休業日はカウントしない。'
            }
        ],
        check_question: {
            question: '専属専任媒介契約を締結した宅建業者は、契約締結の日から5日（休業日を含む）以内に指定流通機構に登録しなければならない。',
            answer: '×',
            explanation: '登録期限の「5日」には、休業日は含まれません。'
        },
        repair_explanation: {
            short_note: '専属専任は「報告も登録も一番早い」がキーワード。',
            common_mistake: 'レインズ登録の日数（5日と7日）を入れ替えて出されるミス。'
        },
        linked_tags: ['媒介契約', '専任媒介', 'レインズ'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法34条の2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_lease_land_hikaku',
        title: '普通借地権 vs 定期借地権',
        category: '権利関係',
        conclusion: '普通借地は「更新が原則・建物がある限り続く」、定期借地は「期間満了で確定終了・更新なし」。',
        purpose: '借地人の居住・事業の安定と、地主の土地返還の確実性を両立させる。',
        requirements: ['普通：存続期間30年以上', '定期（一般）：50年以上、書面（公正証書等）'],
        legal_effect: '借地期間満了時の更新または明渡しの強制力。',
        principle: '普通借地：借地人が望めば更新されるのが原則。',
        exceptions: ['定期借地：契約で「更新しない・建物買取請求をしない」旨を定めることができる。'],
        cases: {
            concrete_example: '一戸建てを建てるために30年の普通借地を契約。建物が残っていれば30年後も更新を請求できる。',
            counter_example: '事業用定期借地権（10年以上50年未満）は、公正証書で契約しなければならない。'
        },
        comparison: [{ target_tag: '定期借地権', difference: '更新がないため、期間が来たら必ず更地にして返さなければならない。' }],
        trap_points: ['「定期借地権はすべて公正証書必須」とする誤り（一般定期借地は公正証書「等」の書面でよい）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '借地権の2大パターン比較',
            columns: ['普通借地権', '一般定期借地権'],
            rows: [
                { label: '存続期間', cells: ['30年以上（当初）', '50年以上'], emphasis: 'neutral' },
                { label: '契約の方式', cells: ['制限なし（口頭可）', '書面が必要'], emphasis: 'rule' },
                { label: '更新の有無', cells: ['あり', 'なし（特約による）'], emphasis: 'rule' },
                { label: '建物買取請求', cells: ['あり', 'なし（特約による）'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「一般定期借地権」と「事業用定期借地権」の公正証書要件を混同する',
                why_wrong: '事業用は公正証書が「絶対条件（成立要件）」だが、一般定期借地は単なる書面で足りる。',
                correct_rule: '一般定期借地権（50年以上）は、書面であれば公正証書でなくても有効。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「建物買取請求権」の排除',
                check: '定期借地権の特約かどうかを確認。',
                answer_pattern: '定期借地なら「買い取れ」と言えない特約は有効。'
            }
        ],
        check_question: {
            question: '一般定期借地権の設定を目的とする契約は、公正証書によってしなければならない。',
            answer: '×',
            explanation: '一般定期借地権は書面（公正証書等）であればよく、公正証書に限定されません。'
        },
        repair_explanation: {
            short_note: '「普通は続く、定期は終わる」。定期の中でも「事業用」だけが公正証書必須と覚えましょう。',
            common_mistake: '定期借地権の種類（一般・建物譲渡・事業用）の要件混同。'
        },
        linked_tags: ['借地権', '借地借家法', '定期借地権'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '366AC0000000090', text: '借地借家法3条, 22条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_lease_building_v2',
        title: '普通借家 vs 定期借家 (強化版)',
        category: '権利関係',
        conclusion: '定期借家は「書面契約」＋「事前説明」が揃って初めて有効。どちらか欠ければ普通借家になる。',
        purpose: '借主が「更新がないこと」を確実に認識するための手続的保障を理解する。',
        requirements: ['定期：期間の定め、書面契約、書面による事前説明、終了通知（6ヶ月〜1年前）'],
        legal_effect: '期間満了により契約が確定的に終了する。',
        principle: '普通借家：正当事由がない限り、大家からの解約は認められない。',
        exceptions: ['定期借家：居住用200㎡未満の場合、借主にやむを得ない事情があれば中途解約できる。'],
        cases: {
            concrete_example: '契約書に「定期借家」と書いてあっても、宅建士が「更新はありません」という別の書面で説明していなければ普通借家になる。',
            counter_example: '1年未満の契約をした場合、普通借家なら「期間の定めなし」となるが、定期借家なら「11ヶ月」の契約も有効。'
        },
        comparison: [],
        trap_points: ['「契約書に更新なしと書いてあれば事前説明は不要」とする誤り（契約書とは別の書面が必要）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '普通借家と定期借家の手続比較',
            columns: ['普通借家', '定期借家'],
            rows: [
                { label: '契約方式', cells: ['制限なし（口頭可）', '書面（公正証書等）'], emphasis: 'neutral' },
                { label: '事前説明', cells: ['不要', '必要（別書面で）'], emphasis: 'rule' },
                { label: '期間の制限', cells: ['1年未満は期間なし扱い', '1年未満も有効'], emphasis: 'trap' },
                { label: '終了通知', cells: ['不要（更新拒絶は6ヶ月前）', '必要（6ヶ月〜1年前）'], emphasis: 'rule' }
            ]
        },
        trap_details: [
            {
                trap: '「事前説明」を忘れても、契約書に記載があれば定期借家として成立すると考える',
                why_wrong: '事前説明は「成立要件」に近い。説明を欠いた定期借家契約は、普通借家契約としての効力しか持たない。',
                correct_rule: '契約書とは別に「更新がない旨」を記載した書面を交付して説明しなければならない。'
            }
        ],
        check_question: {
            question: '定期建物賃貸借契約において、貸主が期間満了の1年前から6ヶ月前までの間に、借主に対して期間満了により契約が終了する旨の通知をしなかった場合、貸主は契約の終了を借主に対抗できない。',
            answer: '○',
            explanation: '終了通知義務（通知期間内の通知）を怠ると、直ちには終了を主張できなくなります（通知から6ヶ月経過後に終了）。'
        },
        repair_explanation: {
            short_note: '定期借家は「儀式（書面＋説明）」が大事。',
            common_mistake: '事前説明の書面を「契約書と兼ねてよい」とするひっかけ。'
        },
        linked_tags: ['借家権', '定期借家', '事前説明'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '366AC0000000090', text: '借地借家法26条, 38条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_usage_zones',
        title: '用途地域と用途制限',
        category: '法令上の制限',
        conclusion: '住居・商業・工業の13地域ごとに「建てられるもの」が決まる。住宅は工業専用地域以外ならどこでも建てられる。',
        purpose: '土地利用の混在を防ぎ、良好な環境形成と効率的な都市活動を両立させる。',
        requirements: ['都市計画法による指定', '建築基準法48条の制限'],
        legal_effect: '制限に反する建築物は建築確認が下りない、または是正命令対象。',
        principle: '用途地域が定められた土地では、その地域にふさわしくない建物は建てられない。',
        exceptions: ['特定行政庁の許可：公聴会を経て、周囲の環境を害さないと認めれば例外的に建築可。'],
        cases: {
            concrete_example: '第一種低層住居専用地域では、原則としてコンビニ（店舗）は建てられない。',
            counter_example: '工業専用地域には、たとえ自分の持ち家であっても「住宅」を建てることはできない。'
        },
        comparison: [],
        trap_points: ['「住宅はすべての地域で建築可能」とする誤り（工業専用地域は不可）'],
        understanding_visual: {
            type: 'rule_table',
            title: '用途地域別「住宅」と「店舗」の建築可否',
            columns: ['用途地域', '住宅', '店舗 (1,500㎡以下)'],
            rows: [
                { label: '低層住居専用', cells: ['○', '×（小規模のみ可）'], emphasis: 'neutral' },
                { label: '中高層住居専用', cells: ['○', '○（2階以下等）'], emphasis: 'neutral' },
                { label: '工業地域', cells: ['○', '○'], emphasis: 'rule' },
                { label: '工業専用地域', cells: ['× (最強の工業)', '○'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「第一種低層住居専用地域」で小規模な店舗なら何でも建てられるとする',
                why_wrong: '低層住居は店舗に非常に厳しく、住宅兼用などの極めて限定的なものしか認められない。',
                correct_rule: '店舗が広く認められ始めるのは「近隣商業地域」から。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「住宅が建てられない地域」',
                check: '選択肢に「工業専用地域」があるか探す。',
                answer_pattern: '工業専用地域 ＝ 住宅・学校・病院がすべて建築不可。'
            }
        ],
        check_question: {
            question: '工業専用地域内においては、住宅を建築することができない。',
            answer: '○',
            explanation: '工業専用地域は工業のための地域であり、住宅、学校、病院、ホテル等は建築できません。'
        },
        repair_explanation: {
            short_note: '「工業専用地域」だけは、人は住めない（住宅不可）と覚えましょう。',
            common_mistake: '工業地域（住宅可）と工業専用地域（住宅不可）の区別が曖昧。'
        },
        linked_tags: ['用途地域', '用途制限', '建築基準法'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '325AC0000000201', text: '建築基準法48条, 別表第2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_road_42_43',
        title: '道路・接道義務（42条・43条）',
        category: '法令上の制限',
        conclusion: '建物は「4m以上の道路」に「2m以上」接していなければならない。4m未満でも「セットバック」すればOK。',
        purpose: '避難・消防・通風を確保し、都市の安全性を維持する。',
        requirements: ['建築基準法上の道路であること', '接道長さ2m以上'],
        legal_effect: '接道義務を満たさない敷地には、建物が建てられない（再建築不可）。',
        principle: '道路の幅員は原則4m以上必要（42条1項道路）。',
        exceptions: ['2項道路：4m未満だが、昔から建物が立ち並んでいた道を「道路」とみなし、中心線から2m後退（セットバック）する。'],
        cases: {
            concrete_example: '幅3mの道の中心から2m下がった線までが道路境界線となる（2項道路のセットバック）。',
            counter_example: '道路に2m接していても、その道が「建築基準法上の道路」でなければ接道義務違反。'
        },
        comparison: [],
        trap_points: ['「セットバックした部分は、建ぺい率の敷地面積に含めることができる」とする誤り（道路とみなされるため除外）'],
        understanding_visual: {
            type: 'case_flow',
            title: '建築できるか？接道判定フロー',
            columns: ['チェック項目', 'NG時の対応'],
            rows: [
                { label: '1. 道路の判定', cells: ['法42条の道路か？', 'NOなら43条ただし書き許可が必要'], emphasis: 'neutral' },
                { label: '2. 接道長さ', cells: ['2m以上接しているか？', 'NOなら再建築不可'], emphasis: 'rule' },
                { label: '3. セットバック', cells: ['4m未満ならセットバックしたか？', 'NOなら建築確認不可'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「道路の片側が崖や川」の場合でも、常に中心線から2m下がればよいとする',
                why_wrong: '片側が下がれない場合は、崖側の境界線から「4m」下がった線が道路境界線となる。',
                correct_rule: '道路としての有効幅員4mを確保するためのルール。'
            }
        ],
        check_question: {
            question: '建築基準法第42条第2項の規定により道路の境界線とみなされる線と、道との間の部分は、敷地面積に算入することができない。',
            answer: '○',
            explanation: 'セットバック部分は道路として扱われるため、建築物の敷地面積からは除外されます。'
        },
        repair_explanation: {
            short_note: '道が狭い（2項道路）なら「下がれ（セットバック）」。下がった土地は「道」になるので自分の敷地（面積）には入れない。',
            common_mistake: 'セットバック部分の面積計算の要否（含めない）。'
        },
        linked_tags: ['接道義務', '2項道路', 'セットバック'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '325AC0000000201', text: '建築基準法42条, 43条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_height_limits',
        title: '斜線制限・高さ制限',
        category: '法令上の制限',
        conclusion: '「道路」「隣地」「北側」の3つの斜線がある。第一種低層住居専用地域は「北側斜線」と「絶対高さ」がカギ。',
        purpose: '日照・通風・採光を確保し、周辺環境への圧迫感を軽減する。',
        requirements: ['用途地域ごとの指定', '敷地境界線からの距離・勾配'],
        legal_effect: '建築物の高さを一定勾配の斜線内に収める義務。',
        principle: '道路斜線制限は、すべての用途地域で適用される。',
        exceptions: ['隣地斜線制限：低層住居専用地域等には適用されない（絶対高さ制限が優先されるため）。'],
        cases: {
            concrete_example: '住居専用地域において、北側の家の陽当たりを守るために建物を削る（北側斜線制限）。',
            counter_example: '商業地域や工業地域では、北側斜線制限は適用されない。'
        },
        comparison: [],
        trap_points: ['「道路斜線制限は住居系地域にのみ適用される」とする誤り（全地域適用）'],
        understanding_visual: {
            type: 'rule_table',
            title: '斜線制限の適用地域まとめ',
            columns: ['斜線制限の種類', '適用される地域', '主な理由'],
            rows: [
                { label: '道路斜線', cells: ['全地域', '道路の開放感確保'], emphasis: 'neutral' },
                { label: '隣地斜線', cells: ['低層系以外', '高層建築の隣地保護'], emphasis: 'rule' },
                { label: '北側斜線', cells: ['低層・中高層住居', '北側隣家の日照確保'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「北側斜線制限」がすべての住居系地域で適用されると思い込む',
                why_wrong: '北側斜線が適用されるのは「低層・中高層」のみ。準住居地域や商業地域等にはない。',
                correct_rule: '適用地域を「低層・中高層住居専用地域」と限定して覚える。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「第一種低層住居専用地域」',
                check: '絶対高さ制限(10m/12m)と北側斜線のセットを意識。',
                answer_pattern: '隣地斜線は「なし」が正解（高さ制限があるため）。'
            }
        ],
        check_question: {
            question: '道路斜線制限は、第一種低層住居専用地域以外の地域においては適用されない。',
            answer: '×',
            explanation: '道路斜線制限は、用途地域の指定の有無に関わらず、すべての地域で適用されます。'
        },
        repair_explanation: {
            short_note: '道路斜線は「どこでも」。北側斜線は「住居専用」。低層住居に「隣地斜線」はいらない（絶対高さで十分）。',
            common_mistake: '道路斜線の全地域適用を忘れるミス。'
        },
        linked_tags: ['斜線制限', '道路斜線', '北側斜線'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '325AC0000000201', text: '建築基準法56条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_dev_permission_detail',
        title: '開発許可の例外と手続',
        category: '法令上の制限',
        conclusion: '農林漁業用・公益目的・小規模（市街化1,000㎡未満等）は許可不要。調整区域は規模に関わらず原則許可。',
        purpose: '開発行為の定義と、都市計画上の重要性に応じた許可不要特例を整理する。',
        requirements: ['主として建築物の建築用、または特定工作物の建設用の土地の区画形質の変更'],
        legal_effect: '許可が必要な行為を無許可で行うと、原状回復命令や懲役・罰金。',
        principle: '市街化区域：1,000㎡以上なら許可必要（自治体により縮小可）。',
        exceptions: ['調整区域：農林漁業者の住宅や、農林漁業用施設（温室等）は規模不問で不要。'],
        cases: {
            concrete_example: '市街化区域で800㎡の遊園地を造る場合、1,000㎡未満なので開発許可は不要。',
            counter_example: '調整区域で農家でない者が50㎡のセカンドハウスを建てる場合、小規模でも許可が必要。'
        },
        comparison: [],
        trap_points: ['「市街化調整区域なら農林漁業用施設以外はすべて許可必要」と思い込むミス'],
        understanding_visual: {
            type: 'rule_table',
            title: '面積による許可不要基準（原則）',
            columns: ['区域区分', '許可不要となる面積'],
            rows: [
                { label: '市街化区域', cells: ['1,000㎡ 未満', '（三大都市圏は500㎡未満）'], emphasis: 'rule' },
                { label: '市街化調整区域', cells: ['なし', '（例外を除き全件必要）'], emphasis: 'trap' },
                { label: '非線引・準都市', cells: ['3,000㎡ 未満', ''], emphasis: 'neutral' },
                { label: '区域外', cells: ['10,000㎡ 未満', ''], emphasis: 'neutral' }
            ]
        },
        trap_details: [
            {
                trap: '「駅」や「図書館」を建てるための開発には許可が必要だとする',
                why_wrong: '公益目的の建築物（駅、図書館、公民館等）は、場所や規模に関わらず常に許可不要。',
                correct_rule: '学校、病院、庁舎などは「公益目的」から除外されており、原則通り許可が必要。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「市街化調整区域」',
                check: '農林漁業用か公益目的かを確認。',
                answer_pattern: 'どちらでもなければ、100㎡でも許可が必要。'
            }
        ],
        check_question: {
            question: '市街化調整区域内において、図書館を建築する目的で行う開発行為は、その規模に関わらず、知事の許可を受けなければならない。',
            answer: '×',
            explanation: '図書館は公益目的の建築物であり、場所や規模を問わず開発許可は不要です。'
        },
        repair_explanation: {
            short_note: '調整区域は「農業・林業・漁業・駅・図書館」以外は絶対に許可が必要と覚えましょう。',
            common_mistake: '「学校」や「病院」も公益目的として不要と勘違いするミス。'
        },
        linked_tags: ['都市計画法', '開発許可', '公益目的'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '343AC0000000100', text: '都市計画法29条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_land_readjustment',
        title: '土地区画整理法（仮換地と換地処分）',
        category: '法令上の制限',
        conclusion: '仮換地は「使う権利（使用収益）」、換地処分は「所有権（権利確定）」が移るタイミング。',
        purpose: '公共施設の整備と宅地の利用増進を同時に行う事業の手続プロセスを理解する。',
        requirements: ['施行者による仮換地の指定', '換地処分公告の翌日'],
        legal_effect: '仮換地：前の土地が使えなくなり、新しい土地が使えるようになる。換地処分：登記なしで権利移転。',
        principle: '仮換地指定の効力発生日から、換地処分の公告日まで使用収益できる。',
        exceptions: ['保留地：施行者が事業費に充てるため、換地として定めず売却する土地。'],
        cases: {
            concrete_example: '仮換地を指定されたら、元の土地に家を建てることはできなくなり、指定された仮換地で建築ができるようになる。',
            counter_example: '換地処分公告の「日（当日）」に権利が移るわけではなく、「翌日」に一斉に移る。'
        },
        comparison: [],
        trap_points: ['「仮換地指定によって所有権が移転する」とする誤り（所有権は換地処分まで移らない）'],
        understanding_visual: {
            type: 'case_flow',
            title: '権利が移る2ステップ',
            columns: ['手続名', '移る権利'],
            rows: [
                { label: '1. 仮換地の指定', cells: ['【使用収益権】の移動', '工事のために仮の場所を使わせる'], emphasis: 'neutral' },
                { label: '2. 換地処分の公告', cells: ['（当日終了まで変動なし）', ''], emphasis: 'rule' },
                { label: '3. 公告の翌日', cells: ['【所有権】等の法的権利が確定', '前の土地の権利は消滅'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「清算金」は換地処分の前に支払わなければならないとする',
                why_wrong: '換地処分によって生じた不均衡を直すのが清算金なので、換地処分の後に確定・徴収される。',
                correct_rule: '換地処分の公告があった日の翌日に、清算金が確定する。'
            }
        ],
        check_question: {
            question: '仮換地が指定された場合、従前の土地の所有者は、その指定の効力発生日から換地処分の公告がある日まで、従前の土地を使用または収益することができない。',
            answer: '○',
            explanation: '仮換地が指定されると、従前の土地の使用収益権は停止し、仮換地へと移ります。'
        },
        repair_explanation: {
            short_note: '「仮換地 ＝ 使えるだけ」「公告の翌日 ＝ 私のものになる」と区切りましょう。',
            common_mistake: '権利移転のタイミングを「公告の日」とするミス。'
        },
        linked_tags: ['土地区画整理法', '仮換地', '換地処分'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '329AC0000000119', text: '土地区画整理法98条, 103条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_brokerage_fees_master',
        title: '宅建業法 報酬額の制限',
        category: '宅建業法',
        conclusion: '売買媒介は「3%+6万 (+消費税)」。貸借は原則「1ヶ月分」。低廉な空家等は売主から「18万」まで特例あり。',
        purpose: '不当に高額な報酬請求を禁止し、消費者の利益を保護するとともに適正な対価を定める。',
        requirements: ['宅建業法46条', '国土交通大臣告示（昭和45年）'],
        legal_effect: '上限を超える報酬の受領は業法違反（業務停止処分等の対象）。',
        principle: '売買：代金額（税抜）を3段階に分けて計算（速算法が一般的）。',
        exceptions: ['低廉な空家等（400万円以下）：媒介報酬と現地調査費等の合計で最大18万円＋税まで（売主からのみ）。'],
        cases: {
            concrete_example: '2,000万円の土地を媒介。報酬上限 ＝ 2,000万 × 3% ＋ 6万 ＝ 66万円 ＋ 消費税。',
            counter_example: '居住用建物の貸借で、依頼者の承諾がない限り、貸主・借主の一方から受領できるのは「0.5ヶ月分」まで。'
        },
        comparison: [],
        trap_points: ['「消費税を含めた代金を基準に報酬を計算する」とする誤り（税抜価格が基準）'],
        understanding_visual: {
            type: 'rule_table',
            title: '報酬計算クイックシート',
            columns: ['取引類型', '上限額（媒介）', '備考'],
            rows: [
                { label: '売買（400万超）', cells: ['代金 × 3% ＋ 6万円', '＋ 消費税10%'], emphasis: 'neutral' },
                { label: '低廉な空家（売主）', cells: ['最大 18万円', '400万円以下の売買'], emphasis: 'rule' },
                { label: '貸借（原則）', cells: ['賃料 1.0ヶ月分', '双方合計での上限'], emphasis: 'trap' },
                { label: '貸借（居住用）', cells: ['原則 0.5ヶ月分', '承諾あれば1.0可能'], emphasis: 'rule' }
            ]
        },
        trap_details: [
            {
                trap: '「特別に依頼していない広告費」も報酬とは別に請求できるとする',
                why_wrong: '通常の広告費は報酬に含まれる。別途請求できるのは「依頼者の依頼による広告」や「遠隔地への特別依頼」のみ。',
                correct_rule: '原則として報酬以外は1円も受け取ってはならない。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「建物（消費税課税対象）」',
                check: '代金から税を抜いてから計算しているか確認。',
                answer_pattern: '税込3,300万円 ＝ 税抜3,000万円として計算。'
            }
        ],
        check_question: {
            question: '宅建業者が居住用建物の貸借の媒介を行う場合、依頼者の承諾を得ていない限り、一方の依頼者から受け取れる報酬は賃料の0.55倍（税込）を超えてはならない。',
            answer: '○',
            explanation: '居住用建物の貸借媒介では、承諾がない限り、一方から受け取れるのは0.5ヶ月分（＋税）までです。'
        },
        repair_explanation: {
            short_note: '売買は「3%+6万」、貸借は「1ヶ月分（居住用は原則半分）」。',
            common_mistake: '建物の代金を税込のまま計算してしまうミス。'
        },
        linked_tags: ['報酬額の制限', '低廉な空家等', '媒介報酬'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法46条, 報酬告示' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_jusetsu_37_detail',
        title: '37条書面（契約書面）の詳細',
        category: '宅建業法',
        conclusion: '契約が成立したら「遅滞なく」「両当事者」へ交付。必要的記載事項（絶対必要）と任意的記載事項（あれば必要）を区別。',
        purpose: '合意内容を確定し、紛争を防止する。',
        requirements: ['契約成立', '宅建士の記名', '書面の交付'],
        legal_effect: '交付義務違反は業務停止処分等の対象。',
        principle: '交付先は「売主・買主」や「貸主・借主」の双方。',
        exceptions: ['説明義務はない：35条と違い、宅建士が説明する必要はない（記名は必須）。'],
        cases: {
            concrete_example: '売買契約で「引渡し時期」や「移転登記の申請時期」は、必ず書かなければならない事項。',
            counter_example: '貸借の37条書面では、「移転登記の申請時期」は記載不要（貸借なので登記移転がない）。'
        },
        comparison: [{ target_tag: '35条書面', difference: '37条は「成立後・両方へ」、35条は「成立前・買う人へ」。' }],
        trap_points: ['「貸借の37条でも、登記申請時期は必須である」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '売買 vs 貸借（37条の必要的記載事項）',
            columns: ['売買・交換', '貸借（賃貸）'],
            rows: [
                { label: '当事者の氏名・住所', cells: ['必須', '必要'], emphasis: 'neutral' },
                { label: '引渡しの時期', cells: ['必須', '必要'], emphasis: 'rule' },
                { label: '登記申請の時期', cells: ['必須', '不要'], emphasis: 'trap' },
                { label: '代金・借賃の額', cells: ['必須', '必要'], emphasis: 'neutral' }
            ]
        },
        trap_details: [
            {
                trap: '「代金以外の金銭（手付金等）の授受」を必要的記載事項だとする',
                why_wrong: '「代金以外の金銭」は任意的記載事項（定めがあれば書く）に分類される。',
                correct_rule: '代金・借賃そのものは絶対に必要。それ以外（手付・敷金等）は約束があれば必要。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「貸借」の37条',
                check: '登記申請時期が選択肢に入っていないか。',
                answer_pattern: '登記申請時期 ＝ 貸借では記載不要。'
            }
        ],
        check_question: {
            question: '宅建業者は、建物の貸借の媒介において契約を成立させたとき、37条書面に「移転登記の申請時期」を記載しなければならない。',
            answer: '×',
            explanation: '貸借の37条書面において、登記申請時期は記載事項ではありません。'
        },
        repair_explanation: {
            short_note: '37条は「いつ・いくらで・何を」を重視。貸借に登記は関係なし。',
            common_mistake: '35条（重説）の事項を37条の事項と取り違えるミス。'
        },
        linked_tags: ['37条書面', '必要的記載事項', '売買と貸借の違い'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法37条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_jusetsu_35_detail',
        title: '35条重要事項説明（詳細）',
        category: '宅建業法',
        conclusion: '契約前に「これから買う・借りる人」へ。宅建士が「証を提示」して「書面を交付」し「説明」する。',
        purpose: '購入者が損をしないよう、物件のスペックやリスクを事前に知らせる。',
        requirements: ['契約が成立するまで', '宅建士による説明', '説明の相手方（買主・借主等）'],
        legal_effect: '説明義務違反は指示処分、業務停止処分等の対象。',
        principle: '相手方が宅建業者以外なら、説明を省略することはできない。',
        exceptions: ['業者間取引：説明は不要（書面交付のみでOK）。IT重説：対面でなくても一定の要件で認められる。'],
        cases: {
            concrete_example: '未完成物件の売買で、「完了時の形状・構造」を説明するのは35条の義務。',
            counter_example: '「引渡しの時期」は37条の事項であり、35条では説明義務はない（任意）。'
        },
        comparison: [],
        trap_points: ['「重要事項説明の相手方が宅建業者なら、書面の交付も不要である」とする誤り'],
        understanding_visual: {
            type: 'rule_table',
            title: '35条特有の説明事項（売買 vs 貸借）',
            columns: ['説明事項', '売買・交換', '貸借（賃貸）'],
            rows: [
                { label: '法令上の制限', cells: ['詳しく必要', '一部簡略化'], emphasis: 'neutral' },
                { label: '私道負担の有無', cells: ['必要', '不要'], emphasis: 'trap' },
                { label: '契約解除の規定', cells: ['必要', '必要'], emphasis: 'rule' },
                { label: '違約金等の定め', cells: ['必要', '必要'], emphasis: 'rule' }
            ]
        },
        trap_details: [
            {
                trap: '「損害賠償額の予定」の説明を、売買では必要だが貸借では不要だとする',
                why_wrong: '違約金や損害賠償額の予定は、売買でも貸借でも「定めがあれば」必ず説明しなければならない。',
                correct_rule: '金銭トラブル防止のため、双方で必要な重要項目。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「貸借」の35条',
                check: '私道負担があるか。',
                answer_pattern: '貸借 ＋ 私道負担 ＝ 説明不要（売買なら必要）。'
            }
        ],
        check_question: {
            question: '宅建業者は、建物の貸借の媒介において、借主に対し、私道に関する負担について説明しなければならない。',
            answer: '×',
            explanation: '貸借の重要事項説明において、私道負担に関する説明は不要です。'
        },
        repair_explanation: {
            short_note: '35条は「買う前に知っておくべきこと」。貸借なら「私道」などは重要視されないと割り切りましょう。',
            common_mistake: '業者間取引での「説明不要・交付必要」というルールの混同。'
        },
        linked_tags: ['重要事項説明', '35条', '私道負担'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法35条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_inheritance_master',
        title: '相続・法定相続分',
        category: '権利関係',
        conclusion: '配偶者は常に相続人。第1順位（子）、第2順位（親）、第3順位（兄弟）の順で決まり、後順位は先順位がいれば出番なし。',
        purpose: '死亡後の財産承継ルールを明確にし、公平な遺産分配を実現する。',
        requirements: ['相続の開始（死亡）', '相続人の生存', '相続欠格・廃除に該当しないこと'],
        legal_effect: '死亡の瞬間から、一切の権利義務が相続人に承継される。',
        principle: '配偶者と子が相続する場合、配偶者1/2、子1/2（全員で）。',
        exceptions: ['代襲相続：子が先に死亡している場合、孫がその枠を継ぐ。'],
        cases: {
            concrete_example: '夫Aが死亡。妻Bと子供2人がいる場合。Bが1/2、子供がそれぞれ1/4ずつ相続。',
            counter_example: '子供がいない場合、第2順位の「親」が登場し、配偶者2/3、親1/3となる。'
        },
        comparison: [],
        trap_points: ['「配偶者と兄弟姉妹が相続する場合、配偶者の取り分は常に半分である」とする誤り（3/4である）'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '相続人の順位と法定相続分',
            columns: ['配偶者以外の相続人', '配偶者の持分', '他相続人の合計持分'],
            rows: [
                { label: '第1順位：子（孫）', cells: ['1/2', '1/2'], emphasis: 'rule' },
                { label: '第2順位：直系尊属', cells: ['2/3', '1/3'], emphasis: 'rule' },
                { label: '第3順位：兄弟姉妹', cells: ['3/4', '1/4'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「遺留分」と「法定相続分」の割合を混同する',
                why_wrong: '遺留分は「最低限もらえる額」で原則1/2（兄弟にはなし）。法定相続分は「遺言がない場合の基本割合」。',
                correct_rule: '兄弟姉妹には遺留分が認められていない点に注意。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「兄弟姉妹」が登場',
                check: '遺留分の有無を問う問題ではないか確認。',
                answer_pattern: '兄弟姉妹 ＝ 遺留分なし、代襲は1代（甥・姪）まで。'
            }
        ],
        check_question: {
            question: '配偶者と直系尊属（父母）が相続人である場合、配偶者の法定相続分は3分の2であり、直系尊属の法定相続分は3分の1である。',
            answer: '○',
            explanation: '第2順位との相続では配偶者が2/3となります。'
        },
        repair_explanation: {
            short_note: '「子（1/2）→ 親（2/3）→ 兄弟（3/4）」と、配偶者の取り分が1段ずつ増えていくと覚えましょう。',
            common_mistake: '兄弟姉妹の取り分を1/3と勘違いするミス（正解は1/4）。'
        },
        linked_tags: ['相続', '法定相続分', '代襲相続'],
        linked_output_modes: ['active_recall', 'number_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法887条, 889条, 900条' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_rights_asset_division_confrontation',
        title: '遺産分割・共同相続と対抗要件',
        category: '権利関係',
        conclusion: '遺言や分割協議で「自分のもの」になっても、登記をしなければ第三者（法定相続分を超えて取得した分）に勝てない。',
        purpose: '共同相続人の一人が勝手に処分した場合等の第三者との権利関係を整理する。',
        requirements: ['相続の開始', '遺産分割協議の成立（または遺言の効力発生）', '登記の具備'],
        legal_effect: '第三者に対して自己の取得した権利を主張できる。',
        principle: '「法定相続分を超える部分」については、登記がなければ第三者に対抗できない（改正民法899条の2）。',
        exceptions: ['法定相続分の範囲内であれば、登記なしでも第三者に対抗可能。'],
        cases: {
            concrete_example: 'AとBが土地を相続。Aが全部もらう協議をしたが、Bが勝手に自分の持分1/2をCに売った。Aは登記がなければCに1/2分を返せと言えない。',
            counter_example: '相続放棄をした者の持分を第三者が取得した場合、放棄した者は登記なしでも第三者に対抗できる（遡及的無効のため）。'
        },
        comparison: [],
        trap_points: ['「遺言で取得したなら、登記なしで常に第三者に勝てる」とする誤り（法定相続分超は登記必須）'],
        understanding_visual: {
            type: 'case_flow',
            title: '共同相続後の権利争い判定フロー',
            columns: ['チェック項目', '対抗のための要件'],
            rows: [
                { label: '1. 取得範囲の確認', cells: ['「法定相続分」の範囲内か？', 'YES ＝ 登記なしで対抗可'], emphasis: 'neutral' },
                { label: '2. 超過部分の確認', cells: ['それを超える「遺言・分割」分か？', 'YES ＝ 登記がなければ対抗不可'], emphasis: 'rule' },
                { label: '3. 第三者の出現', cells: ['先に登記したほうが勝つ（177条準用）', ''], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「相続放棄」も登記がなければ第三者に対抗できないと考える',
                why_wrong: '相続放棄は「最初から相続人ではなかった」ことになるため、登記以前の問題。無権利者から買った第三者は守られない。',
                correct_rule: '相続放棄については、登記なしで第三者に対抗できる。'
            }
        ],
        check_question: {
            question: '相続による権利の承継は、遺産の分割によるものであるかどうかにかかわらず、法定相続分を超える部分については、登記をしなければ第三者に対抗できない。',
            answer: '○',
            explanation: '民法899条の2第1項の規定です。遺言でも分割協議でも、法定相続分超は登記が必要です。'
        },
        repair_explanation: {
            short_note: '「自分の本来の取り分（法定分）」は登記なしでOK。「おまけでもらった分（超過分）」は登記が早い者勝ち。',
            common_mistake: '遺言（特定財産承継遺言）なら登記不要と思い込むミス（改正前ルールとの混同）。'
        },
        linked_tags: ['遺産分割', '対抗要件', '改正民法'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'law', id: '129AC0000000089', text: '民法899条の2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_tax_capital_gains_master',
        title: '不動産譲渡所得（計算と特例）',
        category: '税・その他',
        conclusion: '売却額から「買った時の経費（取得費）」と「売った時の経費」を引いた「利益」に課税される。3,000万控除が最大武器。',
        purpose: '資産の譲渡により生じる利益（キャピタルゲイン）に対する課税の仕組みを整理する。',
        requirements: ['個人による資産の譲渡', '所有期間による長期・短期の区分'],
        legal_effect: '分離課税として所得税・住民税が課される。',
        principle: '所有期間5年超（長期）：15%＋税、5年以下（短期）：30%＋税。',
        exceptions: ['3,000万円特別控除：居住用財産を売った場合、所有期間に関わらず利益から3,000万円を引ける。'],
        cases: {
            concrete_example: 'マイホームを5,000万円で売り、利益が2,000万円出た。特例を使えば課税対象はゼロになる。',
            counter_example: '所有期間の判定は、売却した年の「1月1日時点」で行うため、実日数が5年を超えていても足りない場合がある。'
        },
        comparison: [],
        trap_points: ['「売却代金の全額に対して20%課税される」とする誤り（経費を引いた利益が対象）'],
        understanding_visual: {
            type: 'calculation_flow',
            title: '譲渡所得の計算プロセス',
            columns: ['計算項目', '内容'],
            rows: [
                { label: '1. 譲渡価額', cells: ['売った金額（税込）', ''], emphasis: 'neutral' },
                { label: '2. 取得費 ＋ 譲渡費用', cells: ['買った時の価格 ＋ 仲介手数料など', '不明な場合は売価の5%'], emphasis: 'rule' },
                { label: '3. 特別控除', cells: ['居住用3,000万円など', ''], emphasis: 'rule' },
                { label: '4. 課税譲渡所得', cells: ['（1 − 2 − 3）の残り', 'ここに税率をかける'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「3,000万円特別控除」は所有期間が10年を超えないと使えないとする',
                why_wrong: '3,000万円控除には所有期間の制限はない。制限（10年超）があるのは「軽減税率の特例」の方。',
                correct_rule: '3,000万円控除 ＝ 期間不問。 軽減税率 ＝ 10年超必須。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「所有期間判定」',
                check: '売却した年の「1月1日」で判定しているか。',
                answer_pattern: '実期間5年でも、1月1日時点で5年以下なら「短期譲渡所得」。'
            }
        ],
        check_question: {
            question: '居住用財産を譲渡した場合の3,000万円特別控除は、当該財産の所有期間が10年を超えていなければ適用を受けることができない。',
            answer: '×',
            explanation: '3,000万円特別控除には、所有期間の要件はありません。'
        },
        repair_explanation: {
            short_note: '「利益（もうけ）」から引けるのが控除。3,000万あれば大抵のマイホーム売却は非課税になります。',
            common_mistake: '3,000万円控除と軽減税率（10年要件）の適用要件の混同。'
        },
        linked_tags: ['譲渡所得', '3000万円控除', '所得税'],
        linked_output_modes: ['active_recall', 'number_recall'],
        source_trace: [{ type: 'official_guide', id: 'NTA_1440', text: '国税庁：譲渡所得の計算' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_tax_gift_housing_funds',
        title: '住宅取得等資金贈与の非課税',
        category: '税・その他',
        conclusion: '父母や祖父母から家を買う金を貰ったら最大1,000万円まで非課税。ただし翌年3月15日までに住むのが原則。',
        purpose: '若年層への資産移転を促進し、住宅取得を支援するための時限的な税制優遇。',
        requirements: ['贈与者は直系尊属（20歳以上）', '受贈者は子・孫（18歳以上、所得2,000万以下等）', '対象は住宅用の家屋'],
        legal_effect: '一定額（省エネ1,000万、その他500万）までの贈与税が非課税。',
        principle: '贈与を受けた年の翌年3月15日までに、その資金で住宅を取得し居住すること。',
        exceptions: ['居住：3月15日までに住めなくても、同日までに新築し、その後遅滞なく住む見込みならOK。'],
        cases: {
            concrete_example: '父から1,000万円貰って省エネ住宅を建てた。申告すれば贈与税はかからない。',
            counter_example: '配偶者の父母（義理の親）から貰った場合は「直系尊属」ではないため、この特例は使えない。'
        },
        comparison: [],
        trap_points: ['「義理の父母からの贈与にも適用できる」とする誤り（養子縁組していない限り不可）'],
        understanding_visual: {
            type: 'rule_table',
            title: '非課税限度額と主要要件',
            columns: ['項目', '内容'],
            rows: [
                { label: '非課税額（省エネ）', cells: ['1,000 万円', '断熱・耐震等の基準適合'], emphasis: 'rule' },
                { label: '非課税額（その他）', cells: ['500 万円', ''], emphasis: 'neutral' },
                { label: '贈与者の要件', cells: ['直系尊属（父母・祖父母）', '年齢制限なし（贈与時）'], emphasis: 'rule' },
                { label: '受贈者の所得', cells: ['2,000 万円以下', '（床面積要件等もあり）'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「合計所得金額が3,000万円」でも利用できるとする',
                why_wrong: '受贈者の所得制限は「2,000万円以下」（床面積40㎡〜50㎡未満なら1,000万円以下）。',
                correct_rule: '高所得者は優遇の対象外。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「直系尊属」',
                check: '義父母が含まれていないか確認。',
                answer_pattern: '実の親・祖父母が対象。配偶者の親は対象外。'
            }
        ],
        check_question: {
            question: '住宅取得等資金の贈与を受けた者が、その贈与を受けた年において、合計所得金額が2,000万円を超えている場合、この特例の適用を受けることができない。',
            answer: '○',
            explanation: '受贈者の所得制限（原則2,000万円以下）があります。'
        },
        repair_explanation: {
            short_note: '「親・祖父母からもらう金」「翌年3月15日までに住む」「所得2,000万以下」の3点をチェック。',
            common_mistake: '所得制限の数字（2,000万）を覚えない。'
        },
        linked_tags: ['贈与税', '住宅取得等資金', '非課税'],
        linked_output_modes: ['active_recall', 'number_recall'],
        source_trace: [{ type: 'official_guide', id: 'NTA_4508', text: '国税庁：住宅取得等資金贈与' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_regulatory_embankment_act',
        title: '宅地造成及び特定盛土等規制法',
        category: '法令上の制限',
        conclusion: '宅地造成だけでなく「盛土」「土石の堆積」も広く規制。知事の許可が必要な区域と、届出が必要な区域がある。',
        purpose: '盛土等に伴う崖崩れや土砂流出による災害を防止し、国民の生命・財産を守る（熱海等の災害を受けた法改正）。',
        requirements: ['工事規制区域または特定盛土等規制区域内', '一定規模以上の盛土・切土・堆積'],
        legal_effect: '許可なく工事を行うと、工事停止命令や強力な罰則。',
        principle: '規制区域内で造成等を行う場合は、工事着手前に知事の許可が必要。',
        exceptions: ['届出：区域指定の際、既に進行中の工事は21日以内に届け出れば許可不要。'],
        cases: {
            concrete_example: '規制区域内で高さ2mを超える盛土をする場合、許可が必要。',
            counter_example: '宅地造成だけでなく、農地や森林において行う「盛土」であっても、災害リスクがあれば規制対象となる。'
        },
        comparison: [],
        trap_points: ['「宅地以外の土地で行う盛土には適用されない」とする誤り（改正により広く対象となった）'],
        understanding_visual: {
            type: 'case_flow',
            title: '盛土規制法の適用判定',
            columns: ['ステップ', '判定内容'],
            rows: [
                { label: '1. 区域のチェック', cells: ['工事規制区域 または 特定盛土等規制区域か？', 'どちらでもなければ法規制外'], emphasis: 'neutral' },
                { label: '2. 行為のチェック', cells: ['盛土・切土・土石の堆積か？', '目的を問わず（宅地・農地・森林）対象'], emphasis: 'rule' },
                { label: '3. 規模のチェック', cells: ['高さ・面積が基準（2m超等）以上か？', '基準超 ＝ 知事の許可が必要'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「都市計画区域内」でなければ許可は不要だとする',
                why_wrong: '盛土規制法は「災害リスク」で区域を決めるため、都市計画区域の内外を問わず指定される。',
                correct_rule: '都市計画法とは別の観点で区域が指定される点に注意。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「21日以内」',
                check: '区域指定時に既に行っている工事の届出期間を確認。',
                answer_pattern: '21日以内の届出 ＝ 進行中工事の継続要件。'
            }
        ],
        check_question: {
            question: '宅地造成等工事規制区域の指定の際、現に工事を行っている者は、その指定の日から21日以内に、知事に届け出なければならない。',
            answer: '○',
            explanation: '法改正後も維持されている経過措置の届出規定です。'
        },
        repair_explanation: {
            short_note: '旧・宅造法より「名前も範囲も広がった」のが盛土規制法。農地でも山でも、危ない盛り土はダメ。',
            common_mistake: '旧法（宅地のみ）のイメージで農地等を規制外としてしまうミス。'
        },
        linked_tags: ['盛土規制法', '宅地造成', '災害防止'],
        linked_output_modes: ['active_recall'],
        source_trace: [{ type: 'official_guide', id: 'MLIT_MORIDO', text: '国土交通省：盛土規制法パンフレット' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_brokerage_security_deposits_vs_assoc',
        title: '営業保証金 vs 保証協会',
        category: '宅建業法',
        conclusion: '営業保証金は「自分で供託所に預ける」、保証協会は「分担金を協会に預け、協会が供託する」。',
        purpose: '取引相手の損害を補填するための金銭的裏付けを確保し、不動産取引の安全を図る。',
        requirements: ['営業保証金：主たる事務所1,000万、従たる事務所50万', '保証協会：分担金（主60万、従30万）の納付'],
        legal_effect: '供託・納付が完了し、届出をしなければ事業を開始できない。',
        principle: '業者はどちらか一方の制度を選択しなければならない（重複不可）。',
        exceptions: ['還付：営業保証金は全額から。保証協会は「分担金」の額に関わらず、営業保証金と同額まで弁済を受けられる。'],
        cases: {
            concrete_example: '保証協会に入っている業者が支店を1つ増やす場合、30万円の分担金を納付すればよい。',
            counter_example: '保証協会に加入した後に、以前供託していた営業保証金を取り戻すには、供託所から公告なしで取り戻せる。'
        },
        comparison: [{ target_tag: '保証協会', difference: '保証協会は全国に2つ（全日・宅注）。加入すれば営業保証金の供託は不要。' }],
        trap_points: ['「保証協会に加入していても、営業保証金を直接供託しなければならない」とする誤り'],
        understanding_visual: {
            type: 'comparison_matrix',
            title: '2つの消費者保護制度の比較',
            columns: ['営業保証金', '保証協会（弁済業務）'],
            rows: [
                { label: '供託・納付先', cells: ['最寄りの供託所', '保証協会（東京）'], emphasis: 'rule' },
                { label: '主たる事務所額', cells: ['1,000 万円', '60 万円（分担金）'], emphasis: 'rule' },
                { label: '従たる事務所額', cells: ['50 万円', '30 万円（分担金）'], emphasis: 'neutral' },
                { label: '取戻しの公告', cells: ['原則必要（6ヶ月）', '不要（協会経由なら）'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「保証協会に納付した分担金」の範囲内でしか、取引相手は弁済を受けられないとする',
                why_wrong: '取引相手は、その業者が「営業保証金」制度を利用していた場合と同額（主1,000万＋従50万×数）まで弁済を受けられる。',
                correct_rule: '分担金の額と弁済を受けられる限度額は別物。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「営業保証金」か「分担金」か',
                check: '金額（1,000万/50万 vs 60万/30万）と行き先を確認。',
                answer_pattern: '金額と行き先の組み合わせが逆なら間違い。'
            }
        ],
        check_question: {
            question: '宅建業者が保証協会の社員となったときは、その加入の日から2週間以内に、弁済業務保証金分担金を保証協会に納付しなければならない。',
            answer: '×',
            explanation: '保証協会の社員になろうとする者は、加入の日「までに」分担金を納付しなければなりません。'
        },
        repair_explanation: {
            short_note: '営業保証金は「高いが自分勝手」、保証協会は「安いがルールが細かい」。',
            common_mistake: '分担金の納付期限（加入の日まで）と、営業保証金の供託期限（免許から3ヶ月等）の混同。'
        },
        linked_tags: ['営業保証金', '保証協会', '弁済業務保証金'],
        linked_output_modes: ['active_recall', 'comparison_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法25条, 64条の2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_brokerage_cooling_off_master',
        title: 'クーリング・オフ（37条の2）',
        category: '宅建業法',
        conclusion: '「テント張りの案内所」等、事務所等以外の場所で申し込んだ場合、8日以内なら無条件で解除できる。',
        purpose: '不意打ち的な勧誘により、冷静な判断ができないまま申し込んだ買主を保護する。',
        requirements: ['売主が宅建業者、買主が非業者', '事務所等以外の場所での申込み', '書面告知から8日以内', '引渡し＋代金全額支払の未了'],
        legal_effect: '書面により申込みの撤回・契約の解除ができる。損害賠償・違約金の支払いは不要。',
        principle: '事務所、継続的に業務を行う施設、買主が申し出た自宅・勤務先では不可。',
        exceptions: ['告知：クーリング・オフできる旨を「書面」で告げられた日から起算して8日を経過すると不可。'],
        cases: {
            concrete_example: '喫茶店で執拗に勧誘されて申し込んだ。翌日、解除したい旨の書面を出せば全額返金される。',
            counter_example: '自ら指定した自宅で申し込んだ場合は、冷静な判断が可能とみなされ、クーリング・オフはできない。'
        },
        comparison: [],
        trap_points: ['「代金の一部を支払っていれば、もう解除できない」とする誤り（引渡し＋全額支払が揃わない限り可能）'],
        understanding_visual: {
            type: 'case_flow',
            title: 'クーリング・オフ可否判定フロー',
            columns: ['チェックステップ', '不可となる条件'],
            rows: [
                { label: '1. 場所のチェック', cells: ['事務所等（テント張り案内所等除く）か？', 'YES ＝ 不可'], emphasis: 'neutral' },
                { label: '2. 期間のチェック', cells: ['書面告知から8日以内か？', 'NO (9日目以降) ＝ 不可'], emphasis: 'rule' },
                { label: '3. 完了状況のチェック', cells: ['引渡し ＋ 代金全額支払 が済んでいるか？', 'YES ＝ 不可'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「土地に定着した案内所」を事務所等ではないとして、クーリング・オフ可能だとする',
                why_wrong: '土地に定着し、専任の宅建士を置く案内所は「事務所等」に該当し、そこでの申込みは解除不可。',
                correct_rule: '「テント張り」のように移動が容易なものが対象。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「自宅」または「勤務先」',
                check: '「買主が申し出た」か「業者が押しかけた」かを確認。',
                answer_pattern: '買主の申し出 ＝ 解除不可。業者の申し出 ＝ 解除可能。'
            }
        ],
        check_question: {
            question: '宅建業者が自ら売主となる建物の売買契約において、買主がホテルのロビーで買受けの申込みをした場合、代金の全額を支払い、かつ、建物の引渡しを受けていても、クーリング・オフによる契約の解除ができる。',
            answer: '×',
            explanation: '「引渡し」と「代金全額支払」の両方が完了している場合は、もはやクーリング・オフはできません。'
        },
        repair_explanation: {
            short_note: '「場所・期間・完了」の3つの壁をすべてクリアしたときだけ解除できます。',
            common_mistake: '買主が宅建業者（プロ）の場合でも適用されると勘違いするミス（業者間は適用外）。'
        },
        linked_tags: ['クーリングオフ', '37条の2', '申込みの撤回'],
        linked_output_modes: ['active_recall', 'trap_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法37条の2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    },
    {
        unit_id: 'unit_brokerage_deposit_protection_master',
        title: '手付金等保全措置',
        category: '宅建業法',
        conclusion: '未完成は5％・1,000万、完成は10％・1,000万超で保全が必要。業者が倒産しても手付が返るようにするため。',
        purpose: '自ら売主の業者が倒産等した場合に、買主が支払済みの金銭を確実に回収できるようにする。',
        requirements: ['売主が宅建業者、買主が非業者', '一定額を超える手付金等の受領', '工事完了前か後かによる基準'],
        legal_effect: '保全措置を講じない限り、業者は基準額を超える金銭を受領できない。',
        principle: '未完成物件：代金の5％超 または 1,000万円超。',
        exceptions: ['完成物件：代金の10％超 または 1,000万円超。登記を済ませた場合は保全不要。'],
        cases: {
            concrete_example: '3,000万円の未完成マンション。150万円（5％）までは保全なしで受け取れるが、160万円なら保全が必要。',
            counter_example: '買主が宅建業者の場合は、この保全措置のルールは適用されない（業者間免除）。'
        },
        comparison: [],
        trap_points: ['「完成物件でも、5％を超えれば保全が必要である」とする誤り（完成は10％基準）'],
        understanding_visual: {
            type: 'calculation_flow',
            title: '保全措置が必要な金額の判定',
            columns: ['ステップ', '計算式・条件'],
            rows: [
                { label: '1. 物件の状態確認', cells: ['未完成物件 か？ 完成物件 か？', ''], emphasis: 'neutral' },
                { label: '2. 基準パーセント', cells: ['未完成 ＝ 5％', '完成 ＝ 10％'], emphasis: 'rule' },
                { label: '3. 金額基準', cells: ['上記 ％ 超', 'または 1,000万円 超'], emphasis: 'rule' },
                { label: '4. 判定', cells: ['いずれか一条件でも満たせば', '受領前に保全措置が必須'], emphasis: 'trap' }
            ]
        },
        trap_details: [
            {
                trap: '「所有権移転登記」が済んでいても、引渡し前なら保全が必要だとする',
                why_wrong: '買主の名義に登記が済んでいれば、買主の権利は保全されているため、金額に関わらず保全措置は不要。',
                correct_rule: '登記済み ＝ 保全不要。'
            }
        ],
        exam_reading_guide: [
            {
                signal: '「未完成」か「完成」か',
                check: '問題文の冒頭で物件の完成状態を特定。',
                answer_pattern: '未完成なら「5％」、完成なら「10％」の数字を瞬時に呼ぶ。'
            }
        ],
        check_question: {
            question: '宅建業者は、自ら売主として、完成済みの建物を4,000万円で売却する場合、買主から400万円の手付金を受領しようとするときは、保全措置を講ずる必要はない。',
            answer: '○',
            explanation: '完成物件は「10％超（400万超）」または「1,000万超」で保全が必要です。ちょうど400万（10％以下）なら不要です。'
        },
        repair_explanation: {
            short_note: '「ミ（未）カンは 5（ゴ）円、カン（完）セーは 10（トウ）円」と覚えましょう（1,000万超は共通）。',
            common_mistake: '未完成と完成のパーセント（5％と10％）を逆にするミス。'
        },
        linked_tags: ['手付金等保全措置', '自ら売主制限', '41条'],
        linked_output_modes: ['active_recall', 'number_recall'],
        source_trace: [{ type: 'law', id: '327AC1000000176', text: '宅建業法41条, 41条の2' }],
        quality_flags: { is_placeholder: false, low_confidence: false, needs_human_review: false, contradiction_suspected: false },
        created_at: 1715126400000,
        updated_at: 1715126400000
    }
];
