// 場面の長さは、台本の sec(秒)を、1拍の長さ(timeline.json の beat。曲のBPMから決まる)で割った拍数。拍数は小数でよい(秒数が、そのまま効く)
// 開始フレーム・長さ・合計は、scripts/common.mjs の makeTimeline() が計算して、timeline.json に書く(計算は1か所。ここは読むだけ)
import T from './timeline.json';

export const FPS = 60, BEAT: number = T.beat, LEAD = 0.3;
export const TR = 23;          // 場面転換の長さ(フレーム、約0.38秒)
export const HOLD = Math.round(T.hold * FPS);                 // 最後の余韻(フレーム。既定0.5秒。台本の hold(秒)で変える。0なら、sec の合計ちょうど)
export const BEATS: number[] = T.beats;
export const START_F: number[] = T.starts;
export const LEN_F: number[] = T.lens;
export const TOTAL_F: number = T.total;
