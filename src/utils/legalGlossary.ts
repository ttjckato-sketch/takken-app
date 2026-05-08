export interface GlossaryTerm {
  term: string;
  reading?: string;
  meaning: string;
  layman_explanation: string;
  context: 'takken' | 'chintai' | 'both';
  related_terms?: string[];
  note?: string;
}

export const LEGAL_GLOSSARY: GlossaryTerm[] = [
  {
    term: '抵当権',
    reading: 'ていとうけん',
    meaning: '借金の担保として、不動産を占有し続けたまま確保する権利。',
    layman_explanation: '借金を返せなくなった時に、銀行がその家を売ってお金に換えることができる権利。住み続けることはできる。',
    context: 'both'
  },
  {
    term: '所有権',
    reading: 'しょゆうけん',
    meaning: '法令の制限内において、自由にその物の使用、収益及び処分をする権利。',
    layman_explanation: 'その物を「使う」「貸してお金を得る」「売る」ことが自由にできる、最も強い権利。',
    context: 'both'
  },
  {
    term: '占有',
    reading: 'せんゆう',
    meaning: '物を自己のためにする意思をもって、事実上支配している状態。',
    layman_explanation: '実際にその物を持っている、あるいはその場所に住んでいるという「事実上の状態」。',
    context: 'both'
  },
  {
    term: '不法占拠',
    reading: 'ふほうせんきょ',
    meaning: '正当な権原なく、他人の土地や建物を占有すること。',
    layman_explanation: '勝手に他人の土地に居座ったり、建物を使い続けたりすること。',
    context: 'both'
  },
  {
    term: '妨害排除請求',
    reading: 'ぼうがいはいじょせいきゅう',
    meaning: '所有権などの行使が妨害されている場合に、その妨害を取り除くよう求める権利。',
    layman_explanation: '他人が勝手に置いた物をどかせたり、勝手に住んでいる人に出て行くよう求めること。',
    context: 'both'
  },
  {
    term: '標準地',
    reading: 'ひょうじゅんち',
    meaning: '地価公示において、土地鑑定委員会が価格を判定するために選定した地点。',
    layman_explanation: 'その地域の土地価格の「基準」として選ばれた代表的な場所。',
    context: 'takken'
  },
  {
    term: '土地鑑定委員会',
    reading: 'とちかんていいいんかい',
    meaning: '国土交通省に置かれる審議会等で、地価公示の実施主体。',
    layman_explanation: '地価公示（土地の値段の発表）を行う、国の専門家チーム。',
    context: 'takken'
  },
  {
    term: '関係市町村の長',
    reading: 'かんけいしちょうそんのちょう',
    meaning: '地価公示において、公示価格の書面を一般の閲覧に供する役割を持つ。',
    layman_explanation: '市役所や町村役場のトップ（市長・町長）。公示された価格を市民が見れるように準備する。',
    context: 'takken'
  },
  {
    term: '媒介契約',
    reading: 'ばいかいけいやく',
    meaning: '宅建業者が不動産の売買や交換の仲介を依頼主と結ぶ契約。',
    layman_explanation: '「私の家を売ってください」「家を探してください」というお願いを不動産屋さんに正式にする契約。',
    context: 'takken'
  },
  {
    term: '重要事項説明',
    reading: 'じゅうようじこうせつめい',
    meaning: '契約締結前に、物件や取引条件の重要な内容を宅建士が説明すること。',
    layman_explanation: '契約のハンコを押す前に、「この家はこういう状態です」「こういうルールがあります」という大事な話をプロから聞くこと。',
    context: 'both'
  },
  {
    term: '35条書面',
    reading: 'さんじゅうごじょうしょめん',
    meaning: '宅建業法35条に基づき、重要事項説明の際に交付される書面。',
    layman_explanation: '重要事項説明の内容が書かれた紙のこと。',
    context: 'takken'
  },
  {
    term: '37条書面',
    reading: 'さんじゅうななじょうしょめん',
    meaning: '契約締結後、遅滞なく交付しなければならない契約内容を記した書面。',
    layman_explanation: '「契約書」に相当するもの。契約が決まった後に渡される、約束の内容をまとめた紙。',
    context: 'takken'
  },
  {
    term: '管理受託契約',
    reading: 'かんりじゅたくけいやく',
    meaning: 'オーナーから賃貸住宅の管理業務（維持保全や金銭管理）を委託される契約。',
    layman_explanation: '大家さんから「アパートの管理（修理の手配や家賃の回収など）をお願いします」と頼まれる契約。',
    context: 'chintai'
  },
  {
    term: 'サブリース',
    reading: 'さぶりーす',
    meaning: '業者がオーナーから一括して借り上げ、さらに第三者に転貸する仕組み。',
    layman_explanation: '不動産業者が大家さんからアパートを全部借りて、それを入居者に貸し出す「また貸し」の仕組み。大家さんは空室に関わらず家賃が入る。',
    context: 'chintai'
  },
  {
    term: '特定賃貸借契約',
    reading: 'とくていちんたいしゃくけいやく',
    meaning: 'サブリース方式において、オーナーと業者の間で結ばれる「マスターリース契約」のこと。',
    layman_explanation: 'サブリース業者が大家さんからアパートを借りる時の契約。',
    context: 'chintai'
  },
  {
    term: '敷金',
    reading: 'しききん',
    meaning: '賃料の不払いや原状回復費用の担保として、借主が貸主に預ける金銭。',
    layman_explanation: '家賃の払い忘れや、部屋を汚した時の修理代のために、最初に預けておく「保証金」。基本的には返ってくる。',
    context: 'both'
  },
  {
    term: '原状回復',
    reading: 'げんじょうかいふく',
    meaning: '退去時に、借主の過失による損傷などを元の状態に戻す義務。',
    layman_explanation: '引っ越す時に、自分が壊したり汚したりした所を直すこと。普通に住んでいて古くなった分（経年劣化）は直さなくてよい。',
    context: 'both'
  },
  {
    term: '業務管理者',
    reading: 'ぎょうむかんりしゃ',
    meaning: '賃貸住宅管理業の各営業所に設置が義務付けられている専門知識を持つ者。',
    layman_explanation: '不動産屋さんの営業所に一人以上いなければならない、管理の知識を持った責任者。',
    context: 'chintai'
  },
  {
    term: '分別管理',
    reading: 'ぶんべつかんり',
    meaning: '預かっている家賃等と、業者の固有財産を分けて管理すること。',
    layman_explanation: '大家さんから預かった家賃と、自分たち（不動産屋）の売上を、別々の銀行口座でごちゃまぜにせず管理すること。',
    context: 'chintai'
  }
];

export function findGlossaryTerms(text: string): GlossaryTerm[] {
  return LEGAL_GLOSSARY.filter(g => text.includes(g.term));
}
