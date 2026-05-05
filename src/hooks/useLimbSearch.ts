import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Limb } from '../db';

/**
 * AI生成タグや分野に基づき、インテリジェントに肢を検索・抽出するカスタムフック
 */
export function useLimbSearch(filters: {
  categoryMajor?: string;
  categoryMinor?: string;
  tag?: string;
  minImportance?: number;
}) {
  return useLiveQuery(async () => {
    let collection = db.limbs.toCollection();

    // カテゴリフィルタ
    if (filters.categoryMajor) {
      collection = db.limbs.where('category_major').equals(filters.categoryMajor);
    } else if (filters.tag) {
      collection = db.limbs.where('tags').equals(filters.tag);
    }

    // クエリ実行
    let results = await collection.toArray();

    // 細目(category_minor)でフィルタ
    if (filters.categoryMinor) {
      results = results.filter((l: Limb) => l.category_minor === filters.categoryMinor);
    }

    // 重要度でフィルタ
    if (filters.minImportance) {
      results = results.filter((l: Limb) => l.importance >= (filters.minImportance || 0));
    }

    // 比較の軸(contrast_axis)ごとにグループ化して返す
    const grouped = results.reduce((acc: Record<string, Limb[]>, limb: Limb) => {
      const axis = limb.contrast_axis || 'その他';
      if (!acc[axis]) acc[axis] = [];
      acc[axis].push(limb);
      return acc;
    }, {} as Record<string, Limb[]>);

    return {
      all: results,
      grouped,
      count: results.length
    };
  }, [filters.categoryMajor, filters.categoryMinor, filters.tag, filters.minImportance]);
}
