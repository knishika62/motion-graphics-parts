// 画像(動画のコマ)から、顔と文字を検出して、文字が顔にかかっていないかを調べる(macOS の Vision。macOS 専用)。
//   使い方: swift tools/check_face_text.swift コマ1.png コマ2.png ...        (ふつうは、check_face_text.mjs から呼ぶ)
//   出力(1コマ1行): ファイル名 \t 顔の数 \t 文字の数 \t OK または 「文字」かぶりN%
//   かぶり = 顔の面積のうち、文字の枠(縁取り・影のぶん、少し広げる)に隠れている割合。しきい値は、環境変数 FACE_TEXT_THRESHOLD(既定 0.06)
import Foundation
import Vision
import AppKit

let threshold = Double(ProcessInfo.processInfo.environment["FACE_TEXT_THRESHOLD"] ?? "") ?? 0.06
let inter = { (a: CGRect, b: CGRect) -> CGFloat in let r = a.intersection(b); return r.isNull ? 0 : r.width * r.height }
let flip = { (b: CGRect) -> CGRect in CGRect(x: b.minX, y: 1 - b.maxY, width: b.width, height: b.height) }   // 左下原点 → 左上原点

for path in CommandLine.arguments.dropFirst() {
  let name = (path as NSString).lastPathComponent
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("\(name)\t\tERR\t読めない"); continue }
  let handler = VNImageRequestHandler(cgImage: cg, options: [:])
  let faceReq = VNDetectFaceRectanglesRequest()
  let textReq = VNRecognizeTextRequest(); textReq.recognitionLevel = .accurate; textReq.recognitionLanguages = ["ja-JP", "en-US"]
  try? handler.perform([faceReq, textReq])
  let faces = (faceReq.results ?? []).map { flip($0.boundingBox) }
  let texts = (textReq.results ?? []).compactMap { o -> (CGRect, String)? in guard let c = o.topCandidates(1).first else { return nil }; return (flip(o.boundingBox), c.string) }
  var hits: [String] = []
  for f in faces { for (tb, s) in texts {
    let ov = inter(f, tb.insetBy(dx: -0.012, dy: -0.012)) / (f.width * f.height)
    if Double(ov) > threshold { hits.append(String(format: "「%@」かぶり%.0f%%", s, ov * 100)) }
  } }
  print("\(name)\t顔\(faces.count)\t文字\(texts.count)\t\(hits.isEmpty ? "OK" : hits.joined(separator: " / "))")
}
