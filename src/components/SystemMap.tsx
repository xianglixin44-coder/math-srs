import { useState } from 'react';
import { ChevronRight, ChevronDown, Network, ArrowRight } from 'lucide-react';

interface TreeNode {
  id: string;
  label: string;
  color: string;
  children?: TreeNode[];
}
interface CrossLink { from: string; to: string; label: string; }

const COLORS: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  algebra: { bg: '#EBF4FF', border: '#3182CE', dot: '#3182CE', text: '#2B6CB0' },
  geometry: { bg: '#F0FFF4', border: '#38A169', dot: '#38A169', text: '#276749' },
  prob: { bg: '#FFFFF0', border: '#D69E2E', dot: '#D69E2E', text: '#975A16' },
  tool: { bg: '#FAF5FF', border: '#805AD5', dot: '#805AD5', text: '#553C9A' },
  core: { bg: '#F7FAFC', border: '#4A5568', dot: '#4A5568', text: '#2D3748' },
  root: { bg: '#FFFFFF', border: '#1A202C', dot: '#1A202C', text: '#1A202C' },
};

const LINKS: CrossLink[] = [
  { from: 'a5-4', to: 'g1-4', label: '三角公式→解三角形' },
  { from: 'g1-1', to: 'g2-0', label: '向量→复数代数化' },
  { from: 'g3-3', to: 'g4-3', label: '几何→向量替代证明' },
  { from: 'c1-2', to: 'p3-2', label: '组合→分布系数' },
];

const NODE_TO_LECTURE: Record<string, string> = {
  'a1-1': '01-01-01', 'a1-2': '01-01-03', 'a1-3': '01-01-04', 'a1-4': '01-01-05',
  'a2-1': '02-01-01', 'a2-2': '02-02-01', 'a2-3': '02-03-01',
  'a3-1': '03-01-01', 'a3-2': '03-02-01', 'a3-3': '03-02-02', 'a3-4': '03-03-00',
  'a4-1': '04-01-01', 'a4-2': '04-02-02', 'a4-3': '04-04-01', 'a4-4': '04-05-01',
  'a5-1': '05-01-01', 'a5-2': '05-03-01', 'a5-3': '05-04-02', 'a5-4': '05-05-01',
  'g1-1': '06-02-01', 'g1-4': '06-04-01',
  'g2-1': '07-01-01', 'g2-2': '07-02-01',
  'g3-1': '08-01-01', 'g3-2': '08-03-00', 'g3-3': '08-00-00',
  'p1-1': '09-01-00', 'p1-2': '09-02-00',
  'p2-1': '10-01-01', 'p2-3': '10-02-00',
  'a6-1': '14-01-02', 'a6-2': '14-01-03', 'a6-3': '14-01-04',
  'g4-1': '11-01-01', 'g4-2': '11-01-03', 'g4-3': '11-01-04',
  'g5-1': '12-01-01', 'g5-2': '12-01-02', 'g5-3': '12-01-03', 'g5-4': '12-01-04',
  'g6-1': '13-01-01', 'g6-2': '13-01-02', 'g6-3': '13-01-03',
};

