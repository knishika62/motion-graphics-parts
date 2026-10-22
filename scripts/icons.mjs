// 題材の絵(アイコン)のカタログ。Lucide(オープンソースのアイコン集)から、題材に使いやすいものを、分類して選んだもの。
// LLMは、この中から名前で選ぶ。実在しない名前は、ここで除く(Lucideの名前は更新で変わるため)。
import {icons} from 'lucide-react';

const RAW = {
  '連絡・通知': 'Mail MailOpen MailCheck MessageSquare MessageCircle MessagesSquare Phone PhoneCall Bell BellRing Send Inbox Megaphone Radio AtSign',
  '人・組織': 'User Users UserCheck UserPlus UserRound Building Landmark Store Factory Briefcase Handshake Contact',
  '端末・IT': 'Smartphone Monitor Laptop Tablet Server Cloud CloudUpload Wifi Globe QrCode Printer Keyboard HardDrive Cpu Database Code Terminal Bot Brain Zap Plug',
  'データ・グラフ': 'ChartBar ChartLine ChartPie ChartColumn ChartArea TrendingUp TrendingDown Activity Gauge Table Percent Hash Calculator',
  '確認・状態': 'Check CircleCheck CheckCheck SquareCheck Eye EyeOff Clock Timer Hourglass Calendar CalendarCheck TriangleAlert Info CircleQuestionMark Flag BadgeCheck ListChecks ClipboardCheck ScanEye',
  '安全': 'Lock LockKeyhole Shield ShieldCheck Key FingerprintPattern ScanFace',
  '文書・メディア': 'File FileText Files Folder FolderOpen Paperclip Download Upload Share2 Link BookOpen Book Notebook Newspaper Presentation Image Video Camera Mic Music',
  'お金・買い物': 'JapaneseYen Coins CreditCard Wallet Banknote Receipt Tag ShoppingCart Gift PiggyBank',
  '目標・成長': 'Target Rocket Trophy Medal Star Heart ThumbsUp Lightbulb Flame Sparkles Crown Award Mountain Compass Map MapPin',
  '操作・道具': 'Settings Wrench Hammer Pencil Scissors Search Funnel SlidersHorizontal RefreshCw RotateCcw Play Power ToggleRight MousePointerClick Hand Layers LayoutGrid',
  '生活・自然': 'House Car Plane TrainFront Bike Utensils Coffee Sun Moon Umbrella Leaf TreePine Droplet Wind',
  '医療・福祉・教育': 'Stethoscope Pill HeartPulse Syringe Accessibility Baby GraduationCap School Library Ruler',
  '連絡・通知(追加)': 'BellOff BellDot MailPlus MailQuestionMark MessageSquareText MessageSquareMore MessageCircleHeart Voicemail Rss Podcast Siren Speech Ear Headphones Headset',
  '人・組織(追加)': 'UserCog UserRoundCheck UsersRound CircleUser IdCard Network Workflow Waypoints Building2 Hospital Hotel Warehouse Castle Church Tent',
  '端末・IT(追加)': 'Smartphone SmartphoneNfc TabletSmartphone MonitorSmartphone MonitorCheck LaptopMinimal Watch Webcam Router Bluetooth Usb Binary Braces FileCode GitBranch Bug Blocks Boxes Component Container CloudCheck CloudDownload ServerCog Radar Satellite SatelliteDish',
  'データ・グラフ(追加)': 'ChartNoAxesColumn ChartNoAxesCombined ChartScatter ChartSpline ChartCandlestick ChartGantt ChartNetwork ChartBarBig ChartNoAxesGantt Sigma Binoculars ListOrdered ListTodo Scale Ratio',
  '確認・状態(追加)': 'CircleAlert CircleX CircleHelp ShieldAlert Ban Bookmark BookmarkCheck CalendarClock CalendarDays CalendarRange History Hourglass Loader Milestone OctagonAlert Siren SquareCheckBig Stamp TimerReset Verified BadgeAlert BadgeInfo ClockAlert',
  '安全(追加)': 'ShieldOff ShieldQuestionMark ShieldEllipsis KeyRound KeySquare LockOpen LockKeyholeOpen Fingerprint ScanLine Vault Eye Glasses Siren Shell',
  '文書・メディア(追加)': 'FileCheck FileSearch FileLock FilePlus FileClock FileSpreadsheet FileImage FileVideo FileAudio FileBadge FolderCheck FolderLock FolderSearch Archive ArchiveRestore BookCheck BookMarked BookUser Clipboard ClipboardList ClipboardPen ScrollText StickyNote Sticker Film Clapperboard Tv Radio Podcast Presentation Signature',
  'お金・買い物(追加)': 'BadgeJapaneseYen BadgeDollarSign BadgePercent HandCoins HandHeart Handshake CircleDollarSign CirclePercent ReceiptText Store ShoppingBag ShoppingBasket Package PackageCheck PackageOpen Truck Container Barcode Ticket TicketCheck Gem',
  '目標・成長(追加)': 'Goal Flag FlagTriangleRight Telescope PartyPopper Cake Smile SmilePlus Laugh Heart HeartHandshake ThumbsUp Rainbow Sprout Seedling Clover Cherry Shapes Wand Wand2 BicepsFlexed Dumbbell Footprints Anchor Medal Podium',
  '操作・道具(追加)': 'MousePointer Pointer PointerOff Cog Wrench Drill Hammer Axe Pickaxe Shovel Paintbrush PaintBucket Palette Pipette Ruler PenTool PenLine Eraser Highlighter Type TextCursorInput Command Plus Minus X ArrowRight ArrowUpRight ArrowBigRight MoveRight Repeat Shuffle Undo2 Redo2 Maximize Expand',
  '生活・自然(追加)': 'Home Bed Sofa Lamp Shirt Bike Bus Ship Sailboat Fuel Tractor Wheat Apple Carrot Pizza Soup Salad Cookie IceCream Beer Wine Milk Egg Fish Beef Hamburger Croissant CupSoda Mountain MountainSnow Waves Sunrise Sunset Cloudy CloudRain Snowflake Thermometer Flower Flower2 Cat Dog Bird PawPrint Bone',
  '医療・福祉・教育(追加)': 'Ambulance Bandage Cross Dna Microscope TestTube FlaskConical Atom Brain BrainCircuit Activity Baby Bath Crutch Hand HandHelping Heart HeartPulse Bean PencilRuler Backpack NotebookPen Languages Globe Earth',
  '業種・サービス': 'HardHat Construction Ruler Forklift Warehouse Truck Plane Hotel Utensils ChefHat Scissors Brush Dumbbell Trophy Clapperboard Drama Gamepad2 Joystick Puzzle Dices Banknote Scale Gavel Briefcase BriefcaseBusiness Library University Landmark Newspaper Radio',
  '音楽・ダンス': 'Music Music2 Music3 Music4 Disc Disc2 Disc3 Headphones Mic Mic2 MicVocal Radio Speaker Volume2 AudioLines AudioWaveform Guitar Piano Drum ListMusic PersonStanding Footprints PartyPopper Sparkles Waves Heart HeartPulse Drama Theater',
  'AI・先端': 'Bot BotMessageSquare Brain BrainCircuit Cpu Sparkles Wand Wand2 WandSparkles Zap Atom Network Workflow Lightbulb Eye ScanFace MessageSquareText Orbit Rocket',
  '映像・写真': 'Video Videotape Film Clapperboard Camera Aperture Image Images ImagePlay Play PlayCircle Pause Tv MonitorPlay Projector Clapperboard ScanLine Focus Frame Crop Palette Layers SquarePlay',
  'プログラム・制作': 'Code Code2 CodeXml Terminal SquareTerminal FileCode GitBranch GitCommitHorizontal GitPullRequest Bug Braces Binary Blocks Boxes Component Cog Wrench Webhook Globe LayoutTemplate LayoutDashboard PanelsTopLeft Paintbrush PenTool Figma Brush',
  'マッチング・人材': 'Handshake HeartHandshake Users UsersRound UserPlus UserCheck UserSearch Contact IdCard Briefcase BriefcaseBusiness Search Link Link2 Puzzle Magnet Target Heart Smile MessageCircleHeart GraduationCap BadgeCheck',
  '不動産・住まい': 'House Home Building Building2 Warehouse Hotel Landmark Store Key KeyRound DoorOpen DoorClosed Bed Sofa Lamp Fence MapPin Map Ruler Hammer HardHat Construction Trees TreePine',
  '季節・行事・ハロウィン': 'Ghost Skull Candy CandyCane Lollipop Cookie Moon MoonStar Cat Bone Flame WandSparkles Castle Cloudy Biohazard Gift Cake PartyPopper Snowflake Leaf Flower Sun Sparkles Crown Gem Star Heart Drama',
  '美容・製品': 'Sparkles Sparkle Gem Crown Flower Flower2 Leaf Droplet Droplets Heart Star Palette Brush Scissors SprayCan Package PackageOpen Gift ShoppingBag ShoppingCart Tag Ticket Award Medal'
};
export const ICON_GROUPS = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, v.split(/\s+/).filter(n => icons[n])]));
export const ICON_NAMES = new Set(Object.values(ICON_GROUPS).flat());
export const iconCatalogText = () => Object.entries(ICON_GROUPS).map(([k, v]) => `${k}: ${v.join(' ')}`).join('\n');
