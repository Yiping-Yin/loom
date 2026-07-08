# LOOM 工作台 macOS 标准宪章(WORKBENCH MACOS STANDARDS)

> 状态:**PROPOSED** — 22 条标准由 owner 既有法律 + macOS 27 官方标准派生,四个拍板问题(文末)未决。
> 来源:2026-07-08 owner 最高标准「先以 mac 系统标准为主」+「按照最新的27来」;
> 由 2 路 macOS 26/27 官方研究(HIG/Liquid Glass/TextKit 2/Writing Tools)+ 7 维代码审计(109 条 file:line 证据发现)综合。
> 用法:像玻璃语法一样,每轮工作台设计/评审先过这 22 条;保护清单(第三节)防止已做对的回归。

# LOOM 工作台 macOS 标准宪章 + 升级路线图

依据:owner 2026-07-08 最高标准(先查 mac 系统标准 → 有则用 → 无则派生 → 发明是最后手段且必须论证)、既有 owner 法律(系统统一/玻璃法/三栏宪章/中栏原生 rich-text/英文 UI)、macOS 26/27 官方研究、七维代码审计。目标平台 macOS 27 only。

---

## 一、标准宪章(按架构权重排序,每条可测试)

**§1 玻璃只属于导航层,内容层永远无玻璃。** 左栏/工具栏/浮动 chrome 可以是玻璃;中栏文档与阅读页是内容层,禁任何玻璃或半透明材质。全窗只有一块玻璃(underWindowBackground + behindWindow),禁玻璃叠玻璃、禁手绘 tint 层。
〔系统依据:HIG Materials「Don't use Liquid Glass in the content layer」+ adopting-liquid-glass;owner 玻璃法 2026-07-03〕
现状:主窗合规(LoomReflectionRootView.swift:3867-3897,一块材质、appearance=nil);违例残留 = peek backdrop 四层堆叠 + colorScheme 三元色、composer 0.88 不透明填充、Shuttle .hudWindow+72% paper wash。

**§2 三栏壳必须是系统分栏容器。** 列缝 = NSSplitViewController / NavigationSplitView(sidebar+content)+ .inspector 的系统 divider(可拖、可双击折叠、autosave、AX 可调);禁手写 HStack + 自制 mouseDrag resizer + 固定 248pt 常量。
〔系统依据:NSSplitViewController sidebar/inspector 行为 = macOS 26/27 玻璃与 edge-to-edge 迁移全自动;WWDC25-310〕
现状:违例 —— 全部手搭(:229-318 HStack、:6241-6326 自制 resizer、左栏死宽度),「右栏无法调整」bug 即此产物。

**§3 左栏 = 原生 source list。** List(selection:) + .listStyle(.sidebar) + Section/DisclosureGroup,免费获得方向键、type-select、系统选中胶囊(失焦变暗)、VoiceOver 列表语义;禁 ScrollView+Button+手绘 hover。
〔系统依据:Mail/Notes source-list 习语;owner 已批 3-way IA 点名此习语〕
现状:违例 —— 手搭(:2735-2821);但分区逻辑(Projects/Chats/渐进披露/折叠持久化)是好 IA,迁移时原样搬运。

**§4 窗口 chrome 来自系统,声明一次,不靠定时器修补。** 保留 NSToolbar/.toolbar(玻璃用 toolbarBackground 控制而非删除工具栏),标题走 .navigationTitle,交通灯间距归系统;禁手测常量(reflectionTrafficLightClearance=88)、禁 0.75s/2s 修补扫描、禁手建 fallback NSWindow。
〔系统依据:NSToolbar/unified 样式;SwiftUI windowStyle 声明式合同;WWDC25-310〕
现状:违例 —— WindowConfigurator 剥工具栏+5 通知+双延时重申;ReflectionTopBar 手绘标题与白色描边按钮。

