/**
 * 暖纸 Warm Paper —— browser half.
 *
 * 做法（对照 0.2.1-rc.2 的 Client 契约）：
 *   · 用 ctx.theme.overrideTokens() 在官方明暗主题之上叠一层完整调色板，
 *     明暗两套值都给全（ThemeTokenModes 必须 { light, dark } 成对），
 *     于是「外观：浅色 / 深色 / 跟随系统」照常工作，纸感跟着方案走。
 *   · 排版单独用一张样式表：只设 --dsh-font-family-text，让宿主自己的
 *     `--dsw-font-family` 规则去取它 —— 用户在设置里改过字体时，
 *     行内变量优先，主题不会把用户的选择按掉。
 *   · 纸纹 / 书脊线 / 选区走 HTML 标记 html[data-warm-paper="on"] 门控，
 *     插件卸载即整身撤走，不留半应用的残影。
 *   · 输入框下方注册一枚「日期戳」装饰（conversation.composer.dock），
 *     把逐日收藏的意味放在真正写字的地方。
 */
window.__ModuleLoader__.load({
	id: "dsh-theme-warm-paper",
	factory: (require) => {
		const React = require("react");
		const h = React.createElement;

		const PLUGIN_ID = "dsh-theme-warm-paper";
		const STORAGE_KEY = "dsh-theme-warm-paper.settings";

		/** 所有可调项与默认值；设置页读写同一份状态。 */
		const DEFAULT_SETTINGS = Object.freeze({
			enabled: true,
			tone: "almond",
			grain: "light",
			spine: true,
			serif: true,
			font: "song",
			sidebar: "normal",
			bubble: "brick",
			stamp: "full"
		});

		// 用户气泡的三种口味：砖红 / 陶土 / 纸色（纸色跟随明暗方案，用宿主墨字）。
		const BUBBLE_VARIANTS = Object.freeze({
			brick: {
				fillLight: "#A24B3B",
				fillDark: "#A24B3B",
				highlightLight: "#8C3F31",
				highlightDark: "#8C3F31",
				ink: "#FBF6EB"
			},
			clay: {
				fillLight: "#B5654F",
				fillDark: "#B5654F",
				highlightLight: "#A55641",
				highlightDark: "#A55641",
				ink: "#FBF6EB"
			},
			paper: {
				fillLight: "#EDE2CE",
				fillDark: "#3B3228",
				highlightLight: "#E3D4BC",
				highlightDark: "#453A2F",
				ink: null
			}
		});

		// 书卷气的衬线栈：拉丁共用旧式书刊字体，中文家族可换（宋体 / 思源宋体 / 仿宋）。
		const SERIF_LATIN = "\"Sitka Text\", \"Palatino Linotype\", \"Book Antiqua\", Palatino";
		const SERIF_STACKS = Object.freeze({
			song: `${SERIF_LATIN}, "Songti SC", "STSong", SimSun, "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", Georgia, serif`,
			source: `${SERIF_LATIN}, "Noto Serif SC", "Source Han Serif SC", "Source Han Serif CN", "Songti SC", "STSong", SimSun, Georgia, serif`,
			fangsong: `${SERIF_LATIN}, "FangSong", "STFangsong", "FangSong_GB2312", "Songti SC", SimSun, Georgia, serif`
		});
		const SERIF = SERIF_STACKS.song;

		// ---- 浅色：米杏纸 -------------------------------------------------
		const LIGHT = Object.freeze({
			// 纸面
			"--dsw-alias-bg-base": "#F5EEE0",
			"--dsw-alias-bg-layer-1": "#FBF6EB",
			"--dsw-alias-bg-layer-2": "#F1E8D7",
			"--dsw-alias-bg-layer-3": "#E9DDC8",
			"--dsw-alias-bg-overlay": "#FDF9F1",
			"--dsw-alias-bg-module-platform": "#FBF6EB",
			"--dsw-alias-bg-multi-select": "#F0E6D3",
			"--dsw-alias-bg-skeleton": "rgba(58, 46, 36, 0.07)",
			"--dsw-alias-bg-mask-1": "rgba(58, 46, 36, 0.28)",
			"--dsw-alias-bg-mask-2": "rgba(58, 46, 36, 0.14)",
			"--dsw-alias-bg-mask-3": "rgba(58, 46, 36, 0.46)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(255, 251, 242, 0.72)",
			// 墨色文字
			"--dsw-alias-label-primary": "#3B2F25",
			"--dsw-alias-label-secondary": "#6A5747",
			"--dsw-alias-label-tertiary": "#75624C",
			"--dsw-alias-label-caption": "#79664F",
			"--dsw-alias-label-dimmed": "#F1E8D7",
			"--dsw-alias-label-primary-dimmed": "#3B2F25",
			"--dsw-alias-label-primary-inverted": "#FBF6EB",
			"--dsw-alias-label-primary-foreground": "#FBF6EB",
			"--dsw-alias-label-primary-bluish": "#8E3A33",
			// 砖红主色与按钮
			"--dsw-alias-brand-primary": "#A24B3B",
			"--dsw-alias-brand-primary-invert": "#FBF6EB",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "#A24B3B",
			"--dsw-alias-brand-text": "#A24B3B",
			"--dsw-alias-button-primary-fill": "#A24B3B",
			"--dsw-alias-button-primary-hover": "#8C3F31",
			"--dsw-alias-button-primary-dimmed": "#EFE3CF",
			"--dsw-alias-button-info-fill": "#A24B3B",
			"--dsw-alias-button-info-hover": "#B05A46",
			"--dsw-alias-button-contrast-fill": "#3B2F25",
			"--dsw-alias-button-elevated-fill": "#FBF6EB",
			"--dsw-alias-button-floating-fill": "#FBF6EB",
			"--dsw-alias-button-floating-hover": "#F1E8D7",
			"--dsw-alias-button-ghost-active-border": "#A08A72",
			"--dsw-alias-button-ghost-active-fill": "#F1E8D7",
			"--dsw-alias-button-ghost-active-hover": "#E9DDC8",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(31, 27, 22, 0.36)",
			"--dsw-alias-button-tool-bar-fill": "rgba(84, 72, 58, 0.5)",
			"--dsw-alias-button-tool-bar-hover": "rgba(84, 72, 58, 0.6)",
			// 交互与描边
			"--dsw-alias-interactive-bg-hover": "rgba(58, 46, 36, 0.055)",
			"--dsw-alias-interactive-bg-active": "rgba(58, 46, 36, 0.10)",
			"--dsw-alias-interactive-bg-hover-solid": "#F1E8D7",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(162, 75, 59, 0.12)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(142, 58, 51, 0.07)",
			"--dsw-alias-border-l1": "rgba(58, 46, 36, 0.08)",
			"--dsw-alias-border-l2": "rgba(58, 46, 36, 0.16)",
			"--dsw-alias-border-l3": "rgba(58, 46, 36, 0.24)",
			"--dsw-alias-border-l4": "rgba(58, 46, 36, 0.32)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(58, 46, 36, 0.10)",
			"--dsw-alias-border-inverted": "rgba(58, 46, 36, 0)",
			"--dsw-alias-border-inverted2": "rgba(58, 46, 36, 0.10)",
			// Markdown / 代码
			"--dsw-alias-markdown-code-block": "#F3EAD9",
			"--dsw-alias-markdown-code-block-banner": "#F3EAD9",
			"--dsw-alias-markdown-inline-code": "#F0E6D3",
			"--dsw-alias-markdown-tag": "#E9DDC8",
			"--dsw-alias-markdown-citation": "#F0E6D3",
			"--dsw-alias-markdown-code-segment-selected": "#FBF6EB",
			"--dsw-alias-markdown-code-segment-unselected": "#F1E8D7",
			"--dsw-alias-markdown-placeholder": "#E9DDC8",
			// 状态：灰绿当自然色，砖红当强调色
			"--dsw-alias-state-business-primary": "#A24B3B",
			"--dsw-alias-state-business-tertiary": "#F3E6E1",
			"--dsw-alias-state-success-primary": "#586D52",
			"--dsw-alias-state-success-secondary": "#7E9476",
			"--dsw-alias-state-success-tertiary": "#E9EFE2",
			"--dsw-alias-state-warn-label": "#8F642C",
			"--dsw-alias-state-warn-primary": "#8F642C",
			"--dsw-alias-state-warn-secondary": "#C09355",
			"--dsw-alias-state-warn-tertiary": "#F6EEDF",
			"--dsw-alias-state-error-primary": "#8E3A33",
			"--dsw-alias-state-error-secondary": "#B85F52",
			// 浮层与具体部件
			"--dsw-alias-scrollbar-bg-l1": "#E5D9C4",
			"--dsw-alias-scrollbar-bg-l2": "#E5D9C4",
			"--dsw-alias-scrollbar-hover-l1": "#D6C7AC",
			"--dsw-alias-scrollbar-hover-l2": "#D6C7AC",
			"--dsw-alias-tooltip-bg": "#3B2F25",
			"--dsw-alias-toast-bg": "#3B2F25",
			"--dsw-specific-bubble": "#A24B3B",
			"--dsw-specific-bubble-highlight": "#8C3F31",
			// 砖红气泡上的字：宿主的 label-primary 是深棕墨，压不住砖红底
			"--wp-bubble-ink": "#FBF6EB",
			"--dsw-specific-input-major": "#FBF6EB",
			"--dsw-specific-login-input": "#F3EAD9",
			"--dsw-specific-menu": "#FBF6EB",
			"--dsw-specific-selector": "#F3EAD9",
			"--dsw-specific-sidebar-fill": "#F2E9D8",
			"--dsw-specific-sidebar-nav-item-active": "#E9DDC8",
			"--dsw-specific-sidebar-nav-item-active-accent": "#F3E6E1",
			"--dsw-specific-sidebar-nav-item-hover": "#EFE5D2",
			"--dsw-specific-tip": "#EAF0E1",
			// 主题自定义令牌：排版层用它取字体栈（同时是「层已挂上」的可观察证据）
			"--wp-serif": SERIF,
			// 日期戳的墨色（比正文浅一档，安静地待在输入框下方）
			"--wp-stamp-ink": "#75624C"
		});

		// ---- 深色：夜读纸 ------------------------------------------------
		const DARK = Object.freeze({
			"--dsw-alias-bg-base": "#211B15",
			"--dsw-alias-bg-layer-1": "#2A231C",
			"--dsw-alias-bg-layer-2": "#332A22",
			"--dsw-alias-bg-layer-3": "#3C3228",
			"--dsw-alias-bg-overlay": "#3A3026",
			"--dsw-alias-bg-module-platform": "#2A231C",
			"--dsw-alias-bg-multi-select": "#332A22",
			"--dsw-alias-bg-skeleton": "rgba(237, 227, 211, 0.08)",
			"--dsw-alias-bg-mask-1": "rgba(0, 0, 0, 0.5)",
			"--dsw-alias-bg-mask-2": "rgba(0, 0, 0, 0.2)",
			"--dsw-alias-bg-mask-3": "rgba(0, 0, 0, 0.48)",
			"--dsw-alias-bg-mask-photo": "rgba(0, 0, 0, 0.88)",
			"--dsw-alias-bg-mask-drop": "rgba(33, 27, 21, 0.72)",
			"--dsw-alias-label-primary": "#EDE3D2",
			"--dsw-alias-label-secondary": "#CDBFAB",
			"--dsw-alias-label-tertiary": "#B7A78F",
			"--dsw-alias-label-caption": "#B7A78F",
			"--dsw-alias-label-dimmed": "#332A22",
			"--dsw-alias-label-primary-dimmed": "#CDBFAB",
			"--dsw-alias-label-primary-inverted": "#241D17",
			"--dsw-alias-label-primary-foreground": "#241D17",
			"--dsw-alias-label-primary-bluish": "#E6A497",
			"--dsw-alias-brand-primary": "#C08572",
			"--dsw-alias-brand-primary-invert": "#211B15",
			"--dsw-alias-brand-primary-new-colorprimary-new-color": "#C08572",
			"--dsw-alias-brand-text": "#C08572",
			"--dsw-alias-button-primary-fill": "#C08572",
			"--dsw-alias-button-primary-hover": "#CE9581",
			"--dsw-alias-button-primary-dimmed": "#332A22",
			"--dsw-alias-button-info-fill": "#C08572",
			"--dsw-alias-button-info-hover": "#CE9581",
			"--dsw-alias-button-contrast-fill": "#EDE3D2",
			"--dsw-alias-button-elevated-fill": "#2A231C",
			"--dsw-alias-button-floating-fill": "#332A22",
			"--dsw-alias-button-floating-hover": "#3C3228",
			"--dsw-alias-button-ghost-active-border": "#6B5B49",
			"--dsw-alias-button-ghost-active-fill": "#332A22",
			"--dsw-alias-button-ghost-active-hover": "#3C3228",
			"--dsw-alias-button-tool-bar-fill-invisible": "rgba(0, 0, 0, 0.36)",
			"--dsw-alias-button-tool-bar-fill": "rgba(60, 50, 40, 0.5)",
			"--dsw-alias-button-tool-bar-hover": "rgba(60, 50, 40, 0.6)",
			"--dsw-alias-interactive-bg-hover": "rgba(237, 227, 211, 0.06)",
			"--dsw-alias-interactive-bg-active": "rgba(237, 227, 211, 0.12)",
			"--dsw-alias-interactive-bg-hover-solid": "#332A22",
			"--dsw-alias-interactive-bg-hover-accent": "rgba(192, 133, 114, 0.20)",
			"--dsw-alias-interactive-bg-hover-danger": "rgba(222, 138, 123, 0.16)",
			"--dsw-alias-border-l1": "rgba(237, 227, 211, 0.07)",
			"--dsw-alias-border-l2": "rgba(237, 227, 211, 0.14)",
			"--dsw-alias-border-l3": "rgba(237, 227, 211, 0.20)",
			"--dsw-alias-border-l4": "rgba(237, 227, 211, 0.26)",
			"--dsw-alias-border-l2-darkmode-thin": "rgba(237, 227, 211, 0.07)",
			"--dsw-alias-border-inverted": "rgba(237, 227, 211, 0.06)",
			"--dsw-alias-border-inverted2": "rgba(237, 227, 211, 0.08)",
			"--dsw-alias-markdown-code-block": "#2A231C",
			"--dsw-alias-markdown-code-block-banner": "#2A231C",
			"--dsw-alias-markdown-inline-code": "#332A22",
			"--dsw-alias-markdown-tag": "#3C3228",
			"--dsw-alias-markdown-citation": "#332A22",
			"--dsw-alias-markdown-code-segment-selected": "#3C3228",
			"--dsw-alias-markdown-code-segment-unselected": "#2A231C",
			"--dsw-alias-markdown-placeholder": "#3C3228",
			"--dsw-alias-state-business-primary": "#C08572",
			"--dsw-alias-state-business-tertiary": "#3A2A22",
			"--dsw-alias-state-success-primary": "#9AB78F",
			"--dsw-alias-state-success-secondary": "#AFC4A6",
			"--dsw-alias-state-success-tertiary": "#28301F",
			"--dsw-alias-state-warn-label": "#D6B173",
			"--dsw-alias-state-warn-primary": "#D6B173",
			"--dsw-alias-state-warn-secondary": "#E0C48F",
			"--dsw-alias-state-warn-tertiary": "#332A1B",
			"--dsw-alias-state-error-primary": "#DE8A7B",
			"--dsw-alias-state-error-secondary": "#E6A497",
			"--dsw-alias-scrollbar-bg-l1": "#3A3026",
			"--dsw-alias-scrollbar-bg-l2": "#3A3026",
			"--dsw-alias-scrollbar-hover-l1": "#4A3E32",
			"--dsw-alias-scrollbar-hover-l2": "#4A3E32",
			"--dsw-alias-tooltip-bg": "#3A3026",
			"--dsw-alias-toast-bg": "#3A3026",
			"--dsw-specific-bubble": "#A24B3B",
			"--dsw-specific-bubble-highlight": "#8C3F31",
			"--wp-bubble-ink": "#FBF6EB",
			"--dsw-specific-input-major": "#332A22",
			"--dsw-specific-login-input": "#2A231C",
			"--dsw-specific-menu": "#332A22",
			"--dsw-specific-selector": "#332A22",
			"--dsw-specific-sidebar-fill": "#1E1914",
			"--dsw-specific-sidebar-nav-item-active": "#332A22",
			"--dsw-specific-sidebar-nav-item-active-accent": "#3A2A22",
			"--dsw-specific-sidebar-nav-item-hover": "#2F2820",
			"--dsw-specific-tip": "#33382D",
			"--wp-serif": SERIF,
			"--wp-stamp-ink": "#B7A78F"
		});

		/**
		 * 把两套调色板折成 ThemeTokenOverrides：每个 token 必须有 { light, dark }。
		 * 一侧缺值时用另一侧顶替（本主题两套都给全，这一步只是防呆）。
		 */
		function layerOf(light, dark) {
			const layer = {};
			const names = new Set([...Object.keys(light), ...Object.keys(dark)]);
			for (const name of names) {
				const lightValue = light[name];
				const darkValue = dark[name];
				layer[name] = {
					light: lightValue === undefined ? darkValue : lightValue,
					dark: darkValue === undefined ? lightValue : darkValue
				};
			}
			return layer;
		}

		/** 把纸色差异折成 { light, dark } 覆盖层。 */
		function toneLayer(light, dark) {
			const layer = {};
			for (const name of new Set([...Object.keys(light), ...Object.keys(dark)])) {
				layer[name] = { light: light[name], dark: dark[name] };
			}
			return layer;
		}

		// 纸色：宣白 / 茶褐。只改背景类 token，文字与强调色不动，避免对比度漂移。
		const PAPER_TONES = Object.freeze({
			white: toneLayer({
				"--dsw-alias-bg-base": "#F8F3E9",
				"--dsw-alias-bg-layer-1": "#FDFAF3",
				"--dsw-alias-bg-layer-2": "#F3ECE0",
				"--dsw-alias-bg-layer-3": "#EBE3D4",
				"--dsw-alias-bg-overlay": "#FEFCF7",
				"--dsw-alias-bg-module-platform": "#FDFAF3",
				"--dsw-alias-bg-multi-select": "#F2EADB",
				"--dsw-alias-markdown-code-block": "#F4EDDF",
				"--dsw-alias-markdown-code-block-banner": "#F4EDDF",
				"--dsw-alias-markdown-inline-code": "#F2EADB",
				"--dsw-alias-markdown-tag": "#EBE3D4",
				"--dsw-alias-markdown-citation": "#F2EADB",
				"--dsw-alias-markdown-placeholder": "#EBE3D4",
				"--dsw-alias-button-elevated-fill": "#FDFAF3",
				"--dsw-alias-button-floating-fill": "#FDFAF3",
				"--dsw-alias-button-floating-hover": "#F3ECE0",
				"--dsw-specific-sidebar-fill": "#F6F0E4",
				"--dsw-specific-sidebar-nav-item-active": "#EBE3D3",
				"--dsw-specific-sidebar-nav-item-hover": "#F3ECE0",
				"--dsw-specific-menu": "#FDFAF3",
				"--dsw-specific-input-major": "#FDFAF3",
				"--dsw-specific-login-input": "#F6F0E4",
				"--dsw-specific-selector": "#F6F0E4"
			}, {
				"--dsw-alias-bg-base": "#1E1A15",
				"--dsw-alias-bg-layer-1": "#26211A",
				"--dsw-alias-bg-layer-2": "#2D271E",
				"--dsw-alias-bg-layer-3": "#352E24",
				"--dsw-alias-bg-overlay": "#352E24",
				"--dsw-alias-bg-module-platform": "#26211A",
				"--dsw-alias-bg-multi-select": "#2D271E",
				"--dsw-alias-markdown-code-block": "#26211A",
				"--dsw-alias-markdown-code-block-banner": "#26211A",
				"--dsw-alias-markdown-inline-code": "#2D271E",
				"--dsw-alias-markdown-tag": "#352E24",
				"--dsw-alias-markdown-citation": "#2D271E",
				"--dsw-alias-markdown-placeholder": "#352E24",
				"--dsw-alias-button-elevated-fill": "#26211A",
				"--dsw-alias-button-floating-fill": "#2D271E",
				"--dsw-alias-button-floating-hover": "#352E24",
				"--dsw-specific-sidebar-fill": "#1B1712",
				"--dsw-specific-sidebar-nav-item-active": "#2D271E",
				"--dsw-specific-sidebar-nav-item-hover": "#282219",
				"--dsw-specific-menu": "#2D271E",
				"--dsw-specific-input-major": "#2D271E",
				"--dsw-specific-login-input": "#26211A",
				"--dsw-specific-selector": "#26211A"
			}),
			tea: toneLayer({
				"--dsw-alias-bg-base": "#EFE2CA",
				"--dsw-alias-bg-layer-1": "#F7ECDA",
				"--dsw-alias-bg-layer-2": "#E8D9BD",
				"--dsw-alias-bg-layer-3": "#DECDAF",
				"--dsw-alias-bg-overlay": "#FBF3E2",
				"--dsw-alias-bg-module-platform": "#F7ECDA",
				"--dsw-alias-bg-multi-select": "#E9DCC3",
				"--dsw-alias-markdown-code-block": "#EBDCBF",
				"--dsw-alias-markdown-code-block-banner": "#EBDCBF",
				"--dsw-alias-markdown-inline-code": "#E9DCC3",
				"--dsw-alias-markdown-tag": "#DECDAF",
				"--dsw-alias-markdown-citation": "#E9DCC3",
				"--dsw-alias-markdown-placeholder": "#DECDAF",
				"--dsw-alias-button-elevated-fill": "#F7ECDA",
				"--dsw-alias-button-floating-fill": "#F7ECDA",
				"--dsw-alias-button-floating-hover": "#E8D9BD",
				"--dsw-specific-sidebar-fill": "#EADCC1",
				"--dsw-specific-sidebar-nav-item-active": "#DDCBA9",
				"--dsw-specific-sidebar-nav-item-hover": "#E6D7B9",
				"--dsw-specific-menu": "#F7ECDA",
				"--dsw-specific-input-major": "#F7ECDA",
				"--dsw-specific-login-input": "#EFE2CA",
				"--dsw-specific-selector": "#EFE2CA"
			}, {
				"--dsw-alias-bg-base": "#261D12",
				"--dsw-alias-bg-layer-1": "#2F2517",
				"--dsw-alias-bg-layer-2": "#382C1C",
				"--dsw-alias-bg-layer-3": "#413424",
				"--dsw-alias-bg-overlay": "#413424",
				"--dsw-alias-bg-module-platform": "#2F2517",
				"--dsw-alias-bg-multi-select": "#382C1C",
				"--dsw-alias-markdown-code-block": "#2F2517",
				"--dsw-alias-markdown-code-block-banner": "#2F2517",
				"--dsw-alias-markdown-inline-code": "#382C1C",
				"--dsw-alias-markdown-tag": "#413424",
				"--dsw-alias-markdown-citation": "#382C1C",
				"--dsw-alias-markdown-placeholder": "#413424",
				"--dsw-alias-button-elevated-fill": "#2F2517",
				"--dsw-alias-button-floating-fill": "#382C1C",
				"--dsw-alias-button-floating-hover": "#413424",
				"--dsw-specific-sidebar-fill": "#221A10",
				"--dsw-specific-sidebar-nav-item-active": "#382C1C",
				"--dsw-specific-sidebar-nav-item-hover": "#2C2215",
				"--dsw-specific-menu": "#382C1C",
				"--dsw-specific-input-major": "#382C1C",
				"--dsw-specific-login-input": "#2F2517",
				"--dsw-specific-selector": "#2F2517"
			})
		});

		const TOKENS = Object.freeze(layerOf(LIGHT, DARK));

		// ---- 活设置：主题层 / 门控属性 / 日期戳都读这一份 -------------------
		const settings = (() => {
			try {
				return normalizeSettings(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
			} catch {
				return { ...DEFAULT_SETTINGS };
			}
		})();
		const settingsListeners = new Set();
		let runtimeCtx;
		let layerDispose;
		/** 宿主主题服务的三档字号（与「通用设置」里的同名字号是同一份设置）。 */
		const FONT_SIZE_SPECS = Object.freeze({
			text: { min: 10, max: 22, title: "正文字号", description: "会话正文；与「通用设置 → 字号大小」同一个设置。" },
			code: { min: 10, max: 16, title: "代码字号", description: "代码块、行内代码与工具输出；与宿主代码字号联动。" },
			terminal: { min: 10, max: 20, title: "终端字号", description: "只作用于右侧边栏的终端面板（需先打开终端标签）；不改变左侧会话列表。" }
		});
		let hostFontSizes = { text: 14, code: 11, terminal: 13 };
		/** 宿主「正文字体」里用户填的字体列表；空串表示用主题的栈。 */
		let hostFontFamily = "";

		function normalizeSettings(raw) {
			const out = { ...DEFAULT_SETTINGS };
			if (raw === null || typeof raw !== "object") return out;
			if (typeof raw.enabled === "boolean") out.enabled = raw.enabled;
			if (BUBBLE_VARIANTS[raw.bubble] !== undefined) out.bubble = raw.bubble;
			if (typeof raw.serif === "boolean") out.serif = raw.serif;
			if (typeof raw.spine === "boolean") out.spine = raw.spine;
			if (raw.tone === "almond" || PAPER_TONES[raw.tone] !== undefined) out.tone = raw.tone;
			if (SERIF_STACKS[raw.font] !== undefined) out.font = raw.font;
			if (raw.sidebar === "small" || raw.sidebar === "normal" || raw.sidebar === "large") out.sidebar = raw.sidebar;
			// 旧版布尔值迁移：grain true/false → light/off；stamp → full/off。
			if (typeof raw.grain === "boolean") out.grain = raw.grain ? "light" : "off";
			else if (raw.grain === "off" || raw.grain === "light" || raw.grain === "heavy") out.grain = raw.grain;
			if (typeof raw.stamp === "boolean") out.stamp = raw.stamp ? "full" : "off";
			else if (raw.stamp === "off" || raw.stamp === "full" || raw.stamp === "short") out.stamp = raw.stamp;
			return out;
		}

		function subscribeSettings(listener) {
			settingsListeners.add(listener);
			return () => settingsListeners.delete(listener);
		}

		function persistSettings() {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
			} catch {
				/* 无痕模式 / 禁用存储：选择至少活在这一页 */
			}
		}

		/** 当前纸色 / 衬线字体 / 气泡口味折进调色板层；其余 token 原样。 */
		function layerFor(state) {
			const variant = BUBBLE_VARIANTS[state.bubble] ?? BUBBLE_VARIANTS.brick;
			const tone = PAPER_TONES[state.tone];
			const font = SERIF_STACKS[state.font] ?? SERIF_STACKS.song;
			const layer = tone === undefined ? { ...TOKENS } : { ...TOKENS, ...tone };
			layer["--dsw-specific-bubble"] = { light: variant.fillLight, dark: variant.fillDark };
			layer["--dsw-specific-bubble-highlight"] = { light: variant.highlightLight, dark: variant.highlightDark };
			layer["--wp-serif"] = { light: font, dark: font };
			return layer;
		}

		/** 把设置写成 DOM 门控属性 + token 层；关闭时整身撤走。 */
		function applySettings() {
			if (typeof document === "undefined" || runtimeCtx === undefined) return;
			const root = document.documentElement;
			if (!settings.enabled) {
				root.removeAttribute("data-warm-paper");
				root.removeAttribute("data-warm-paper-serif");
				root.removeAttribute("data-warm-paper-grain");
				root.removeAttribute("data-warm-paper-spine");
				root.removeAttribute("data-warm-paper-sidebar");
				root.removeAttribute("data-warm-paper-bubble");
				layerDispose?.();
				layerDispose = undefined;
				return;
			}
			root.setAttribute("data-warm-paper", "on");
			root.setAttribute("data-warm-paper-serif", settings.serif ? "on" : "off");
			root.setAttribute("data-warm-paper-grain", settings.grain);
			root.setAttribute("data-warm-paper-spine", settings.spine ? "on" : "off");
			root.setAttribute("data-warm-paper-sidebar", settings.sidebar);
			root.setAttribute("data-warm-paper-bubble", settings.bubble);
			// 同一个 source 再调一次会整层替换并重新置顶，不会叠出第二层。
			layerDispose = runtimeCtx.theme.overrideTokens(PLUGIN_ID, layerFor(settings));
		}

		/** 唯一的写入口：改设置 → 落盘 → 立即生效 → 通知设置页与日期戳。 */
		function updateSettings(patch) {
			Object.assign(settings, patch);
			persistSettings();
			applySettings();
			for (const listener of settingsListeners) listener();
		}

		function useSettings() {
			const [state, setState] = React.useState(() => ({
				...settings,
				fontSizes: { ...hostFontSizes },
				fontFamily: hostFontFamily
			}));
			React.useEffect(() => subscribeSettings(() => setState({
				...settings,
				fontSizes: { ...hostFontSizes },
				fontFamily: hostFontFamily
			})), []);
			return state;
		}

		/** 任一档字号写回宿主主题偏好；越界或服务不可用时静默忽略。 */
		function setHostFontSize(role, px) {
			if (runtimeCtx === undefined) return;
			try {
				runtimeCtx.theme.setFontSize(role, px);
			} catch {
				/* 宿主改过取值范围时保持原值，不炸设置页 */
			}
		}

		const TYPOGRAPHY_CSS = `
/* 暖纸 · 排版层
   宿主把用户在「正文字体」里填的字体写成 --dsh-font-family-text；这里把它排在最前，
   后面始终缀上暖纸的衬线栈：用户填了真实字体就尊重它，填了无效名字（比如数字）
   也不会掉回宿主默认的无衬线，而是落回宋体。
   用户在 Settings → 正文字体 里填过字体时，行内变量优先，这里不抢。 */
html[data-warm-paper="on"][data-warm-paper-serif="on"] body {
  --dsw-font-family: var(--dsh-font-family-text, var(--wp-serif)), var(--wp-serif);
  --dsw-font-markdown-h1-font-family: var(--dsw-font-family);
  --dsw-font-markdown-h2-font-family: var(--dsw-font-family);
  --dsw-font-markdown-h3-font-family: var(--dsw-font-family);
  --dsw-font-markdown-h4-font-family: var(--dsw-font-family);
  --dsw-font-markdown-base-font-family: var(--dsw-font-family);
  --dsw-font-markdown-base-strong-font-family: var(--dsw-font-family);
  --dsw-font-markdown-base-italic-font-family: var(--dsw-font-family);
  --dsw-font-markdown-base-strong-italic-font-family: var(--dsw-font-family);
  --dsw-font-markdown-table-font-family: var(--dsw-font-family);
  --dsw-font-markdown-table-head-font-family: var(--dsw-font-family);
  --dsw-font-markdown-small-font-family: var(--dsw-font-family);
  --dsw-font-markdown-small-strong-font-family: var(--dsw-font-family);
  --dsw-font-markdown-small-italic-font-family: var(--dsw-font-family);
  --dsw-font-markdown-small-strong-italic-font-family: var(--dsw-font-family);
}
`;

		const PAPER_CSS = `
/* 暖纸 · 纸纹与书脊
   纸纹是一层极淡的固定颗粒（multiply / 深色用 screen），强度分轻/重两档；
   书脊线是左侧 2px 的砖红细线，像线装书订口，可以单独关掉。 */
html[data-warm-paper="on"] body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='180'%20height='180'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='180'%20height='180'%20filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  opacity: 0;
  mix-blend-mode: multiply;
}
html[data-warm-paper="on"][data-warm-paper-grain="light"] body::after {
  opacity: 0.055;
}
html[data-warm-paper="on"][data-warm-paper-grain="heavy"] body::after {
  opacity: 0.10;
}
html[data-warm-paper="on"][data-warm-paper-grain="light"] body[data-ds-dark-theme]::after {
  opacity: 0.07;
  mix-blend-mode: screen;
}
html[data-warm-paper="on"][data-warm-paper-grain="heavy"] body[data-ds-dark-theme]::after {
  opacity: 0.13;
  mix-blend-mode: screen;
}

html[data-warm-paper="on"][data-warm-paper-spine="on"] body::before {
  content: "";
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  z-index: 2147483001;
  pointer-events: none;
  background: linear-gradient(180deg,
    rgba(162, 75, 59, 0.46),
    rgba(162, 75, 59, 0.20) 42%,
    rgba(162, 75, 59, 0.36) 100%);
}
html[data-warm-paper="on"][data-warm-paper-spine="on"] body[data-ds-dark-theme]::before {
  background: linear-gradient(180deg,
    rgba(208, 138, 115, 0.52),
    rgba(208, 138, 115, 0.18) 42%,
    rgba(208, 138, 115, 0.40) 100%);
}

html[data-warm-paper="on"] ::selection {
  background: rgba(162, 75, 59, 0.16);
  color: inherit;
}
html[data-warm-paper="on"] body[data-ds-dark-theme] ::selection {
  background: rgba(208, 138, 115, 0.24);
  color: inherit;
}
`;

		// 左侧栏字号：宿主没有这项设置，按 CSS Modules 本地名覆盖宿主固定字号。
		// 宿主改类名时规则失配，自动回落到宿主原字号，不会破坏布局。
		const SIDEBAR_CSS = `
html[data-warm-paper="on"][data-warm-paper-sidebar="small"] { --wp-sidebar-scale: 0.92; }
html[data-warm-paper="on"][data-warm-paper-sidebar="large"] { --wp-sidebar-scale: 1.12; }

html[data-warm-paper="on"]:not([data-warm-paper-sidebar="normal"]) [data-slot="sidebar"],
html[data-warm-paper="on"]:not([data-warm-paper-sidebar="normal"]) [data-slot="sidebar"] [class*="_root"] {
  font-size: calc(14px * var(--wp-sidebar-scale));
}
html[data-warm-paper="on"]:not([data-warm-paper-sidebar="normal"]) [data-slot="sidebar"] :is(
  [class*="_title"],
  [class*="_searchResultTitle"],
  [class*="_hoverTitle"],
  [class*="_newSession"],
  [class*="_renameInput"]
) {
  font-size: calc(14px * var(--wp-sidebar-scale));
}
html[data-warm-paper="on"]:not([data-warm-paper-sidebar="normal"]) [data-slot="sidebar"] :is(
  [class*="_meta"],
  [class*="_searchResultWorkspace"],
  [class*="_searchResultSnippet"],
  [class*="_hoverPath"],
  [class*="_hoverTime"],
  [class*="_hoverStatus"],
  [class*="_searchStatus"],
  [class*="_sessionOverflowButton"],
  [class*="_renameError"],
  [class*="_deleteStatus"]
) {
  font-size: calc(12px * var(--wp-sidebar-scale));
}
html[data-warm-paper="on"]:not([data-warm-paper-sidebar="normal"]) [data-slot="sidebar"] [class*="_time"] {
  font-size: calc(10px * var(--wp-sidebar-scale));
}
html[data-warm-paper="on"]:not([data-warm-paper-sidebar="normal"]) [data-slot="sidebar"] :is(
  [class*="_searchInput"],
  [class*="_empty"],
  [class*="_emptyState"],
  [class*="_emptyAction"],
  [class*="_archiveActivity"]
) {
  font-size: calc(13px * var(--wp-sidebar-scale));
}
`;

		// 会话 / 工作区的悬停卡：宿主 HoverCard 原语把底色写死成 #2C2C2E、
		// 文字写死成白色（--dsw-hovercard-bg 声明在卡片自身上，继承不到主题层），
		// 这里按卡片内含 hoverContent 来定位，把它整体换成纸色卡片。
		const HOVERCARD_CSS = `
html[data-warm-paper="on"] [class*="_card_"]:has([class*="_hoverContent"]) {
  --dsw-hovercard-bg: var(--dsw-alias-bg-overlay);
  background: var(--dsw-alias-bg-overlay);
  border: .5px solid var(--dsw-alias-border-l2);
  box-shadow: var(--dsw-elevation-panel, 0 4px 16px rgba(0, 0, 0, .08));
  color: var(--dsw-alias-label-primary);
}
html[data-warm-paper="on"] [class*="_hoverContent"] [class*="_hoverTitle"] {
  color: var(--dsw-alias-label-primary);
}
html[data-warm-paper="on"] [class*="_hoverContent"] [class*="_hoverPath"],
html[data-warm-paper="on"] [class*="_hoverContent"] [class*="_hoverTime"] {
  color: var(--dsw-alias-label-tertiary);
}
html[data-warm-paper="on"] [class*="_hoverContent"] [class*="_hoverStatus"] {
  color: var(--dsw-alias-label-secondary);
}
html[data-warm-paper="on"] [class*="_card_"]:has([class*="_hoverContent"]) [class*="_copied_"] {
  color: var(--dsw-alias-label-primary);
}
`;

		// 用户消息气泡：底色由设置里的口味决定，文字颜色跟着反白。
		// 宿主的 .bubble 用 --dsw-specific-bubble 作底、--dsw-alias-label-primary 作字，
		// 但气泡文字没有独立 token；砖红 / 陶土底色上必须把字改成米色。
		// 选择器用 CSS Modules 的本地名（<hash>_bubble），并排除 *_bubble_* 的浮层气泡。
		const BUBBLE_CSS = `
html[data-warm-paper="on"][data-warm-paper-bubble="brick"] body,
html[data-warm-paper="on"][data-warm-paper-bubble="clay"] body {
  --wp-bubble-on-fill: var(--wp-bubble-ink);
}
html[data-warm-paper="on"][data-warm-paper-bubble="paper"] body {
  --wp-bubble-on-fill: var(--dsw-alias-label-primary);
}
html[data-warm-paper="on"] body [class*="_bubble"]:not([class*="_bubble_"]) {
  background: var(--dsw-specific-bubble);
  color: var(--wp-bubble-on-fill);
}
html[data-warm-paper="on"]:not([data-warm-paper-bubble="paper"]) body [class*="_bubble"]:not([class*="_bubble_"]) a {
  color: var(--wp-bubble-on-fill);
  text-decoration: underline;
  text-underline-offset: 3px;
}
html[data-warm-paper="on"]:not([data-warm-paper-bubble="paper"]) body [class*="_bubble"]:not([class*="_bubble_"]) ::selection {
  background: rgba(251, 246, 235, 0.3);
}
`;

		const STAMP_CSS = `
/* 暖纸 · 日期戳（输入框下方的一行批注） */
html[data-warm-paper="on"] .wp-stamp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 0 2px;
  color: var(--wp-stamp-ink);
  font-size: 11px;
  line-height: 18px;
  letter-spacing: 0.14em;
  user-select: none;
  pointer-events: none;
}
html[data-warm-paper="on"] .wp-stamp::before,
html[data-warm-paper="on"] .wp-stamp::after {
  content: "";
  width: min(88px, 16vw);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--dsw-alias-border-l2));
}
html[data-warm-paper="on"] .wp-stamp::after {
  background: linear-gradient(90deg, var(--dsw-alias-border-l2), transparent);
}
html[data-warm-paper="on"] .wp-stamp-seal {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 1px;
  background: var(--dsw-alias-brand-primary);
  opacity: 0.55;
  transform: rotate(-6deg);
}
html[data-warm-paper="on"] .wp-stamp-date {
  font-variant-numeric: tabular-nums;
}
`;

		// 插件设置页（设置 → 插件 → 暖纸）。这页在主题关闭时也要可用，
		// 所以不挂 data-warm-paper 门控，只用宿主 token 画。
		const SETTINGS_CSS = `
.wp-settings { display: flex; flex-direction: column; padding-bottom: 8px; }
.wp-settings-intro { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; padding: 14px 0 10px; }

/* 实况预览：纸、字、气泡、日期戳都直接吃当前 token */
.wp-preview { margin: 2px 0 4px; }
.wp-preview-paper { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; box-sizing: border-box; padding: 16px 18px 14px; border: .5px solid var(--dsw-alias-border-l2); border-radius: 16px; background: var(--dsw-alias-bg-base); box-shadow: var(--dsw-shadow-lv1, 0 2px 4px rgba(0, 0, 0, .04)); }
.wp-preview-kicker { align-self: flex-start; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 18px; letter-spacing: .18em; }
.wp-preview-text { align-self: flex-start; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 22px; }
.wp-preview-bubble { max-width: 84%; padding: 7px 12px; border-radius: 14px; background: var(--dsw-specific-bubble); color: var(--wp-bubble-on-fill, var(--dsw-alias-label-primary)); font-size: 13px; line-height: 20px; }
.wp-preview-stamp { align-self: center; display: inline-flex; align-items: center; gap: 8px; color: var(--wp-stamp-ink, var(--dsw-alias-label-tertiary)); font-size: 10px; line-height: 16px; letter-spacing: .14em; }
.wp-preview-seal { width: 5px; height: 5px; flex: none; border-radius: 1px; background: var(--dsw-alias-brand-primary); opacity: .55; transform: rotate(-6deg); }

/* 分组标题：安静的小字，不跟正文抢 */
.wp-group { display: flex; flex-direction: column; }
.wp-group-title { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 18px; letter-spacing: .16em; padding: 20px 0 1px; }
.wp-group > .wp-row:last-child { border-bottom: 0; }

.wp-row { display: flex; align-items: center; gap: 16px; padding: 13px 0; border-bottom: .5px solid var(--dsw-alias-border-l2); }
.wp-row-main { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.wp-row-title { color: var(--dsw-alias-label-primary); font-size: 14px; line-height: 22px; }
.wp-row-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }

.wp-switch { position: relative; flex: none; width: 36px; height: 20px; padding: 0; border: none; border-radius: 999px; background: var(--dsw-alias-interactive-bg-active); cursor: pointer; transition: background-color .16s ease; }
.wp-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
.wp-switch:focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }
.wp-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-primary-inverted); box-shadow: 0 1px 2px rgba(0, 0, 0, .18); transition: transform .16s ease; }
.wp-switch[aria-checked="true"] .wp-switch-knob { transform: translateX(16px); }

.wp-stepper { display: inline-flex; align-items: center; gap: 2px; flex: none; padding: 2px; border: .5px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-1); }
.wp-stepper-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 0; border: none; border-radius: 50%; background: 0 0; color: var(--dsw-alias-label-primary); font: inherit; font-size: 16px; line-height: 1; cursor: pointer; }
.wp-stepper-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.wp-stepper-btn:disabled { color: var(--dsw-alias-label-caption); cursor: default; }
.wp-stepper-btn:focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 1px; }
.wp-stepper-value { min-width: 34px; text-align: center; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 20px; font-variant-numeric: tabular-nums; }
.wp-stepper-unit { margin-left: 1px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }

.wp-swatches { display: flex; flex-wrap: wrap; gap: 8px; flex: none; }
.wp-swatch { display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px; border: .5px solid var(--dsw-alias-border-l2); border-radius: 999px; background: 0 0; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; transition: border-color .16s ease, background-color .16s ease; }
.wp-swatch:hover { background: var(--dsw-alias-interactive-bg-hover); }
.wp-swatch[aria-pressed="true"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); }
.wp-swatch:focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }
.wp-swatch-dot { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 .5px var(--dsw-alias-border-l3); }

.wp-segmented { display: inline-flex; flex: none; gap: 2px; padding: 2px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-solid); }
.wp-seg { padding: 4px 10px; border: none; border-radius: 999px; background: 0 0; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; transition: background-color .16s ease, color .16s ease; }
.wp-seg:hover:not([aria-pressed="true"]) { color: var(--dsw-alias-label-primary); }
.wp-seg[aria-pressed="true"] { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: var(--dsw-shadow-lv1, 0 1px 2px rgba(0, 0, 0, .06)); }
.wp-seg:focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 1px; }

.wp-reset { align-self: flex-start; margin-top: 18px; padding: 0; border: none; background: 0 0; color: var(--dsw-alias-label-tertiary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.wp-reset:hover { color: var(--dsw-alias-label-secondary); }
.wp-settings-summary { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
`;

		/** 把一张样式表挂到 owning plugin 的生命周期上。 */
		function injectStyle(ctx, id, css) {
			ctx.effect(() => {
				if (typeof document === "undefined") return;
				const tag = document.createElement("style");
				tag.dataset.plugin = PLUGIN_ID;
				tag.dataset.pluginCss = `${PLUGIN_ID}/${id}`;
				tag.textContent = css;
				document.head.appendChild(tag);
				return () => {
					tag.remove();
				};
			}, `${PLUGIN_ID}: ${id} stylesheet`);
		}

		/** 日期戳文案；关闭时返回空串。 */
		function formatStamp(now, mode) {
			const pad = (value) => String(value).padStart(2, "0");
			if (mode === "short") return `${pad(now.getMonth() + 1)} · ${pad(now.getDate())}`;
			if (mode === "full") return `${now.getFullYear()} · ${pad(now.getMonth() + 1)} · ${pad(now.getDate())}`;
			return "";
		}

		/** 输入框下方的当日日期戳：只用本地日期，跨日重渲染时更新。 */
		function DateStamp() {
			const state = useSettings();
			const text = state.enabled ? formatStamp(new Date(), state.stamp) : "";
			if (text === "") return null;
			return h("div", { className: "wp-stamp", "aria-hidden": "true" },
				h("span", { className: "wp-stamp-seal" }),
				h("span", { className: "wp-stamp-date" }, text)
			);
		}

		const BUBBLE_CHOICES = [
			{ id: "brick", label: "砖红", swatch: BUBBLE_VARIANTS.brick.fillLight },
			{ id: "clay", label: "陶土", swatch: BUBBLE_VARIANTS.clay.fillLight },
			{ id: "paper", label: "纸色", swatch: BUBBLE_VARIANTS.paper.fillLight }
		];
		const TONE_CHOICES = [
			{ id: "almond", label: "米杏", swatch: "#F5EEE0" },
			{ id: "white", label: "宣白", swatch: "#F8F3E9" },
			{ id: "tea", label: "茶褐", swatch: "#EFE2CA" }
		];
		const GRAIN_CHOICES = [
			{ id: "off", label: "无" },
			{ id: "light", label: "轻" },
			{ id: "heavy", label: "重" }
		];
		const FONT_CHOICES = [
			{ id: "song", label: "宋体" },
			{ id: "source", label: "思源宋" },
			{ id: "fangsong", label: "仿宋" }
		];
		const STAMP_CHOICES = [
			{ id: "full", label: "完整" },
			{ id: "short", label: "简" },
			{ id: "off", label: "关" }
		];
		const SIDEBAR_CHOICES = [
			{ id: "small", label: "小" },
			{ id: "normal", label: "标准" },
			{ id: "large", label: "大" }
		];

		function SettingsSwitch({ checked, label, onChange }) {
			return h("button", {
				type: "button",
				role: "switch",
				"aria-checked": checked,
				"aria-label": label,
				className: "wp-switch",
				onClick: () => onChange(!checked)
			}, h("span", { className: "wp-switch-knob" }));
		}

		function FontSizeStepper({ value, min, max, onChange }) {
			const step = (delta) => {
				const next = Math.min(max, Math.max(min, value + delta));
				if (next !== value) onChange(next);
			};
			return h("div", { className: "wp-stepper" },
				h("button", {
					type: "button",
					className: "wp-stepper-btn",
					"aria-label": "减小字号",
					disabled: value <= min,
					onClick: () => step(-1)
				}, "−"),
				h("span", { className: "wp-stepper-value" }, value, h("span", { className: "wp-stepper-unit" }, "px")),
				h("button", {
					type: "button",
					className: "wp-stepper-btn",
					"aria-label": "增大字号",
					disabled: value >= max,
					onClick: () => step(1)
				}, "+")
			);
		}

		function SettingsRow({ title, description, children }) {
			return h("div", { className: "wp-row" },
				h("div", { className: "wp-row-main" },
					h("div", { className: "wp-row-title" }, title),
					description === undefined ? null : h("div", { className: "wp-row-desc" }, description)
				),
				children
			);
		}

		function Segmented({ value, options, onChange, label }) {
			return h("div", { className: "wp-segmented", role: "group", "aria-label": label },
				options.map((option) => h("button", {
					key: option.id,
					type: "button",
					className: "wp-seg",
					"aria-pressed": value === option.id,
					onClick: () => onChange(option.id)
				}, option.label))
			);
		}

		function SwatchGroup({ value, options, onChange, label }) {
			return h("div", { className: "wp-swatches", role: "group", "aria-label": label },
				options.map((option) => h("button", {
					key: option.id,
					type: "button",
					className: "wp-swatch",
					"aria-pressed": value === option.id,
					onClick: () => onChange(option.id)
				},
					h("span", { className: "wp-swatch-dot", style: { background: option.swatch } }),
					option.label
				))
			);
		}

		function SettingsGroup({ title, children }) {
			return h("div", { className: "wp-group" },
				h("div", { className: "wp-group-title" }, title),
				children
			);
		}

		/** 页面顶部的实况预览：纸、字、气泡、日期戳都直接吃当前 token。 */
		function Preview({ state }) {
			const stamp = state.enabled ? formatStamp(new Date(), state.stamp) : "";
			return h("div", { className: "wp-preview", "aria-hidden": "true" },
				h("div", { className: "wp-preview-paper" },
					h("div", { className: "wp-preview-kicker" }, "暖纸 · 预览"),
					h("div", { className: "wp-preview-text" }, "纸上的字，应该像从书里走出来。"),
					h("div", { className: "wp-preview-bubble" }, "今天也想慢慢来。"),
					stamp === "" ? null : h("div", { className: "wp-preview-stamp" },
						h("span", { className: "wp-preview-seal" }),
						stamp
					)
				)
			);
		}

		/** 插件自己的设置页：读同一份 localStorage 设置，改完立即生效。 */
		function WarmPaperSettings({ view }) {
			const state = useSettings();
			const set = (patch) => updateSettings(patch);
			const toneLabel = (TONE_CHOICES.find((choice) => choice.id === state.tone) ?? TONE_CHOICES[0]).label;
			const bubbleLabel = (BUBBLE_CHOICES.find((choice) => choice.id === state.bubble) ?? BUBBLE_CHOICES[0]).label;
			if (view === "summary") {
				return h("span", { className: "wp-settings-summary" },
					state.enabled ? `暖纸 · ${toneLabel}纸 · ${bubbleLabel}气泡` : "未启用");
			}
			return h("div", { className: "wp-settings" },
				h("div", { className: "wp-settings-intro" }, "安静、温柔的手记风格：米杏纸色、宋体、纸纹与砖红。设置只保存在本机浏览器，刷新后保留。"),
				h(Preview, { state }),

				h(SettingsGroup, { title: "主题" },
					h(SettingsRow, { title: "启用暖纸主题", description: "关闭后立即回到宿主原样，设置会保留。" },
						h(SettingsSwitch, { checked: state.enabled, label: "启用暖纸主题", onChange: (value) => set({ enabled: value }) })
					),
					h(SettingsRow, { title: "纸色", description: "同一套纸的三种底色；只换背景，不动文字与强调色。" },
						h(SwatchGroup, { value: state.tone, options: TONE_CHOICES, label: "纸色", onChange: (value) => set({ tone: value }) })
					),
					h(SettingsRow, { title: "纸纹", description: "纸面颗粒的轻重，无则表示纯色纸。" },
						h(Segmented, { value: state.grain, options: GRAIN_CHOICES, label: "纸纹", onChange: (value) => set({ grain: value }) })
					),
					h(SettingsRow, { title: "书脊线", description: "左侧那条 2px 的砖红订口线。" },
						h(SettingsSwitch, { checked: state.spine, label: "书脊线", onChange: (value) => set({ spine: value }) })
					)
				),

				h(SettingsGroup, { title: "文字" },
					h(SettingsRow, {
							title: "正文宋体",
							description: state.fontFamily === ""
								? "关闭后正文回到宿主的无衬线字体。"
								: `宿主「正文字体」里填了 ${state.fontFamily}，它会排在最前；名字无效时回落到暖纸宋体。`
						},
						h(SettingsSwitch, { checked: state.serif, label: "正文宋体", onChange: (value) => set({ serif: value }) })
					),
					h(SettingsRow, { title: "衬线字体", description: "中文家族偏好；宿主「正文字体」仍然优先。" },
						h(Segmented, { value: state.font, options: FONT_CHOICES, label: "衬线字体", onChange: (value) => set({ font: value }) })
					),
					h(SettingsRow, { title: "正文字号", description: FONT_SIZE_SPECS.text.description },
						h(FontSizeStepper, { value: state.fontSizes.text, min: FONT_SIZE_SPECS.text.min, max: FONT_SIZE_SPECS.text.max, onChange: (value) => setHostFontSize("text", value) })
					),
					h(SettingsRow, { title: "代码字号", description: FONT_SIZE_SPECS.code.description },
						h(FontSizeStepper, { value: state.fontSizes.code, min: FONT_SIZE_SPECS.code.min, max: FONT_SIZE_SPECS.code.max, onChange: (value) => setHostFontSize("code", value) })
					),
					h(SettingsRow, { title: "终端字号", description: FONT_SIZE_SPECS.terminal.description },
						h(FontSizeStepper, { value: state.fontSizes.terminal, min: FONT_SIZE_SPECS.terminal.min, max: FONT_SIZE_SPECS.terminal.max, onChange: (value) => setHostFontSize("terminal", value) })
					),
					h(SettingsRow, { title: "侧栏字号", description: "左侧会话列表与导航的字号；宿主没有这项设置，由主题覆盖。" },
						h(Segmented, { value: state.sidebar, options: SIDEBAR_CHOICES, label: "侧栏字号", onChange: (value) => set({ sidebar: value }) })
					)
				),

				h(SettingsGroup, { title: "气泡" },
					h(SettingsRow, { title: "消息气泡", description: "你自己发出的消息用哪种底色。" },
						h(SwatchGroup, { value: state.bubble, options: BUBBLE_CHOICES, label: "消息气泡", onChange: (value) => set({ bubble: value }) })
					)
				),

				h(SettingsGroup, { title: "装饰" },
					h(SettingsRow, { title: "日期戳", description: "输入框下方那行日期；「简」只留月和日。" },
						h(Segmented, { value: state.stamp, options: STAMP_CHOICES, label: "日期戳", onChange: (value) => set({ stamp: value }) })
					)
				),

				h("button", { type: "button", className: "wp-reset", onClick: () => updateSettings({ ...DEFAULT_SETTINGS }) }, "恢复默认")
			);
		}

		function apply(ctx) {
			runtimeCtx = ctx;
			hostFontSizes = { ...ctx.theme.getTheme().fontSizes };
			hostFontFamily = ctx.theme.getTheme().fontFamilies.text;
			injectStyle(ctx, "typography.css", TYPOGRAPHY_CSS);
			injectStyle(ctx, "paper.css", PAPER_CSS);
			injectStyle(ctx, "sidebar.css", SIDEBAR_CSS);
			injectStyle(ctx, "hovercard.css", HOVERCARD_CSS);
			injectStyle(ctx, "bubble.css", BUBBLE_CSS);
			injectStyle(ctx, "stamp.css", STAMP_CSS);
			injectStyle(ctx, "settings.css", SETTINGS_CSS);

			// 设置 → DOM 门控 + token 层；卸载时整身撤走。
			ctx.effect(() => {
				applySettings();
				return () => {
					const root = document.documentElement;
					root.removeAttribute("data-warm-paper");
					root.removeAttribute("data-warm-paper-serif");
					root.removeAttribute("data-warm-paper-grain");
					root.removeAttribute("data-warm-paper-spine");
					root.removeAttribute("data-warm-paper-sidebar");
					root.removeAttribute("data-warm-paper-bubble");
					layerDispose?.();
					layerDispose = undefined;
					runtimeCtx = undefined;
				};
			}, `${PLUGIN_ID}: theme state`);

			// 宿主字号 / 正文字体的变化（通用页、快捷键）时同步本页显示。
			ctx.effect(() => {
				const off = ctx.on("theme/change", (snapshot) => {
					const next = snapshot.fontSizes;
					const nextFamily = snapshot.fontFamilies.text;
					const sizeChanged = next.text !== hostFontSizes.text
						|| next.code !== hostFontSizes.code
						|| next.terminal !== hostFontSizes.terminal;
					if (!sizeChanged && nextFamily === hostFontFamily) return;
					hostFontSizes = { text: next.text, code: next.code, terminal: next.terminal };
					hostFontFamily = nextFamily;
					for (const listener of settingsListeners) listener();
				});
				return () => off();
			}, `${PLUGIN_ID}: host font sync`);

			// 装饰只读日期，不再走 locale。
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "warm-paper-date",
				order: 60
			}, DateStamp));

			// 独立设置页：设置面板左侧的一级 tab（位于「通用设置」与「模型」之间）。
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "warm-paper",
				order: 5,
				label: "暖纸"
			}, WarmPaperSettings));

			// 同一个组件也挂在这个插件自己的 bundle 详情页上（设置 → 插件 → 暖纸）。
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
				name: "plugins.bundle.config",
				key: PLUGIN_ID
			}, WarmPaperSettings));
		}

		return {
			inject: ["theme", "slots"],
			apply
		};
	}
});
