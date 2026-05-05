export interface Article35Item {
    id: string;
    title: string;
    description: string;
    tags: string[];
    risk_level: 'low' | 'medium' | 'high';
}

export const ARTICLE_35_TEMPLATE: Article35Item[] = [
    { id: '35-1', title: '登記された権利', description: '所有権、抵当権、差し押さえ等の確認。', tags: ['登記', '抵当権'], risk_level: 'high' },
    { id: '35-2', title: '法令上の制限', description: '都市計画法、建築基準法等の公法上の制限。', tags: ['都市計画法', '建築基準法', '容積率'], risk_level: 'high' },
    { id: '35-3', title: '飲用・電気・ガス', description: 'インフラ整備状況と今後の見通し。', tags: ['インフラ', '水道', '電気'], risk_level: 'low' },
    { id: '35-4', title: '未完成宅地の安全性', description: '造成完了時の形状、構造等。', tags: ['未完成宅地', '開発許可'], risk_level: 'medium' },
    { id: '35-5', title: 'ハザードマップ', description: '水防法に基づく水害リスク情報の提供。', tags: ['ハザードマップ', '水防法'], risk_level: 'high' },
    { id: '35-6', title: '石綿（アスベスト）', description: '石綿使用調査結果の記録の有無。', tags: ['石綿', 'アスベスト'], risk_level: 'medium' },
    { id: '35-7', title: '耐震診断', description: '耐震診断の内容。', tags: ['耐震診断'], risk_level: 'medium' }
];