**§5 信号色 = 系统 accent(controlAccentColor/.tint),青芒只活在 app icon/品牌 mark;唯一例外 dsAnchor(锚点定位符),且必须单一 token、动态明暗、禁内联 RGB。**
〔系统依据:HIG Color(用户可在系统设置覆盖 accent,只有固定色 sidebar 图标幸免);owner 已 APPROVED〕
现状:违例 —— 64 处 dsThread/thread 残留 + 3 处内联 calibrated cyan(SourceFileView)+ linkTextAttributes 手写 #4BC5DE/#2F8CA0 对 + LoomTokens CSS 变量全解析为青芒。

**§6 中性色全走语义色。** 文字四层 = labelColor→quaternaryLabel;分隔 = separatorColor;表面 = windowBackground/controlBackground/textBackground;状态 = systemRed/Green/Orange(刺眼时用 openQuestionColor 式 blend 派生);禁手写明暗 hex 对、禁把语义色挪作他用、禁彩虹渐变。
〔系统依据:HIG Color「avoid hard-coding system color values」;语义色在玻璃上自动 vibrancy + Increase Contrast〕
现状:违例 —— ds 中性梯全 hex 对(~370 调用点)、dsAlert/Success/Warning 静态 hex、学习 composer 红黄蓝彩虹渐变(:5940-5974,ban-list 项)、muted ink 对比度 2.8:1 不达标。

**§7 编辑器永驻 TextKit 2。** 禁触碰 .layoutManager(一碰即单向降级 TK1),几何/枚举走 NSTextLayoutManager;附件用 NSTextAttachmentViewProvider(禁 NSTextAttachmentCell);禁 NSTextTable 入库;debug 构建挂 willSwitchToNSLayoutManager 观察者做绊线。
〔系统依据:WWDC22-10090;TK1 降级 = Writing Tools 只剩面板 + 27 代文字特性全失〕
现状:违例 —— 5 处 layoutManager 访问 + 2 个 AttachmentCell 子类把旗舰写作面钉死在 TK1。

**§8 重排样式成本 ∝ 编辑量。** 每键路径只允许 editedRange 段落级重导(textStorage didProcessEditing 习语);全文 normalize 只跑 load/paste/drop;typingAttributes 是系统随光标携带样式的机制,只在「标题后新行」等边界条件性覆盖,禁全局重置;视觉态(锚点着色/闪光)只走 rendering attributes,永不入 textStorage。
〔系统依据:NSTextStorageDelegate editedRange 习语;typingAttributes 合同;NSTextLayoutManager rendering attributes〕
现状:违例 —— normalizeDocument 每键全文 O(n) 且无条件重置 typingAttributes(加粗续打即断)。

**§9 撤销完整无泄漏。** 属性级修改必须 shouldChangeText(in:replacementString:nil)…didChangeText() 包裹(测试:⌘B 后 ⌘Z 必回退);换 case 必须 removeAllActions 或 per-case NSUndoManager(测试:切换文档后 ⌘Z 不得重放上一文档的编辑)。
〔系统依据:NSTextView 程序化编辑合同;NSTextViewDelegate.undoManager(for:)〕
现状:违例 —— toggleEmphasis/toggleUnderline 跳过 shouldChangeText;undo 栈跨 case 不清。

