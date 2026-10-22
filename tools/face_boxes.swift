// 画像から、顔の位置を検出して出す(macOS の Vision。macOS 専用)。layers.iconsAvoid に、そのまま使える形(0〜1、左上が原点)。
//   使い方: swift tools/face_boxes.swift assets/名前/*.jpg
//   出力(1画像1行): ファイル名 \t [x0,y0,x1,y1] (顔が複数なら、カンマ区切りで並ぶ)。顔が見つからないときは「なし」
// iconsAvoid には、顔より一回り(1.6倍ぐらい)大きい領域を指定する(写真の動き pmotion で、顔が動くため)。
import Foundation
import Vision
import AppKit

for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("\((path as NSString).lastPathComponent)\tERR"); continue }
  let req = VNDetectFaceRectanglesRequest(); try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  let r = (req.results ?? []).map { o -> String in let b = o.boundingBox; return String(format: "[%.3f,%.3f,%.3f,%.3f]", b.minX, 1 - b.maxY, b.maxX, 1 - b.minY) }
  print("\((path as NSString).lastPathComponent)\t\(r.isEmpty ? "なし" : r.joined(separator: ","))")
}