const TREE: TreeNode = {
  id: 'root', label: '高中数学完整体系', color: 'root', children: [
    { id: 'd1', label: '代数与分析', color: 'algebra', children: [
      { id: 'a1-0', label: '集合与常用逻辑用语', color: 'algebra', children: [
        { id: 'a1-1', label: '集合概念与表示', color: 'algebra' },
        { id: 'a1-2', label: '集合基本运算', color: 'algebra' },
        { id: 'a1-3', label: '充分与必要条件', color: 'algebra' },
        { id: 'a1-4', label: '全称与存在量词', color: 'algebra' },
      ]},
      { id: 'a2-0', label: '一元二次函数、方程和不等式', color: 'algebra', children: [
        { id: 'a2-1', label: '等式与不等式性质', color: 'algebra' },
        { id: 'a2-2', label: '基本不等式', color: 'algebra' },
        { id: 'a2-3', label: '二次函数与一元二次方程/不等式', color: 'algebra' },
      ]},
      { id: 'a3-0', label: '函数的概念与性质', color: 'algebra', children: [
        { id: 'a3-1', label: '函数概念与表示', color: 'algebra' },
        { id: 'a3-2', label: '函数单调性', color: 'algebra' },
        { id: 'a3-3', label: '函数奇偶性', color: 'algebra' },
        { id: 'a3-4', label: '幂函数', color: 'algebra' },
      ]},
      { id: 'a4-0', label: '指数函数与对数函数', color: 'algebra', children: [
        { id: 'a4-1', label: '指数与对数运算', color: 'algebra' },
        { id: 'a4-2', label: '指数函数及其应用', color: 'algebra' },
        { id: 'a4-3', label: '对数函数及其应用', color: 'algebra' },
        { id: 'a4-4', label: '函数零点与方程应用', color: 'algebra' },
      ]},
      { id: 'a5-0', label: '三角函数', color: 'algebra', children: [
        { id: 'a5-1', label: '弧度制与任意角', color: 'algebra' },
        { id: 'a5-2', label: '三角函数诱导公式', color: 'algebra' },
        { id: 'a5-3', label: '三角函数图象与性质', color: 'algebra' },
        { id: 'a5-4', label: '三角恒等变换', color: 'algebra' },
      ]},
      { id: 'a6-0', label: '数列 ⭐', color: 'core', children: [
        { id: 'a6-1', label: '等差数列及其前n项和', color: 'core' },
        { id: 'a6-2', label: '等比数列及其前n项和', color: 'core' },
        { id: 'a6-3', label: '数学归纳法', color: 'core' },
      ]},
      { id: 'a7-0', label: '一元函数的导数及其应用 ⭐', color: 'core', children: [
        { id: 'a7-1', label: '导数概念与几何意义', color: 'core' },
        { id: 'a7-2', label: '导数的运算公式与法则', color: 'core' },
        { id: 'a7-3', label: '导数在研究函数中的应用', color: 'core' },
      ]},
    ]},
    { id: 'd2', label: '几何与代数', color: 'geometry', children: [
      { id: 'g1-0', label: '平面向量及其应用', color: 'geometry', children: [
        { id: 'g1-1', label: '平面向量运算', color: 'geometry' },
        { id: 'g1-2', label: '平面向量基本定理', color: 'geometry' },
        { id: 'g1-3', label: '平面向量坐标表示', color: 'geometry' },
        { id: 'g1-4', label: '解三角形应用', color: 'geometry' },
      ]},
      { id: 'g2-0', label: '复数', color: 'geometry', children: [
        { id: 'g2-1', label: '复数概念与几何意义', color: 'geometry' },
        { id: 'g2-2', label: '复数的四则运算', color: 'geometry' },
        { id: 'g2-3', label: '复数的三角表示', color: 'geometry' },
      ]},
      { id: 'g3-0', label: '立体几何初步', color: 'geometry', children: [
        { id: 'g3-1', label: '空间几何体与直观图', color: 'geometry' },
        { id: 'g3-2', label: '几何体的表面积与体积', color: 'geometry' },
        { id: 'g3-3', label: '点线面位置关系及判定', color: 'geometry' },
      ]},
      { id: 'g4-0', label: '空间向量与立体几何 ⭐', color: 'core', children: [
        { id: 'g4-1', label: '空间向量运算及基本定理', color: 'core' },
        { id: 'g4-2', label: '空间向量坐标表示', color: 'core' },
        { id: 'g4-3', label: '空间向量在立体几何中应用', color: 'core' },
      ]},
      { id: 'g5-0', label: '直线和圆的方程', color: 'geometry', children: [
        { id: 'g5-1', label: '倾斜角与斜率', color: 'geometry' },
        { id: 'g5-2', label: '直线方程求法', color: 'geometry' },
        { id: 'g5-3', label: '交点与距离公式', color: 'geometry' },
        { id: 'g5-4', label: '圆的方程及位置关系', color: 'geometry' },
      ]},
      { id: 'g6-0', label: '圆锥曲线的方程 ⭐', color: 'core', children: [
        { id: 'g6-1', label: '椭圆方程与几何性质', color: 'core' },
        { id: 'g6-2', label: '双曲线方程与几何性质', color: 'core' },
        { id: 'g6-3', label: '抛物线方程与几何性质', color: 'core' },
      ]},
    ]},
    { id: 'd3', label: '概率与统计', color: 'prob', children: [
      { id: 'p1-0', label: '统计', color: 'prob', children: [
        { id: 'p1-1', label: '随机抽样', color: 'prob' },
        { id: 'p1-2', label: '用样本估计总体', color: 'prob' },
      ]},
      { id: 'p2-0', label: '概率', color: 'prob', children: [
        { id: 'p2-1', label: '随机事件与样本空间', color: 'prob' },
        { id: 'p2-2', label: '古典概型计算', color: 'prob' },
        { id: 'p2-3', label: '事件的独立性', color: 'prob' },
        { id: 'p2-4', label: '频率与概率的关系', color: 'prob' },
      ]},
      { id: 'p3-0', label: '随机变量及其分布 ⭐', color: 'core', children: [
        { id: 'p3-1', label: '条件概率与全概率公式', color: 'core' },
        { id: 'p3-2', label: '离散型随机变量及其分布列', color: 'core' },
        { id: 'p3-3', label: '正态分布及其性质', color: 'core' },
      ]},
      { id: 'p4-0', label: '成对数据的统计分析', color: 'prob', children: [
        { id: 'p4-1', label: '成对数据的相关性', color: 'prob' },
        { id: 'p4-2', label: '一元线性回归模型', color: 'prob' },
        { id: 'p4-3', label: '独立性检验及应用', color: 'prob' },
      ]},
    ]},
    { id: 'd4', label: '计数原理', color: 'tool', children: [
      { id: 'c1-0', label: '计数原理', color: 'tool', children: [
        { id: 'c1-1', label: '分类与分步计数原理', color: 'tool' },
        { id: 'c1-2', label: '排列与组合公式及应用', color: 'tool' },
        { id: 'c1-3', label: '二项式定理及二项式系数', color: 'tool' },
      ]},
    ]},
  ]
};

