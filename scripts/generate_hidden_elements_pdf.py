"""숨겨진 요소 시스템 기획서 PDF 생성 (reportlab)"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── 폰트 등록 ──
FONT_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
pdfmetrics.registerFont(TTFont("Malgun", os.path.join(FONT_DIR, "malgun.ttf")))
pdfmetrics.registerFont(TTFont("MalgunBd", os.path.join(FONT_DIR, "malgunbd.ttf")))

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "doc", "숨겨진_요소_기획서.pdf")

# ── 색상 ──
C_TITLE = HexColor("#19407A")
C_H2 = HexColor("#2A5AA0")
C_H3 = HexColor("#3C3C3C")
C_BODY = HexColor("#282828")
C_GREY = HexColor("#888888")
C_INFO_BG = HexColor("#E6F5FF")
C_WARN_BG = HexColor("#FFF0E6")
C_OK_BG = HexColor("#E6FFE6")
C_LEGEND_BG = HexColor("#FFF8E1")
C_BOSS_BG = HexColor("#FFE6E6")
C_EVENT_BG = HexColor("#F0E6FF")
C_TH_BG = HexColor("#EBF0FA")

# ── 스타일 ──
S_H1 = ParagraphStyle("H1", fontName="MalgunBd", fontSize=16, leading=22,
                       textColor=C_TITLE, spaceAfter=6, spaceBefore=12)
S_H2 = ParagraphStyle("H2", fontName="MalgunBd", fontSize=13, leading=18,
                       textColor=C_H2, spaceAfter=4, spaceBefore=10)
S_H3 = ParagraphStyle("H3", fontName="MalgunBd", fontSize=11, leading=15,
                       textColor=C_H3, spaceAfter=3, spaceBefore=8)
S_BODY = ParagraphStyle("Body", fontName="Malgun", fontSize=9.5, leading=14,
                        textColor=C_BODY, spaceAfter=2)
S_BULLET = ParagraphStyle("Bullet", fontName="Malgun", fontSize=9.5, leading=14,
                          textColor=C_BODY, leftIndent=12, bulletIndent=4,
                          spaceAfter=1)
S_BOX = ParagraphStyle("Box", fontName="Malgun", fontSize=9.5, leading=14,
                       textColor=HexColor("#1E3250"), spaceAfter=2)
S_TITLE_BIG = ParagraphStyle("TitleBig", fontName="MalgunBd", fontSize=26,
                             leading=34, textColor=C_TITLE, alignment=1)
S_TITLE_SUB = ParagraphStyle("TitleSub", fontName="Malgun", fontSize=13,
                             leading=18, textColor=C_GREY, alignment=1)
S_TITLE_INFO = ParagraphStyle("TitleInfo", fontName="Malgun", fontSize=10,
                              leading=14, textColor=C_GREY, alignment=1)
S_TH = ParagraphStyle("TH", fontName="MalgunBd", fontSize=8.5, leading=11,
                       textColor=C_BODY, alignment=1)
S_TD = ParagraphStyle("TD", fontName="Malgun", fontSize=8.5, leading=11,
                       textColor=C_BODY, alignment=1)
S_TD_L = ParagraphStyle("TDL", fontName="Malgun", fontSize=8.5, leading=11,
                        textColor=C_BODY, alignment=0)

W, H = A4


def bullet(text):
    return Paragraph(f"\u2022  {text}", S_BULLET)


def body(text):
    return Paragraph(text.replace("\n", "<br/>"), S_BODY)


def info_box(text, bg=C_INFO_BG):
    p = Paragraph(text.replace("\n", "<br/>"), S_BOX)
    t = Table([[p]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#CCCCCC")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def make_table(headers, rows, col_widths=None):
    if col_widths is None:
        n = len(headers)
        col_widths = [170 * mm / n] * n

    data = [[Paragraph(h, S_TH) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), S_TD) for c in row])

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), C_TH_BG),
        ("GRID", (0, 0), (-1, -1), 0.4, HexColor("#CCCCCC")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), HexColor("#F8F8FC")))

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle(style_cmds))
    return t


def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )
    story = []
    sp = lambda n=4: Spacer(1, n * mm)

    # ════════════════════ 표지 ════════════════════
    story.append(sp(30))
    story.append(Paragraph("숨겨진 요소 시스템 기획서", S_TITLE_BIG))
    story.append(sp(4))
    story.append(Paragraph("Card Survival: Ruined City", S_TITLE_SUB))
    story.append(sp(3))
    story.append(Paragraph("5개 카테고리 \u00d7 20+ 항목 = 117개 히든 콘텐츠", S_TITLE_INFO))
    story.append(sp(8))
    story.append(Paragraph("2026-03-19 작성", S_TITLE_INFO))
    story.append(sp(6))
    story.append(info_box(
        "<b>카테고리 구성</b>\n\n"
        "\u2022 숨겨진 장소 25개 (서울 25개 구역 \u00d7 1개)\n"
        "\u2022 특수 적/보스 22개 (좀비 변이, 인간, 동물, 환경, 네메시스)\n"
        "\u2022 전설 아이템 82개 (무기, 방어구, 의료, 도구, 재료, 특수)\n"
        "\u2022 비밀 이벤트 24개 (초반, 중반, 연쇄, 후반)\n"
        "\u2022 숨겨진 레시피 22개 (무기, 방어구, 의료, 구조물, 캐릭터 전용)"
    ))
    story.append(PageBreak())

    # ════════════════════ 목차 ════════════════════
    story.append(Paragraph("목차", S_H1))
    story.append(sp(2))
    toc_items = [
        "1. 설계 철학 및 핵심 원칙",
        "2. 카테고리 1: 숨겨진 장소 (25개)",
        "3. 카테고리 2: 특수 적/보스 (22개)",
        "4. 카테고리 3: 전설 아이템 (82개)",
        "5. 카테고리 4: 비밀 이벤트 (24개)",
        "6. 카테고리 5: 숨겨진 레시피 (22개)",
        "7. 연쇄 보상 구조 (핵심 루프)",
        "8. 난이도 밸런스 타임라인",
        "9. 시스템 통합 요약",
    ]
    for item in toc_items:
        story.append(Paragraph(item, S_BODY))
        story.append(sp(1))
    story.append(PageBreak())

    # ════════════════════ 1. 설계 철학 ════════════════════
    story.append(Paragraph("1. 설계 철학 및 핵심 원칙", S_H1))
    story.append(sp())
    story.append(info_box(
        "<b>핵심 목표</b>: 탐색 동기 부여\n"
        "플레이어가 \"이 구역에 뭔가 더 있을 것 같은데...\"라는 기대감으로 반복 탐색하도록 유도"
    ))
    story.append(sp())

    story.append(Paragraph("3가지 설계 원칙", S_H2))
    story.append(bullet("<b>난이도 단계별 접근</b> \u2014 초반(D1-30) \u2192 중반(D31-100) \u2192 후반(D100+) \u2192 엔드게임(D200+)"))
    story.append(bullet("<b>복합 조건 해금</b> \u2014 단순 방문이 아닌, 아이템+캐릭터+날씨+날짜 등 조합 조건"))
    story.append(bullet("<b>연쇄 보상 구조</b> \u2014 히든 장소 \u2192 보스 드롭 \u2192 전설 레시피 해금 \u2192 전설 아이템 제작"))
    story.append(sp())

    story.append(Paragraph("전체 콘텐츠 요약", S_H2))
    story.append(make_table(
        ["카테고리", "수량", "역할"],
        [
            ["숨겨진 장소", "25", "탐색의 목적지 (구역당 1개)"],
            ["특수 적/보스", "22", "전투 챌린지 + 재료 드롭"],
            ["전설 아이템", "82", "최종 보상 (무기\u00b7방어구\u00b7의료\u00b7도구\u00b7특수)"],
            ["비밀 이벤트", "24", "스토리 분기 + 숨겨진 선택지"],
            ["숨겨진 레시피", "22", "제작 엔드 콘텐츠"],
        ],
        [40 * mm, 20 * mm, 110 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 2. 숨겨진 장소 ════════════════════
    story.append(Paragraph("2. 카테고리 1: 숨겨진 장소 (25개)", S_H1))
    story.append(info_box(
        "서울 25개 구역에 각 1개씩 배치. 단순 방문이 아닌 <b>복합 조건</b>을 충족해야 발견.\n"
        "해금 조건: 방문 횟수, 소지 아이템, 캐릭터, 날씨, 계절, 날짜, 킬 수, 제작 레벨 등"
    ))
    story.append(sp())

    story.append(Paragraph("초반 접근 가능 (D1~30)", S_H2))
    story.append(make_table(
        ["#", "장소명", "구역", "해금 조건", "보상"],
        [
            ["1", "도봉산 은자의 동굴", "도봉", "방문3+ / D14+", "은자의 약재"],
            ["2", "노원 지하상가 비밀 창고", "노원", "자물쇠따개 / D7+", "생존자 비축물자"],
            ["4", "은평 소방서 지하 창고", "은평", "소방관 or (D20+, 지렛대)", "내열 방호복"],
            ["9", "홍대 라이브클럽 지하", "마포", "D15+ / 소음 20 미만", "소음 감쇠기"],
            ["19", "목동 민방위 대피소", "양천", "D20+ / 손전등", "민방위 비축물자"],
        ],
        [8 * mm, 45 * mm, 18 * mm, 50 * mm, 49 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("중반 접근 가능 (D31~100)", S_H2))
    story.append(make_table(
        ["#", "장소명", "구역", "해금 조건", "보상"],
        [
            ["3", "북한산 숨겨진 샘", "강북", "D30+ / 비오는 날", "원시 샘물 (반복 30일)"],
            ["5", "경복궁 왕실 금고", "종로", "방문5+ / 손전등+따개 / D60+", "왕실 도검 (전설)"],
            ["6", "고려대 연구 벙커", "성북", "D45+ / 손전등 / 제작5+", "실험적 항바이러스"],
            ["7", "동대문 비밀 공방", "동대문", "천\u00d75 / D25+", "케블라 직물"],
            ["8", "세브란스 P4 연구실", "서대문", "의사 / D50+ / 방호복", "바이러스 샘플"],
            ["10", "용산 미군기지 무기고", "용산", "군인+킬20+ or D80++전자\u00d73", "M4 카빈 (전설)"],
            ["11", "삼성병원 봉인 약제실", "강남", "의사 or (지렛대+D30+)", "외과수술키트"],
            ["12", "현충원 지하 벙커", "동작", "D60+ / 킬10+ / 지도조각", "군용 통신 키트"],
            ["13", "서울대 연구용 원자로", "관악", "엔지니어 or (D70++방호복)", "핵 배터리"],
            ["14", "구로 비밀 대장간", "구로", "파이프렌치+고철\u00d75 / D35+", "장인의 대장간"],
            ["16", "서초 법원 증거물 보관소", "서초", "따개+손전등 / D40+", "압수 저격소총 (전설)"],
            ["20", "어린이대공원 동물 연구소", "광진", "D50+ / 따개", "수의과 마취제 + 보스전"],
            ["21", "성수 장인의 작업실", "성동", "엔지니어 / 방문5+ / D60+", "장인의 도구 세트"],
            ["22", "중랑 정수장 컨트롤룸", "중랑", "D40+ / 전자\u00d72+렌치", "산업용 정수기"],
            ["23", "금천 비밀 지하 공장", "금천", "D80+ / 방호복 / 킬30+", "탄약 프레스"],
        ],
        [8 * mm, 45 * mm, 18 * mm, 55 * mm, 44 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("후반 / 엔드게임 (D90+)", S_H2))
    story.append(make_table(
        ["#", "장소명", "구역", "해금 조건", "보상"],
        [
            ["15", "롯데타워 123층 펜트하우스", "송파", "밧줄사다리 / D90+", "헬리콥터 열쇠 + 보스전"],
            ["17", "KBS 비밀 방송실", "영등포", "군인+D50+ or D100++라디오", "방송 장비"],
            ["18", "김포공항 격납고", "강서", "D120+ / 엔지니어 / 제작20+", "항공기 부품 (탈출)"],
            ["24", "강동 한강 비밀 선착장", "강동", "D150+ / 15구역+ 방문", "한강 보트 (탈출)"],
            ["25", "서울시청 시장실 금고", "중구", "D100+ / 따개+지렛대+손전등", "서울 비상계획 (전체 공개)"],
        ],
        [8 * mm, 48 * mm, 18 * mm, 55 * mm, 41 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 3. 특수 적/보스 ════════════════════
    story.append(Paragraph("3. 카테고리 2: 특수 적/보스 (22개)", S_H1))
    story.append(info_box(
        "일반 좀비와 차별화된 <b>고유 AI 패턴과 특수 기술</b>을 가진 보스.\n"
        "각 보스는 <b>전용 재료를 확정 드롭</b> \u2192 전설 레시피의 핵심 재료원.", C_BOSS_BG
    ))
    story.append(sp())

    story.append(Paragraph("좀비 변이 (5)", S_H2))
    story.append(make_table(
        ["보스명", "HP", "공격", "특수 능력", "출현 조건", "드롭"],
        [
            ["제로 환자 \U0001f9ec", "200", "30~50", "바이러스 폭발(감염+30)\n매턴 재생10", "강남 / D60+", "제로 변이주"],
            ["방사선 거인 \u2622\ufe0f", "350", "40~65", "지면 강타(기절2턴+50뎀)\n방사선 오라", "종로 / D100+", "콜로서스 핵"],
            ["산성 여왕 \U0001f92e", "180", "25~40", "산성 분무(내구도-20)\n산성 웅덩이 설치", "성동 / D80+", "산성 분비선"],
            ["무리의 어미 \U0001f451", "250", "20~35", "3턴마다 좀비2 소환\n비명(소음+30)", "위험3+ / D90+", "호드 왕관"],
            ["얼어붙은 거인 \U0001f976", "300", "35~55", "냉기 숨결(체온-20)\n얼음 갑옷(방어+5)", "겨울 + 눈보라", "냉동 핵"],
        ],
        [25 * mm, 12 * mm, 15 * mm, 42 * mm, 32 * mm, 27 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("인간 적 (3)", S_H2))
    story.append(make_table(
        ["보스명", "HP", "공격", "특수 능력", "출현 조건", "드롭"],
        [
            ["약탈자 군주 \U0001f47f", "150", "30~50", "증원(레이더2)\n조준사격 40~60", "영등포/서초\nD70+", "군주의 훈장"],
            ["유령 저격수 \U0001f3af", "80", "50~80", "헤드샷(HP<30 즉사)\n위장(회피50%)", "종로/중구\nD120+", "저격 스코프"],
            ["교단 교주 \U0001f56f\ufe0f", "120", "20~35", "신도 자폭(30AoE)\n설교(아군힐20)", "성북/동대문\nD100+", "사이비 부적"],
        ],
        [25 * mm, 12 * mm, 15 * mm, 42 * mm, 32 * mm, 27 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("동물/변이 보스 (4)", S_H2))
    story.append(make_table(
        ["보스명", "HP", "공격", "특수 능력", "출현 조건", "드롭"],
        [
            ["변이 호랑이 \U0001f42f", "220", "35~55", "도약(선공보장)\n포효(기절1턴)", "광진 동물원\nD50+", "호랑이 이빨"],
            ["하수도의 왕 \U0001f40a", "280", "30~50", "죽음의 구르기(3\u00d715~25)\n잠수(무적+힐30)", "강동/광진\nD80+ 비", "하수도 비늘"],
            ["변이 여왕벌 \U0001f41d", "100", "15~25\n\u00d73", "벌떼 구름(독8/턴)\n로열젤리(힐40)", "도봉/강북\nD60+ 여름", "로열젤리"],
            ["야생견 알파 \U0001f43a", "160", "25~40\n\u00d72", "울부짖음(개3소환)\n광란(3연타)", "전역\nD40+ 소음50+", "알파 송곳니"],
        ],
        [25 * mm, 12 * mm, 15 * mm, 42 * mm, 32 * mm, 27 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("환경/이벤트 보스 (4)", S_H2))
    story.append(make_table(
        ["보스명", "HP", "특수 능력", "출현 조건", "드롭"],
        [
            ["미친 재벌 \U0001f4b0", "100", "금도금 권총 2연사 / 보디가드 소환", "롯데 펜트하우스", "금시계 (파손)"],
            ["지하철 망령 \U0001f687", "200", "열차 돌진 50~70 / 급정거(기절+소음40)", "중구 / D70+", "차장 열쇠"],
            ["군 AI 드론 \U0001f916", "150", "레이저 조준(필중크리) / EMP 방패", "용산 / D100+", "AI 칩"],
            ["실험체 X \U0001f9eb", "400", "저항 변경(3턴) / 독혈(반격10) / 재생15", "세브란스 / D150+", "변이 심장"],
        ],
        [25 * mm, 12 * mm, 55 * mm, 35 * mm, 30 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("계절/날씨 보스 (4) + 캐릭터 네메시스 (2)", S_H2))
    story.append(make_table(
        ["보스명", "HP", "특수 능력", "출현 조건", "드롭"],
        [
            ["화염 변이체 \U0001f525", "180", "열파(탈수) / 자폭 40~60", "여름 + 극서", "화염 핵"],
            ["장마 수괴 \U0001f30a", "250", "홍수(구조물파괴) / 익사(스태0)", "한강 / D135+ / 장마", "리바이어던 비늘"],
            ["눈보라 망령 \U0001f47b", "160", "서리 손길(무기동결) / 눈보라 은신(회피40%)", "겨울 + 눈보라", "레이스 정수"],
            ["산성비 괴물 \u2623\ufe0f", "200", "산성비 소환(24TP) / 방어구 용해(-15)", "가을 + 산성비", "산성 결정"],
            ["감염된 동료 의사 \U0001fa7a", "180", "수술 일격(방어무시50%) / 바이러스 주입(감염+40)", "의사 / 강남 / D80+", "군의관 배지"],
            ["미친 기계공 \U0001f527", "140", "터렛 배치(15/턴) / EMP 수류탄", "엔지니어 / 성동 / D90+", "공병 장비"],
        ],
        [28 * mm, 12 * mm, 55 * mm, 38 * mm, 30 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 4. 전설 아이템 ════════════════════
    story.append(Paragraph("4. 카테고리 3: 전설 아이템 (82개)", S_H1))
    story.append(info_box(
        "금색 카드 테두리, rarity: 'legendary'. 히든 장소 보상 또는 보스 드롭으로만 획득.\n"
        "보스 드롭 재료 \u2192 전설 레시피 \u2192 전설 장비라는 <b>3단계 진행 루프</b>의 핵심.", C_LEGEND_BG
    ))
    story.append(sp())

    story.append(Paragraph("전설 무기 (6)", S_H2))
    story.append(make_table(
        ["무기명", "종류", "데미지", "특수 효과", "획득처"],
        [
            ["왕실 도검 \u2694\ufe0f", "근접", "35~55", "크리30% / 크리킬 무소음", "경복궁 금고"],
            ["M4 카빈 \U0001f52b", "화기", "45~70", "크리 시 3점사", "용산 미군기지"],
            ["압수 저격소총 \U0001f3af", "화기", "60~90", "크리35% / HP<50 즉사", "서초 법원 보관소"],
            ["서리 칼날 \u2744\ufe0f", "근접", "30~48", "30% 빙결(기절1턴)", "제작 (냉동 핵)"],
            ["산성 채찍 \U0001f9ea", "근접", "22~38", "방어감소 스택 / AoE", "제작 (산성 분비선)"],
            ["군주의 소총 \U0001f480", "화기", "50~75", "킬 시 적 도주 30%", "약탈자 군주 드롭"],
        ],
        [30 * mm, 15 * mm, 20 * mm, 50 * mm, 45 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("전설 방어구 (5)", S_H2))
    story.append(make_table(
        ["방어구명", "피해감소", "특수 효과", "획득처"],
        [
            ["악어 비늘 갑옷 \U0001f40a", "35%", "완전 방수", "제작 (하수도 비늘)"],
            ["위장복 \U0001f33f", "-", "조우율 -50% / 은신 90%", "제작 (레이스 정수)"],
            ["용린 방탄복 \U0001f6e1\ufe0f", "40%", "최강 방어구", "제작 (변이심장+케블라)"],
            ["내산성 망토 \u2623\ufe0f", "-", "산성비 면역 / 오염 -90%", "산성비 괴물 드롭"],
            ["내열 방호복 \U0001f525", "-", "온도 면역 72TP / 방사선 -30%", "은평 소방서"],
        ],
        [35 * mm, 20 * mm, 55 * mm, 50 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("전설 의료 (4)", S_H2))
    story.append(make_table(
        ["아이템명", "효과", "특수", "획득처"],
        [
            ["외과전문 수술키트 \U0001f3e5", "HP+100 / 감염-70", "모든 질병 치료", "삼성병원 약제실"],
            ["완성형 항바이러스 \U0001f489", "감염 0 리셋", "영구 감염저항 +50%", "제작 (바이러스 샘플)"],
            ["로열젤리 \U0001f36f", "HP+60 / 감염-50 / 피로-40", "질병 치료", "여왕벌 보스 드롭"],
            ["은자의 약재 \U0001f33f", "감염-40 / 사기+20", "30일마다 반복 획득", "도봉산 은자동굴"],
        ],
        [35 * mm, 40 * mm, 35 * mm, 45 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("전설 도구 (5) + 특수 (4)", S_H2))
    story.append(make_table(
        ["아이템명", "종류", "효과", "획득처"],
        [
            ["장인의 도구 세트 \U0001f527", "도구", "제작 성공률 +50% / 시간 -30%", "성수 장인의 작업실"],
            ["탄약 프레스 \u2699\ufe0f", "구조물", "탄약 제작 해금", "금천 지하 공장"],
            ["승무원 통행증 \U0001f3ab", "악세서리", "이동 TP 50% 감소", "지하철 망령 드롭"],
            ["핵 배터리 \u2622\ufe0f", "구조물", "구조물 100일 가동", "서울대 원자로"],
            ["호랑이 이빨 목걸이 \U0001f42f", "악세서리", "크리 +15% / 배율 +0.5", "변이 호랑이 드롭"],
            ["여왕 페로몬 \U0001f451", "소모품", "좀비 24TP 퇴치", "무리의 어미 드롭"],
            ["수의과 마취제 \U0001f489", "소모품", "보스 포함 2턴 기절", "동물원 연구소"],
            ["금시계 \u231a", "악세서리", "사기 감소율 -50%", "미친 재벌 드롭"],
            ["방수 컨테이너 \U0001f4e6", "도구", "8슬롯 / 오염 면역", "장마 수괴 드롭"],
        ],
        [35 * mm, 18 * mm, 55 * mm, 52 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("보스 드롭 재료 (21종)", S_H2))
    story.append(body(
        "각 보스가 확정 드롭하는 고유 재료. 전설 레시피 제작에 필수:\n"
        "제로 변이주, 콜로서스 핵, 산성 분비선, 호드 왕관, 냉동 핵, 군주의 훈장, "
        "저격 스코프, 사이비 부적, 호랑이 이빨, 하수도 비늘, 알파 송곳니, "
        "차장 열쇠, AI 칩, 변이 심장, 화염 핵, 리바이어던 비늘, 레이스 정수, "
        "산성 결정, 군의관 배지, 공병 장비, 금시계(파손)"
    ))
    story.append(PageBreak())

    # ════════════════════ 5. 비밀 이벤트 ════════════════════
    story.append(Paragraph("5. 카테고리 4: 비밀 이벤트 (24개)", S_H1))
    story.append(info_box(
        "특정 조건에서 트리거되는 스토리 이벤트. 2~4개 선택지, 결과 분기.\n"
        "초반 이벤트로 시스템 학습 \u2192 체인 이벤트로 장기 목표 \u2192 후반 이벤트로 엔딩 분기", C_EVENT_BG
    ))
    story.append(sp())

    story.append(Paragraph("초반 이벤트 D1~30 (4개)", S_H2))
    story.append(make_table(
        ["이벤트명", "트리거 조건", "선택지/결과"],
        [
            ["라디오 속삭임 \U0001f4fb", "D5~15 / 야간 / 라디오 소지", "신호 추적 \u2192 히든 장소 공개 or 적 조우"],
            ["버려진 수레 \U0001f6d2", "D3~20 / 탐색 시 5%", "수색 \u2192 함정(HP-15) or 식량 획득"],
            ["아이의 울음소리 \U0001f476", "D7~25 / 주거구역 / 사기30+", "구조 시도 \u2192 3부작 체인 이벤트 시작"],
            ["첫 비 \U0001f327\ufe0f", "D7~14 / 첫 비 이벤트", "빈 병 \u2192 빗물3 획득 / 무시 \u2192 사기-5"],
        ],
        [30 * mm, 40 * mm, 90 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("중반 이벤트 D31~100 (6개)", S_H2))
    story.append(make_table(
        ["이벤트명", "트리거 조건", "선택지/결과"],
        [
            ["떠돌이 상인 \U0001f9d4", "D30~90 / 위험2이하 / 3%/일", "교역(희귀아이템) or 약탈 or 무시"],
            ["생존자 캠프 발견 \U0001f3d5\ufe0f", "D40~80 / 저위험 구역", "합류(정보) or 식량 교환 or 무시"],
            ["군 물자 투하 \U0001f4e6", "D50~90 / 라디오 소지 / 2%/일", "물자 쟁탈전 + 적 조우 위험"],
            ["저주받은 병원 \U0001f3e5", "D40~70 / 병원 / 야간 / HP<50%", "의료물자 + 보스전 위험"],
            ["다리 봉쇄 \U0001f309", "D60~100 / 한강 횡단 시", "통행료 or 전투 or 우회(TP소모)"],
            ["공장 폭발 \U0001f4a5", "D45~80 / 공업지구 / 소음60+", "폭발 현장 탐색 \u2192 히든 장소 공개"],
        ],
        [30 * mm, 42 * mm, 88 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("연쇄 이벤트 (3부작 \u00d7 2 = 6개)", S_H2))
    story.append(info_box(
        "<b>잃어버린 아이 3부작</b>\n"
        "1단계: 울음소리 발견 \u2192 아이 보호\n"
        "2단계: 마포 약국에서 아이 약 구하기\n"
        "3단계: 어머니 찾기 완료 \u2192 <b>어머니의 목걸이</b> (전설 악세서리, 사기감소 -40%)\n\n"
        "<b>지하 네트워크 3부작</b>\n"
        "1단계: 지하철역에서 수상한 지도 조각 발견\n"
        "2단계: 좌표 따라가기 \u2192 생존자 네트워크 접선\n"
        "3단계: 30명 생존자 지하도시 발견 \u2192 히든 장소 해금 + 교역로 개방"
    ))
    story.append(sp())

    story.append(Paragraph("후반 이벤트 D100+ (8개)", S_H2))
    story.append(make_table(
        ["이벤트명", "트리거 조건", "핵심 결과"],
        [
            ["헬기 신호 \U0001f681", "D150+ / 방송장비 or 라디오", "구출 엔딩 준비"],
            ["마지막 겨울 \u2744\ufe0f", "D300+ / 극한파", "연료 수색 or 구조물 해체"],
            ["치료제 방송 \U0001f4e1", "D200+ / 의사 or 약사", "특별 엔딩 루트"],
            ["약탈자 동맹 제안 \U0001f91d", "D80+ / 킬40+", "동맹 or 전투 or 포섭"],
            ["미스터리 신호 \U0001f4e1", "D100+ / 라디오 / 만월", "시청 금고 좌표 획득"],
            ["여진 \U0001f30b", "D120+ / 1%/일", "히든 장소 자동 해금 + 구조물 피해"],
            ["일식 \U0001f311", "D180 고정", "좀비-80% / 레이더+100% / 12TP 한정"],
            ["봄의 귀환 \U0001f338", "D365+", "2년차 콘텐츠 해금 / 감염율 영구 -10%"],
        ],
        [28 * mm, 42 * mm, 90 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 6. 숨겨진 레시피 ════════════════════
    story.append(Paragraph("6. 카테고리 5: 숨겨진 레시피 (22개)", S_H1))
    story.append(info_box(
        "일반 제작 목록에 표시되지 않음. 특정 조건(히든 장소 발견, 보스 처치, 캐릭터 전용) 해금 후 제작 가능.\n"
        "모두 rarity: 'legendary'. 대장간(master_forge) 필요 레시피가 핵심 엔드 콘텐츠."
    ))
    story.append(sp())

    story.append(Paragraph("전설 무기 레시피 (5)", S_H2))
    story.append(make_table(
        ["레시피명", "재료", "필요 도구", "해금 조건"],
        [
            ["산성 채찍", "산성분비선 + 로프\u00d72 + 가죽", "대장간", "산성 여왕 처치"],
            ["폭발 석궁 화살", "볼트\u00d73 + 화약 + 철사", "작업대", "D50+ / 제작5+"],
            ["전기 칼날", "나이프 + 전자\u00d72 + 철사\u00d72 + 스프링", "작업대", "성수 작업실 발견"],
            ["소음기 권총", "권총 + 고철\u00d72 + 고무 + 덕테이프", "작업대", "D40+ / 원거리 숙련3+"],
            ["극강화 배트", "강화배트 + 고철\u00d73 + 철사\u00d72 + 덕테이프\u00d72", "대장간", "구로 대장간 발견"],
        ],
        [25 * mm, 55 * mm, 20 * mm, 55 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("전설 방어구 레시피 (3)", S_H2))
    story.append(make_table(
        ["레시피명", "재료", "필요 도구", "해금 조건"],
        [
            ["용린 방탄복", "변이심장 + 케블라 + 고철\u00d75 + 가죽\u00d73", "대장간", "구로 대장간 + 실험체X 처치"],
            ["극한 방한복", "냉동핵 + 천\u00d75 + 가죽\u00d72 + 실\u00d75", "작업대", "얼어붙은 거인 처치"],
            ["은밀 슈트", "천\u00d75 + 가죽\u00d73 + 고무\u00d72 + 실\u00d73", "작업대", "D60+ / 제작8+"],
        ],
        [25 * mm, 55 * mm, 20 * mm, 60 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("전설 의료 레시피 (4)", S_H2))
    story.append(make_table(
        ["레시피명", "재료 (단계별)", "필요 도구", "해금 조건"],
        [
            ["백신", "바이러스샘플+항생제\u00d73 \u2192 소독\u00d72 \u2192 정수\u00d72", "작업대+의료", "세브란스 연구실 발견"],
            ["고급 외상 키트", "구급상자+항생제 \u2192 소독\u00d72+거즈\u00d75", "의료 스테이션", "의료 숙련도 6+"],
            ["전투 자극제", "스태미나토닉\u00d72+알코올+진통제", "캠프파이어", "D30+"],
            ["야전 수혈 키트", "구급상자+거즈\u00d73+정수 \u2192 고무", "의료 스테이션", "의료 숙련도 5+"],
        ],
        [25 * mm, 55 * mm, 22 * mm, 55 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("전설 소모품 (3) + 구조물 (3)", S_H2))
    story.append(make_table(
        ["레시피명", "재료", "필요 도구", "해금 조건"],
        [
            ["생존자의 만찬", "통조림+밥+건조육+정수+비타민", "캠프파이어", "요리 숙련도 7+"],
            ["방사선 정화제", "숯필터\u00d72+정수\u00d72 \u2192 소독", "작업대", "서울대 원자로 발견"],
            ["만능 해독제", "항생제+비타민\u00d72+허브차\u00d72 \u2192 소독", "캠프+작업대", "의료8+ or 약사"],
            ["자동 터렛", "전자\u00d75+고철\u00d78 \u2192 철사\u00d73+스프링\u00d72 \u2192 탄약\u00d720", "대장간", "금천 지하공장 발견"],
            ["강화 쉘터", "고철\u00d710+나무\u00d78 \u2192 못\u00d720+철사\u00d75 \u2192 로프\u00d73", "작업대", "건축 숙련도 8+"],
            ["태양광 발전기", "전자\u00d75+고철\u00d73 \u2192 철사\u00d75+고무\u00d72", "작업대", "서울대 원자로 발견"],
        ],
        [25 * mm, 55 * mm, 20 * mm, 55 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("캐릭터 전용 레시피 (4)", S_H2))
    story.append(make_table(
        ["레시피명", "캐릭터", "재료", "효과"],
        [
            ["야전 연구실", "이지수 (의사)", "의료스테이션+전자\u00d73+소독\u00d73", "고급 의약품 제조 해금"],
            ["비상 발전기", "정대한 (엔지니어)", "고철\u00d76+철사\u00d73+전자\u00d72+고무", "전력 공급 50일"],
            ["지향성 지뢰", "강민준 (군인)", "화약\u00d72+고철\u00d73+철사\u00d72+전자", "AoE 50~80 트랩"],
            ["면역 혈청", "한소희 (약사)", "제로변이주+항생제\u00d72+비타민\u00d73", "영구 감염 면역"],
        ],
        [25 * mm, 30 * mm, 55 * mm, 50 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 7. 연쇄 보상 구조 ════════════════════
    story.append(Paragraph("7. 연쇄 보상 구조 (핵심 루프)", S_H1))
    story.append(sp())
    story.append(info_box(
        "<b>핵심 진행 루프</b>\n\n"
        "탐색 \u2192 히든 장소 발견 \u2192 보스 전투 \u2192 재료 드롭\n"
        "  \u2193                                         \u2193\n"
        "레시피 해금 조건 충족 \u2190\u2500\u2500\u2500\u2500\u2500 전설 레시피 재료 확보\n"
        "  \u2193\n"
        "전설 아이템 제작 \u2192 더 강한 보스 도전 \u2192 엔딩 분기", C_OK_BG
    ))
    story.append(sp())

    story.append(Paragraph("예시 경로: 백신 엔딩", S_H2))
    story.append(make_table(
        ["단계", "행동", "결과"],
        [
            ["1", "세브란스 P4 연구실 발견 (의사+D50++방호복)", "바이러스 샘플 획득"],
            ["2", "백신 레시피 해금", "제작 목록에 백신 등장"],
            ["3", "항생제\u00d73 + 소독\u00d72 + 정수\u00d72 수집", "백신 제작 재료 확보"],
            ["4", "백신 제작 (10TP, 3단계)", "백신 1개 완성"],
            ["5", "제로 환자 보스 처치 (강남, D60+)", "제로 변이주 드롭"],
            ["6", "면역 혈청 제작 (약사 전용)", "영구 감염 면역"],
            ["7", "치료제 방송 이벤트 트리거 (D200+)", "특별 엔딩 달성"],
        ],
        [12 * mm, 60 * mm, 90 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("예시 경로: 헬리콥터 탈출", S_H2))
    story.append(make_table(
        ["단계", "행동", "결과"],
        [
            ["1", "롯데타워 펜트하우스 진입 (밧줄사다리+D90+)", "미친 재벌 보스전"],
            ["2", "보스 처치 후 헬리콥터 열쇠 획득", "옥상 헬리콥터 접근 가능"],
            ["3", "KBS 방송실 발견 (방송장비 획득)", "구조 신호 송출 가능"],
            ["4", "헬기 신호 이벤트 트리거 (D150+)", "구출 엔딩 준비 완료"],
        ],
        [12 * mm, 65 * mm, 85 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 8. 난이도 밸런스 ════════════════════
    story.append(Paragraph("8. 난이도 밸런스 타임라인", S_H1))
    story.append(sp())

    story.append(make_table(
        ["시기", "일자", "접근 가능 콘텐츠", "보스 HP 범위", "핵심 보상"],
        [
            ["초반", "D1~30", "장소 5 / 이벤트 4 / 레시피 2", "보스 없음", "기본 의료·도구"],
            ["중반", "D31~100", "장소 10 / 이벤트 10 / 레시피 8", "HP 100~200", "전설 무기·방어구 재료"],
            ["후반", "D100~200", "장소 8 / 이벤트 8 / 레시피 8", "HP 200~300", "전설 제작 완성"],
            ["엔드게임", "D200+", "장소 2 / 이벤트 3 / 레시피 4", "HP 350~400", "엔딩 키 아이템"],
        ],
        [20 * mm, 22 * mm, 50 * mm, 30 * mm, 40 * mm],
    ))
    story.append(sp(6))

    story.append(Paragraph("보스 난이도 곡선", S_H2))
    story.append(make_table(
        ["난이도", "보스 예시", "HP", "추천 장비"],
        [
            ["하", "야생견 알파 / 유령 저격수", "80~160", "강화배트 + 가죽갑옷"],
            ["중", "산성 여왕 / 제로 환자 / 화염 변이체", "180~200", "크로스보우 + 방탄조끼"],
            ["상", "무리의 어미 / 하수도왕 / 얼어붙은 거인", "250~300", "전설 무기 + 전설 방어구"],
            ["극", "방사선 거인 / 실험체 X", "350~400", "전설 풀세트 + 소모품"],
        ],
        [15 * mm, 55 * mm, 22 * mm, 68 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 9. 시스템 통합 ════════════════════
    story.append(Paragraph("9. 시스템 통합 요약", S_H1))
    story.append(sp())

    story.append(Paragraph("GameState.flags 추가 필드", S_H2))
    story.append(make_table(
        ["필드", "타입", "용도"],
        [
            ["hiddenLocationsDiscovered", "Array", "발견한 히든 장소 ID 배열"],
            ["bossesKilled", "Array", "처치한 보스 ID 배열"],
            ["legendaryItemsFound", "Array", "획득한 전설 아이템 ID 배열"],
            ["secretEventsTriggered", "Array", "발생한 비밀 이벤트 ID 배열"],
            ["hiddenRecipesUnlocked", "Array", "해금한 레시피 ID 배열"],
            ["eventChainProgress", "Object", "연쇄 이벤트 진행 상태"],
            ["stealthKills", "Number", "무소음 크리킬 카운터"],
            ["diseaseCured", "Number", "질병 치료 카운터"],
            ["meleeKills", "Number", "근접무기 킬 카운터"],
        ],
        [50 * mm, 20 * mm, 90 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("시스템별 통합 포인트", S_H2))
    story.append(make_table(
        ["시스템", "통합 내용"],
        [
            ["ExploreSystem", "탐색 시 히든 장소 해금 조건 체크 + 보스 스폰"],
            ["CombatSystem", "보스 AI 패턴 / 전용 드롭 / 킬 카운터 추적"],
            ["CraftSystem", "히든 레시피 병합 / 해금 조건 / master_forge 도구 요구"],
            ["SeasonSystem / WeatherSystem", "날씨·계절 조건부 보스 및 이벤트 트리거"],
            ["QuestSystem", "이벤트 체인 진행 추적"],
            ["HiddenElementSystem (신규)", "전체 히든 요소 오케스트레이션 (661줄)"],
        ],
        [45 * mm, 115 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("EventBus 신규 이벤트 채널", S_H2))
    story.append(make_table(
        ["이벤트", "데이터", "발생 시점"],
        [
            ["hiddenLocationDiscovered", "{ locationId, location }", "히든 장소 최초 발견 시"],
            ["bossKilled", "{ bossId, boss }", "보스 처치 시"],
            ["secretEventTriggered", "{ event }", "비밀 이벤트 발동 시"],
            ["recipeUnlocked", "{ recipeId, recipe }", "히든 레시피 해금 시"],
            ["structureDamage", "{ damagePercent }", "구조물 피해 발생 시"],
        ],
        [42 * mm, 42 * mm, 76 * mm],
    ))
    story.append(sp(4))

    story.append(Paragraph("데이터 파일 구조", S_H2))
    story.append(make_table(
        ["파일", "내용", "항목 수"],
        [
            ["js/data/hiddenLocations.js", "숨겨진 장소 정의", "25개"],
            ["js/data/secretEnemies.js", "특수 적/보스 정의", "22개"],
            ["js/data/legendaryItems.js", "전설급 아이템 정의", "82개"],
            ["js/data/secretEvents.js", "비밀 이벤트 정의", "24개"],
            ["js/data/hiddenRecipes.js", "숨겨진 레시피 정의", "22개"],
            ["js/systems/HiddenElementSystem.js", "히든 요소 오케스트레이션", "661줄"],
        ],
        [55 * mm, 55 * mm, 20 * mm],
    ))

    doc.build(story)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"PDF saved: {path}")
