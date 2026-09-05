export type TodoStatus = 'done' | 'in_progress' | 'pending' | 'not_applicable';

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  done: '已完成',
  in_progress: '进行中',
  pending: '待启动',
  not_applicable: '暂不涉及',
};

export interface ITodoItem {
  id: string;
  text: string;
  status: TodoStatus;
}

export interface ITodoCategory {
  id: string;
  name: string;
  icon: string;
  items: ITodoItem[];
}

function makeItems(categoryId: string, texts: string[]): ITodoItem[] {
  return texts.map((text, i) => ({
    id: `${categoryId}_${i + 1}`,
    text,
    status: 'pending' as TodoStatus,
  }));
}

export const TODO_CATEGORIES: ITodoCategory[] = [
  {
    id: 'preparation',
    name: '前期准备与设计',
    icon: '📋',
    items: makeItems('preparation', [
      '明确装修需求与风格偏好',
      '制定总预算及分配方案',
      '选择装修方式（全包/半包/清包）',
      '筛选并对比装修公司/施工队',
      '上门量房',
      '确认平面布局设计图',
      '确认效果图（客厅/餐厅/卧室/厨房/卫生间）',
      '确认施工图及水电点位图',
      '审核详细报价单',
      '签订装修合同（明确工期/付款/增项/保修条款）',
      '办理物业装修许可证及押金',
      '开工交底（业主/设计师/工长全员到场确认）',
    ]),
  },
  {
    id: 'demolition',
    name: '主体拆改',
    icon: '🔨',
    items: makeItems('demolition', [
      '确认墙体性质（承重墙严禁拆除）',
      '拆除非承重墙体/隔断',
      '铲除原有墙皮',
      '新砌墙体（湿区做防水地梁）',
      '封阳台/更换窗户（断桥铝系统窗）',
      '建筑垃圾清运',
    ]),
  },
  {
    id: 'plumbing_electric',
    name: '水电改造',
    icon: '⚡',
    items: makeItems('plumbing_electric', [
      '水电点位定位弹线（业主到场确认）',
      '电路改造（强电：照明/插座/空调/厨房/卫生间分回路）',
      '弱电改造（网络/电视/电话/智能布线）',
      '水路改造（冷热水管，左热右冷，走顶）',
      '下水管包阻尼片+隔音棉',
      '水管打压测试（0.8MPa保持30分钟）',
      '电路绝缘及通断测试',
      '拍照/录像留存管线走向图',
      '索要水电竣工图',
    ]),
  },
  {
    id: 'waterproof',
    name: '防水工程',
    icon: '💧',
    items: makeItems('waterproof', [
      '卫生间防水（淋浴区≥1.8m，其他≥0.3m）',
      '厨房防水（水槽区建议≥1.2m）',
      '阳台防水',
      '管根/阴阳角/地漏重点加强处理',
      '闭水试验48小时（到楼下确认无渗漏）',
    ]),
  },
  {
    id: 'masonry',
    name: '泥瓦工程',
    icon: '🧱',
    items: makeItems('masonry', [
      '墙面地面基层找平',
      '瓷砖进场验收（品牌/型号/色号/破损）',
      '铺贴墙砖（拉毛处理，墙压地工艺）',
      '铺贴地砖（全屋通铺/排版设计）',
      '地漏安装（回字形找坡）',
      '瓷砖空鼓及平整度验收',
      '美缝施工（同色系，卫生间用环氧彩砂）',
    ]),
  },
  {
    id: 'carpentry',
    name: '木工吊顶',
    icon: '🪵',
    items: makeItems('carpentry', [
      '客厅吊顶（轻钢龙骨+石膏板，L型整板防裂）',
      '厨房吊顶（防水石膏板或集成吊顶）',
      '卫生间集成吊顶（铝扣板）',
      '电视/沙发/床头背景墙造型',
      '其他木作（玄关/隔断/造型）',
    ]),
  },
  {
    id: 'painting',
    name: '油漆工程',
    icon: '🎨',
    items: makeItems('painting', [
      '刷墙固/界面剂',
      '石膏找平及阴阳角找直',
      '新旧墙/开槽处挂网格布防裂',
      '批刮耐水腻子（2-3遍）',
      '砂纸打磨至平整光滑',
      '刷底漆（一遍，抗碱防潮）',
      '刷面漆（两遍，电脑调色）',
      '墙面平整度及色差验收',
    ]),
  },
  {
    id: 'installation',
    name: '安装工程',
    icon: '🔧',
    items: makeItems('installation', [
      '中央空调/新风系统安装（吊顶前）',
      '地暖铺设及打压测试（如需）',
      '全屋定制安装（橱柜/衣柜/榻榻米/鞋柜）',
      '木门及门套安装',
      '地板安装',
      '开关插座面板安装（厨房带开关/卫生间防溅盒）',
      '灯具安装',
      '卫浴安装（马桶/花洒/浴室柜/龙头）',
      '五金配件安装（毛巾架/置物架/窗帘杆）',
      '窗帘安装（窗帘盒优于罗马杆）',
      '打胶收口（防霉美容胶）',
    ]),
  },
  {
    id: 'soft_furnishing',
    name: '软装与家电',
    icon: '🛋️',
    items: makeItems('soft_furnishing', [
      '大型家具进场（沙发/床/餐桌/衣柜）',
      '小型家具及边几',
      '家电进场（空调/冰箱/洗衣机/电视/厨房电器）',
      '窗帘布艺搭配',
      '装饰画/饰品/摆件',
      '绿植布置',
    ]),
  },
  {
    id: 'final',
    name: '竣工验收与入住',
    icon: '🏠',
    items: makeItems('final', [
      '开荒保洁（专业保洁公司）',
      '竣工验收（逐项检查，不合格不签字）',
      '索要保修卡及全部资料',
      '通风散味（至少3-6个月）',
      '甲醛/空气质量检测',
      '深度清洁',
      '正式入住',
    ]),
  },
];