function flatNodes(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  if (node.children) node.children.forEach(c => result.push(...flatNodes(c)));
  return result;
}
const FLAT = flatNodes(TREE);
const nodeMap = new Map(FLAT.map(n => [n.id, n]));

function TreeNodeView({ node, depth = 0, onNavigate }: { node: TreeNode; depth?: number; onNavigate?: (id: string) => void }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const c = COLORS[node.color] ?? COLORS.root;
  const lectureId = NODE_TO_LECTURE[node.id];
  const isLeaf = !hasChildren && !!lectureId;

  const handleClick = () => {
    if (hasChildren) { setOpen(!open); return; }
    if (isLeaf && onNavigate) onNavigate(lectureId);
  };

  return (
    <div className="select-none">
      <div
        onClick={handleClick}
        className={`flex items-center gap-1.5 py-1 px-1.5 rounded transition-colors ${(hasChildren || isLeaf) ? 'cursor-pointer hover:bg-black/5' : 'cursor-default'}`}
        style={{ paddingLeft: depth * 14 + 2 }}
        title={isLeaf ? '点击跳转到讲解' : undefined}
      >
        {hasChildren ? (
          open ? <ChevronDown size={13} className="text-gray-400 shrink-0" /> : <ChevronRight size={13} className="text-gray-400 shrink-0" />
        ) : (
          <span className="w-[13px] shrink-0" />
        )}
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
        <span className="text-[13px] truncate" style={{ color: c.text, fontWeight: depth <= 1 ? 600 : 400 }}>
          {node.label}
        </span>
      </div>
      {open && hasChildren && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNodeView key={i} node={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SystemMap({ onNavigate }: { onNavigate?: (lectureId: string) => void }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200">
        <Network size={18} className="text-blue-600" />
        <h1 className="text-base font-bold text-gray-800">高中数学知识体系</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mb-3 flex gap-3 flex-wrap px-1">
          {Object.entries({ algebra: '代数', geometry: '几何', prob: '概率', tool: '计数', core: '核心 ⭐' }).map(([k, v]) => {
            const c = COLORS[k];
            return <div key={k} className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />{v}</div>;
          })}
        </div>
        <TreeNodeView node={TREE} onNavigate={onNavigate} />
        <div className="mt-4 pt-3 border-t border-gray-100 px-1">
          <div className="text-[11px] font-semibold text-gray-400 mb-2">跨板块关联</div>
          {LINKS.map((l, i) => {
            const from = nodeMap.get(l.from);
            const to = nodeMap.get(l.to);
            if (!from || !to) return null;
            return (
              <div key={i} className="flex items-center gap-1.5 py-0.5 text-[12px] text-gray-400">
                <span style={{ color: COLORS[from.color].text }}>{from.label}</span>
                <ArrowRight size={11} className="text-gray-300 shrink-0" />
                <span style={{ color: COLORS[to.color].text }}>{to.label}</span>
                <span className="text-[10px] text-gray-300 ml-1">({l.label})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
