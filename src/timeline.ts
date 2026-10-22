// 場面の長さは、台本の sec(秒)を、1拍の長さ(timeline.json の beat。曲のBPMから決まる)で割った拍数。拍数は小数でよい(秒数が、そのまま効く)
import T from './timeline.json';

export const FPS = 60, BEAT: number = (T as {beat?: number}).beat ?? 60 / 124, LEAD = 0.3;
export const TR = 23;          // 場面転換の長さ(フレーム、約0.38秒)
export const HOLD = Math.round(((T as {hold?: number}).hold ?? 0.5) * 60);        // 最後の余韻(フレーム。既定0.5秒。台本の hold(秒)で変える。0なら、sec の合計ちょうど)
export const BEATS: number[] = T.beats;

const starts: number[] = []; let acc = 0;
for (const b of BEATS) { starts.push(Math.round(acc * FPS)); acc += b * BEAT; }
export const START_F = starts;
export const LEN_F = BEATS.map((_, i) => (i < BEATS.length - 1 ? starts[i + 1] : Math.round(acc * FPS)) - starts[i]);
export const TOTAL_F = Math.round(acc * FPS) + HOLD;
