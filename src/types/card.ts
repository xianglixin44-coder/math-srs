export interface CardDim {
  question: string;
  answer: string[] | number;
  options?: string[];
}

export interface ClozeDims {
  formula?: CardDim;
  derive?: CardDim;
}

export interface ChoiceDims {
  trigger?: CardDim;
  geometry?: CardDim;
  trap?: CardDim;
  challenge?: CardDim;
  transform?: CardDim;
}

export interface Dimensions {
  cloze?: ClozeDims;
  choice?: ChoiceDims;
}

export interface Card {
  id: string;
  title: string;
  category?: string;
  motifIds?: string[];
  dimensions: Dimensions;
  srs?: {
    ease_factor: number;
    interval: number;
    due_date: string;
    reps: number;
  } | null;
}

export const DIM_ORDER = ['formula', 'derive', 'trigger', 'geometry', 'trap', 'challenge', 'transform'];
export const DIM_LABELS: Record<string, string> = {
  formula: '核心定义', derive: '解题策略',
  trigger: '题型判别', geometry: '几何直觉',
  trap: '易错点', challenge: '多维原理',
  transform: '知识关联'
};