**§10 系统文字器官全开。** usesFindBar+isIncrementalSearchingEnabled(⌘F)、isContinuousSpellCheckingEnabled=true(替换/纠错随用户系统设置)、Writing Tools 会话保护(textViewWritingToolsWillBegin/DidEnd 暂停 normalize+save,ignoredRanges 保护 loom://anchor 引文,allowedWritingToolsResultOptions 诚实声明且暂不含 .table)。
〔系统依据:NSTextFinder;NSSpellChecker 用户默认;WWDC24-10168/WWDC25-265〕
现状:缺失 —— ⌘F 在中栏死、拼写检查关、Writing Tools 会话零保护(normalize 会与之打架)。库内范本:SourcePaneScrollCoordinator.swift:108-109。

**§11 快捷键唯一属主,且必见于菜单栏。** 每个组合键 app 内只有一个属主,行为不随侧栏可见性翻转;禁 opacity-0 隐形按钮注册快捷键、禁 performKeyEquivalent 拦截替代菜单路由;格式化走 Format 菜单(TextFormattingCommands / NSFontManager responder-chain),Edit▸Find/Spelling 走 TextEditingCommands。
〔系统依据:HIG 菜单是快捷键唯一注册表(系统设置重映射只见菜单项);AppKit key-equivalent 派发顺序〕
现状:违例 —— ⌘K/⌘N 双注册、⌘⇧N 无菜单、⌘B/I/U 只活在 performKeyEquivalent、无 Format 菜单。

**§12 保留组合键不可侵占。** ⌘P=Print(导入归 File▸Open… ⌘O)、⌃⌘F=系统窗口全屏、⌘?=Loom Help、⌘,=Settings;⌘1-3 终态归三大 destination(Mail 习语),⌃⌘S 归侧栏开合(SidebarCommands)。
〔系统依据:HIG 保留快捷键表〕
现状:违例 —— ⌘P 被 Add files 占、⌃⌘F 被阅读器遮蔽、⌘? 给了 Keyboard Shortcuts、⌘O 空置、⌘T 绑在未上线 Browser(toast no-op)。

**§13 上下文菜单只追加,永不替换。** 一切右键面从 super.menu(for:) / textView(_:menu:for:at:) 的系统菜单打底,LOOM 项只在分隔符后追加;测试:选中文本右键,Look Up/Translate/Writing Tools/Services 必在且顺序不变。
〔系统依据:NSView.menu(for:) 增补习语;owner 四态 gutter 全盘 REVERT 判例 = 本条的血泪来源〕
现状:合规(SourceFileView.swift:3770-3785、editor Coordinator :5122-5137)—— 立为铁律加回归测试。

**§14 文件的渲染、选择、身份全走系统机器。** PDFKit/QLPreviewView 渲染(新格式先过 QuickLook 再论自绘)、NSOpen/NSSavePanel 选择(说明文字用 .message)、文件类型身份用 NSWorkspace.shared.icon(for: UTType)(禁手配 Microsoft/Adobe 记忆色徽章)、QLPreviewView 卸载必 close()、文件行按空格弹 QLPreviewPanel、阅读中文件挂 .navigationDocument 代理图标。
〔系统依据:PDFKit/QuickLookUI/NSWorkspace/Launch Services;owner 系统统一铁律点名〕
现状:渲染与面板合规;徽章双实现违例、close()/空格预览/代理图标缺失。

**§15 锚点跳转 = PDFKit 异步握手,不是猜时间。** 跳转是带 nonce 的命令:PDFViewHolder 存 pendingDestination,.PDFViewDocumentChanged 时 go(to: PDFDestination) 应用;同锚连点两次必须重新滚动;禁固定 sleep + NotificationCenter 广播;阅读位置持久化存 currentDestination(页+点位)而非裸页码。
〔系统依据:PDFView.go(to:) + .PDFViewDocumentChanged;target-action 命令模式〕
现状:违例 —— 450ms sleep 竞态(:1191-1208 → SourceFileView:3161 静默吞跳转),大 PDF 首跳丢、同锚不回滚。

**§16 security-scoped 访问配平;stale bookmark 自动重铸。** 每 URL start 一次、注册表持有、移除时 stop(ContentRootStore 模式);isStale=true 且解析成功 → 立即重铸 bookmarkData 持久化,提示只留给彻底失败。
〔系统依据:App Sandbox bookmark 合同(不配平泄漏内核资源且有硬上限;stale=请刷新不是请用户重加)〕
现状:违例 —— 4 处 start 永不 stop;stale 时转嫁 owner 手工重加。

**§17 排版:chrome 用系统 ramp,书用系统 serif。** UI 文字对齐 macOS text-style 阶(13pt Body 基准),新代码禁发明中间字号;serif 一律 Font.system(design:.serif) / NSFontDescriptor.withDesign(.serif)(= New York,Apple 为长文阅读而设);**Font.custom("EB Garamond"/"Cormorant") 全面禁用 —— 字体根本没装,今天全部静默降级为 SF sans**;文档字号阶唯一真源 = ReflectionDocumentFormat。
〔系统依据:HIG Typography(macOS 无 Dynamic Type);Font.Design.serif〕
现状:违例 —— ~80 处 serif 调用实为坏的;268 处裸 pt vs 16 处语义 text style;DSType 死系统仅 2 调用。

**§18 一切空间移动动效过 Reduce-Motion 门。** 所有 slide/move/scroll 动画经 MotionTokens/accessibilityReduceMotion(reduce → 瞬时或 crossfade);SwiftUI 不会自动帮你。
〔系统依据:HIG Motion;NSWorkspace.accessibilityDisplayShouldReduceMotion〕
现状:部分 —— 36 处动画只有锚点闪光 1 处过门。

**§19 无障碍基线。** icon-only 按钮必带 .accessibilityLabel(+.help);三栏是 VO 容器 landmark(children:.contain + 命名);分栏缝可键盘/AX 调节;永不压制 focus ring;玻璃 state 跟随窗口激活(禁强制 .active);禁 preferredColorScheme 强制外观。
〔系统依据:NSAccessibility;NSVisualEffectView.followsWindowActiveState;HIG Dark Mode + owner 纯跟随系统法〕
现状:部分 —— 标注只覆盖 3/112 文件;无栏级 landmark;resizer 鼠标 only;两处强制 .active;空态强制 dark。

**§20 场景与窗口纪律。** 三大 destination 必须全部活在主窗侧栏(辅助窗只留 supplemental:Ask AI/Help/About);注册即可达(死场景注销并注释理由);已有 App/Help 菜单入口的窗口对 Window 菜单 .commandsRemoved();瞬态面板(Shuttle)= panel 语义 + restorationBehavior(.disabled);Help 菜单项只 raise 永不 toggle-close;Settings 走 Settings scene(⌘,),About 走标准面板语义。
〔系统依据:HIG Windows/菜单剖析;SwiftUI Scene 合同〕
现状:部分 —— Digital Me 流放在辅助 web 窗、Today 不存在(3-way IA 0% 建成);7 个场景污染 Window 菜单;Help 项会关窗;场景注册诚实性本身合规。

**§21 诚实性三则。** 快捷键/菜单不得绑未上线功能(不可用=灰,不是 toast);KeyboardHelp 每行可现场演示且措辞与菜单一致(New Draft/New Topic 二选一,preserve-terminology);用户动作失败用 .alert/presentError 报原因+出路,禁 beep/状态条字符串。
〔系统依据:NSMenuItemValidation;HIG help/error 惯例;app 自己的 2026-07-08 chrome 诚实化合同〕
现状:部分 —— ⌘T toast、3 行说谎的 help、beep-only 拒绝。

**§22 外向系统集成与图标。** 笔记/源/原则入 Core Spotlight(loom:// 回跳);导入/打开过的文件 noteNewRecentDocumentURL + File▸Open Recent;⌘P 能打印笔记与 PDF;CFBundleDocumentTypes 与应用内 allow-list 同源同集(契约测试锁死);app icon 迁 Icon Composer 分层 .icon(方形无遮罩层,系统给六外观),取代手滚 renderMacIconPng 管线。
〔系统依据:Core Spotlight;NSDocumentController;NSPrintOperation;Icon Composer(.icon = 26+ 唯一正典,顺带根治灰板)〕
现状:缺失 —— Spotlight/Recent/Print 零代码;iWork UTI 已漂移;icon 仍是预渲染 PNG。

---

## 二、升级路线图

### Wave 0 —— 现在就能动(不碰任何在途文件)

可改:SourceFileView、IngestionView、ShuttleView、CaptureSheet、LoomDossierRootView、ReflectionModel、ReflectionLearningTrace、LoomTokens、MotionTokens、KeyboardHelpView、ContentRootStore、LoomFileStore、ReflectionDocumentFormat、Info.plist、DataSettingsRows、新文件。

| # | 事项 | 为什么 | 验收 | 量 |
|---|---|---|---|---|
| W0-1 | **Accent 迁移 A 半场**:可改文件里 dsThread/thread→Color.accentColor(CaptureSheet ×13、SourceFileView ×7 含 3 处内联 calibrated cyan、dossier ×2、LearningTrace、parked ×~42);LoomTokens 加动态 dsAnchorNSColor(#4BC5DE 暗/#2F8CA0 亮);dsAlert/Success/Warning→systemRed/Green/Orange;删零调用 token(DSMotion/三个 Muted) | §5§6 已决欠账 | grep dsThread 在可改文件=0;系统 accent 换 Graphite 后全 app 一致 | M |
| W0-2 | **Serif 修复**:LoomTokens.serif/display→Font.system(design:.serif);3 处直接 Font.custom 同改 | §17;当前 serif 全是坏的 | 全 app 无 Font.custom;serif 面渲染为 New York | S |
| W0-3 | **中性梯重指**:LoomTokens 定义处 ds 中性 token→语义色(一处改,370 调用点继承);重写文件头为新合同(系统色优先,只留 dsAnchor+web 桥) | §6;恢复玻璃上 vibrancy 与 Increase Contrast | Increase Contrast 下文字随系统变;muted ink 达 4.5:1 | M |
| W0-4 | **阅读器批**(全在 SourceFileView):①锚点握手 pendingDestination+nonce+.PDFViewDocumentChanged(holder 侧,调用侧留 Wave 1)②⌃⌘F→⇧⌘F ③⌘G/⇧⌘G + beginFindString 异步查找 ④QLPreviewView dismantleNSView→close() ⑤.navigationDocument 代理图标 ⑥currentDestination 位置持久化+键清理 ⑦trace rail 三裸 RGB→语义色 ⑧.menuStyle(.button) | §12§14§15;已排队的 re-scroll 修复落在这 | 同锚连点两次都回滚;30MB PDF 首跳不丢;⌃⌘F 进系统全屏 | M |
| W0-5 | **KeyboardHelp 诚实化**:修 3 行谎(⌘T 删、⌘K 单义、⌘N 措辞统一)| §21 | 每行可现场演示 | S |
| W0-6 | **Shuttle 去 Vellum**:删 paper wash、.hudWindow→.popover/regularMaterial、系统字体、accent 选中(去留见拍板问题 ④) | §1§17 | 单一系统材质,无自定字体 | S |
| W0-7 | **Info.plist + 面板**:LSItemContentTypes 补 iWork UTI + 两列表契约测试;NSOpenPanel title→message(IngestionView 半场) | §22§14 | 拖 .key/.pages 到 Dock 图标被接受 | S |
| W0-8 | **动效门助手**:MotionTokens 加 LoomMotion.animation(_:)(reduce→nil),可改文件的 ~10 处动画先接入 | §18 | Reduce Motion 开启后 Shuttle/reader/AskAI 无空间移动 | S |
| W0-9 | **无障碍标注扫**:Capture/Navigation/AI/DigitalMe 全部 icon-only 按钮补 label+.help | §19 | VO 读出每个按钮名字 | S |
| W0-10 | **Bookmark 配平前半**:ContentRootStore stale 重铸;LoomFileStore 解析一次缓存 | §16 | 移动过的文件夹自愈,不再让 owner 重加 | S |
| W0-11 | **新文件三件**:①TodayView(读 session:Reading now/Open questions/Recent,暂不接线)②Digital Me 原生 destination 壳(基于 LoomDossierRootView)③LoomSpotlightIndexer 挂 store save/delete(loom:// 回跳接线留 Wave 1)④NSPrintOperation builders(Shared) | §20§22;为 Wave 2 IA 备料,零冲突 | 新文件编译+单测过;Spotlight 能搜到笔记标题 | M |
| W0-12 | **Icon Composer 重建**:interlaced L → 分层 .icon(方形无遮罩层);generate-icons.mjs 改产层输入或对 native 目标退役(脚本在 READ-ONLY 名单,只做 .icon 资产侧,脚本改动排 Wave 1) | §22;取代全出血 hack,免费得六外观 | 26+ 无灰板,dark/clear/tinted 变体正确 | M |

### Wave 1 —— 在途并行改动落地后(LoomReflectionRootView / LoomApp / LoomWebView / AboutView / scripts)

| # | 事项 | 为什么 | 验收 | 量 |
|---|---|---|---|---|
| W1-1 | **编辑器正确性批**(一个 PR):①⌘B/I/U 包 shouldChangeText(⌘Z 可回退)②换 case removeAllActions ③typingAttributes 条件重置+空选区 ⌘B 翻 typingAttributes ④normalize→editedRange 段落域(全文 pass 只留 load/paste;range 域纯函数+测试可先落 ReflectionDocumentFormat)⑤usesFindBar+拼写检查 ⑥Writing Tools willBegin/DidEnd 挂起 normalize/save + ignoredRanges 保锚点 | §8§9§10 | 加粗→撤销→复原;切 case 后 ⌘Z 无跨档重放;书长笔记打字不卡;Proofread 不打架 | L |
| W1-2 | **菜单/快捷键归一批**:TextFormattingCommands+TextEditingCommands+Format 菜单(删 performKeyEquivalent 拦截);删 hiddenShortcutButtons(⌘K/⌘N 单属主,⌘⇧N 入菜单);⌘P→File▸Open… ⌘O;⌘?→Loom Help;Help 项 raise 不关;Shuttle 出 Edit 菜单;辅助场景 .commandsRemoved()+restorationBehavior(.disabled);⌃⌘S=SidebarCommands;Print 菜单接 W0-11 builders;Open Recent+noteNewRecentDocumentURL;beep/状态串→.alert | §11§12§20§21§22 | 逐条按宪章测试语句验收 | M |
| W1-3 | **Accent 迁移 B 半场**:linkTextAttributes→controlAccentColor;删彩虹渐变(→accent opacity 阶或删净);root view+LoomWebView CSS 变量青芒残留(--loom-anchor 重键,与在途 themeSyncScript 改动合并);AboutView signalText→accent/品牌青;删 dsThread/thread token(复发=编译错) | §5§6 | grep 青芒 hex 全库=0(除 dsAnchor+icon) | S |
| W1-4 | **Chrome 收尾**:peek backdrop→材质+separatorColor(删 8 处 colorScheme 三元);composer 填充→textBackgroundColor;玻璃 state→followsWindowActiveState;空态强制 dark 摘除(需 owner 过目);glassTooltip 二处按拍板问题 ③ 处理 | §1§19 | 后台窗玻璃变暗;浅色用户首启不精分 | S/M |
| W1-5 | **可达性+文件身份收尾**:三栏 VO landmark;resizer accessibilityAdjustableAction(过渡,W2-1 后自然消亡);Sources 行空格 .quickLookPreview;文件徽章双实现→NSWorkspace 系统图标;jumpToAnchor/openSourceInReader 的 scope 注册表+stale 重铸后半;锚点跳转调用侧接 W0-4 握手,删 450ms sleep | §14§15§16§19 | VO 可跳栏;空格弹 Quick Look;scope 计数不再随捕获增长 | M |
| W1-6 | **产品线并行:openCondition/recall 移植**(masterplan 排队项)—— 开放条件槽入文档模型,按 §8 语义属性方式(presentationIntent 思路)承载,不走 normalize 重刷;Today 的 Open questions 区直接消费它 | 北星「读薄」缺口;与 W1-1 的 normalize 重构同批做最省 | 问题段带 open-condition,Writing Tools 重写后存活 | M |

### Wave 2 —— 结构性(研究已充分支持,深度见拍板问题 ①)

| # | 事项 | 为什么 | 验收 | 量 |
|---|---|---|---|---|
| W2-1 | **壳迁系统分栏**:NavigationSplitView(或 NSSplitViewController)+ .inspector;删自制 resizer/交通灯常量/WindowConfigurator 修补扫描/fallback NSWindow;工具栏回归原生(分组+至多一个 .prominent accent 动作,visibilityPriority+overflowMenu 管窄窗);reflectionReaderTopClearance→系统 scroll edge effect;27 的 edge-to-edge sidebar/semibold 选中自动到手;peek 机器按拍板 ③ | §1§2§4;玻璃法在系统轨道上的完成态(透明列+单玻璃与 split view 完全兼容) | 行为对齐清单全过:侧栏可拖可 ⌃⌘S、玻璃随 27 透明度滑杆两极皆可读、全屏无修补闪烁 | L |
| W2-2 | **3-way IA 折叠**:侧栏顶部 destination 区(Today/Workspace/Digital Me,List source-list);⌘1-3 重映射为 destination(侧栏开合归 ⌃⌘S);Digital Me 入主窗(W0-11 壳),You 行改为选中该 destination;TodayView 接线为首 destination;.searchable(.sidebar) 替换自制搜索框;重启恢复上次 destination;Shuttle 按拍板 ④ 退役或原生重建 | §3§20;宪法 #4 的建成 | 冷启动一击可达三 destination;方向键在侧栏走行;分区逻辑契约测试不回归 | L |
| W2-3 | **TextKit 2 迁移**(独立立项):5 处 layoutManager 访问→NSTextLayoutManager fragment API;AttachmentCell→NSTextAttachmentViewProvider(quote 卡/文件 chip 变真 NSView);闪光→rendering attributes;line-anchor/折叠出处改用 27 新 TextKit 钩子;debug 绊线观察者 | §7;不迁则 27 上 Writing Tools 永久降级 | textLayoutManager != nil 恒真;绊线永不触发;两海拔属性原样通过 | L |
| W2-4 | **文档 API + 外向收尾**:ExportBundle/fileExporter 上新 Document 协议(FileDocument 已废弃);App Intents 薄层(New Note/Capture/Open Today)+ 笔记工具栏 ShareLink;@State 宏 init 赋值语义排查(27 SDK 潜伏 bug) | §22;27 唯一正典 | 备份导出走 fileExporter;快捷指令能建笔记 | M |

### 效率注记
- 依赖链:W0-11(Today/DigitalMe 壳)→ W2-2;W0-4(握手 holder 侧)→ W1-5(调用侧);W1-1(normalize 重构)与 W1-6(openCondition)同批;W2-1 先于 W2-2(destination 区要长在真 List 上)。
- W1-3 的 LoomWebView CSS 改动必须与在途 themeSyncScript 改动合并提交,不可分头。
- 每个 Wave 收尾跑全量测试(当前 421 绿)+ 签名装机活验证;绝不触碰 ~/Library/Application Support/Loom 真数据。

---

## 三、保护清单(已经做对,禁止回归)

1. **一窗一玻璃架构** —— 单 NSVisualEffectView(underWindowBackground/behindWindow)+ appearance=nil + 透明列;Reduce Transparency 因此免费。回归判据:主窗出现第二块 behindWindow 材质即打回。
2. **右键只追加**(PDF super.menu(for:)、editor delegate 追加)—— 四态 gutter REVERT 判例的代码化;加 UI 测试锁死 Look Up/Translate 在场。
3. **阅读器 PDFKit 全家**:PDFThumbnailView/PDFOutline/findString systemYellow 高亮/PDFDestination/Preview 对齐快捷键(⌘9/⌘0/⌘±,含 disabled 校验)/off-main 加载/通知驱动状态;夜间反色是注释里论证过的合法派生,保持 opt-in。
4. **Services 全链**(Info.plist NSServices + provider + 注册;事实修正:快捷键是 **⌘⇧U**,不是 ⌘⇧L)+ loom:// scheme + CFBundleDocumentTypes + application(open:)。
5. **场景注册诚实性**:死窗注销带理由注释、Settings scene 四 tab、单 Help 窗、About 走 .appInfo 替换、New/Export 在惯例 CommandGroup;launch 行为刻意(restoration 关+Dock 重开呈现)。
6. **destructive/modal 纪律**:confirmationDialog(role:)、.sheet、.alert、NSOpen/NSSavePanel 全线;新面禁自造玻璃 sheet 顶替。
7. **两海拔引文形式**:标准属性承载(.link 锚点=单一真源、样式重导、insertText 可撤销)、落点闪光只走 temporary attributes 永不入库(TK2 迁移时移植该不变量+测试)。
8. **两个派生配方范本**:ReflectionDocumentFormat.serifFont(systemFont withDesign(.serif))与 openQuestionColor(systemOrange blend labelColor)—— 宪章引用为「系统没有→从系统派生」的标准做法。
9. **图标 100% SF Symbols**(108 处,零自定资产);新增 Image("asset") 需 owner 论证。
10. **拖放走 NSItemProvider**(IngestionView .onDrop;editor 只截自家 chip 后 super);拖放授权存活期内铸 bookmark(localSource 模式)立为规则。
11. **粘贴即匹配样式** = owner 单墨法(2026-07-05 判例),是有意偏离 ⌘V 惯例 —— 宪章记档,防未来「修回去」。
12. **MotionTokens 门的形状**(纯函数、可测、reduce→瞬时)+ 全库零 focus-ring 压制 —— 新动效一律过此门,永不压 focus ring。
13. **侧栏内容分类法**(Projects›chats/Drafts/Learning/Principles、渐进披露、折叠持久化、学习序 collation)—— List 迁移原样搬运,加分区可见性契约测试。
14. **app 生命周期**:最后窗关不退出、Dock 重开呈现房间、frame autosave。

---

## 四、owner 拍板问题(≤4)

**① Liquid Glass 采纳深度与节奏。** Wave 2 壳迁移(系统 sidebar/inspector 玻璃、scroll edge effect、原生工具栏)是玻璃法在 macOS 27 的官方完成态,但它是最大单笔改动且正面重写 LoomReflectionRootView 壳层。一步到位(W2-1+W2-2 一个大 PR,行为对齐清单验收)还是分两刀(先 split view 骨架、后玻璃/工具栏语法)?研究面证据都支持迁,问题只是您要多大一口。

**② Today 首屏的份量与着陆点。** 最小版(Reading now / Open questions / Recent 三区,纯聚合派生)还是更厚(嵌 the-book 式今日摘要)?冷启动落在 Today 还是维持 Workspace(记住上次 destination)?这决定 W0-11 的建法。

**③ 三个「待再论证」的自定发明去留**:a) 左缘 hover peek 侧栏(系统只在全屏有此习语 —— 删,或限全屏保留);b) Dock 式 glassTooltip 两处(revert 回 .help(),或记为唯一 argued 例外且永不扩散);c) 空态强制 dark(摘除后空态要为浅色重看一眼)。三项都是您曾亲自指方向的,按最高标准需一次性重裁。

**④ Shuttle ⌘K 的命运。** 它索引的是已退役 web IA,现场全是 no-op。退役(⌘K 让给侧栏搜索/未来 destination 切换)还是原生重建(Spotlight 式派生控件,索引三 destination+projects+全文)?连带决定 ⌘K 的唯一属主。
