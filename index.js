/**
 * 暖纸 Warm Paper —— Host half。
 *
 * 这个主题完全活在浏览器侧：Host 侧只保留一个空的 bundle 条目，
 * 用来让 Client half 随 profile 一起加载（见 package.json 的 dsh.client）。
 * 不做任何 Host 注册，也不写 settings 命名空间。
 */
export function apply() {}
