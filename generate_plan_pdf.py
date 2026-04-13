"""이지수 100일 생존 플랜 PDF 생성 (reportlab)"""
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

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "doc", "이지수_100일_생존플랜.pdf")

# ── 색상 ──
C_TITLE = HexColor("#19407A")
C_H2 = HexColor("#2A5AA0")
C_H3 = HexColor("#3C3C3C")
C_BODY = HexColor("#282828")
C_GREY = HexColor("#888888")
C_INFO_BG = HexColor("#E6F5FF")
C_WARN_BG = HexColor("#FFF0E6")
C_OK_BG = HexColor("#E6FFE6")
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
S_CHECK = ParagraphStyle("Check", fontName="Malgun", fontSize=9.5, leading=14,
                         textColor=C_BODY, leftIndent=12, bulletIndent=0,
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

W, H = A4


def bullet(text):
    return Paragraph(f"\u2022  {text}", S_BULLET)


def check(text):
    return Paragraph(f"[ ]  {text}", S_CHECK)


def body(text):
    return Paragraph(text.replace("\n", "<br/>"), S_BODY)


def info_box(text, bg=C_INFO_BG):
    """파란/주황/초록 배경 박스"""
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
    # alternating rows
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
    story.append(sp(40))
    story.append(Paragraph("이지수 100일 생존 플랜", S_TITLE_BIG))
    story.append(sp(4))
    story.append(Paragraph("Card Survival: Ruined City", S_TITLE_SUB))
    story.append(sp(3))
    story.append(Paragraph("응급의학과 전문의 | 강남구 시작 | 봄 D1~D100", S_TITLE_INFO))
    story.append(sp(8))
    story.append(Paragraph("2026-03-18 작성", S_TITLE_INFO))
    story.append(PageBreak())

    # ════════════════════ 1. 캐릭터 분석 ════════════════════
    story.append(Paragraph("1. 캐릭터 분석: 이지수 (응급의학과 전문의)", S_H1))

    story.append(Paragraph("기본 스탯", S_H2))
    story.append(make_table(
        ["항목", "수치", "평가"],
        [["HP", "95", "낮음"], ["근력", "58", "낮음"],
         ["인내심", "72", "보통"], ["최대 적재량", "32kg", "낮음"],
         ["스태미나", "~84", "보통"]],
        [40 * mm, 40 * mm, 90 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("특성 (강점)", S_H2))
    story.append(bullet("외상 전문가: 의료 아이템 치료 +50% — 붕대 하나로도 큰 회복"))
    story.append(bullet("임상 지식: 감염 진행 -35% — 질병 관리에 압도적 유리"))
    story.append(bullet("응급 처치: 붕대 HP +5 추가 — 붕대가 사실상 응급키트급"))
    story.append(bullet("시작 아이템: 붕대x2, 소독약, 진통제 — 초반 생존 안정"))
    story.append(sp())

    story.append(Paragraph("약점", S_H2))
    story.append(bullet("전투 스킬 0: 근접/원거리/비무장 모두 없음 — 초반 전투 극히 위험"))
    story.append(bullet("낮은 근력(58): 데미지 낮음, 무거운 장비 패널티"))
    story.append(bullet("낮은 적재량(32): 물자 수송 제한 — 배낭 제작 시급"))
    story.append(bullet("시작 무기 없음: 맨손 전투 (데미지 3~7)"))
    story.append(sp())

    story.append(Paragraph("시작 조건", S_H2))
    story.append(make_table(
        ["항목", "내용"],
        [["시작 위치", "강남구 (삼성서울병원)"],
         ["위험도 / 조우", "3 / 35%"],
         ["시작 스킬", "의료 Lv.4, 탐색 Lv.2"],
         ["시작 아이템", "붕대x2, 소독약, 진통제"]],
        [50 * mm, 120 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 2. 타임라인 ════════════════════
    story.append(Paragraph("2. 100일 핵심 이벤트 타임라인", S_H1))
    story.append(make_table(
        ["일차", "이벤트", "영향", "대응"],
        [["D1", "게임 시작 (봄)", "기온 13°C", "강남 삼성병원 탐색"],
         ["D7", "봄비", "음식 오염 +10", "물 퀘스트 시작 (5개)"],
         ["D12", "레이드 시작", "0.3%/TP 기습", "방어시설 필수"],
         ["D14", "꽃가루 시즌", "감염 +5", "방진마스크 착용"],
         ["D30", "봄 온기", "사기 +5", "원정 시작"],
         ["D91", "여름 시작", "수분 1.5배!", "물 10개 비축"],
         ["D100", "플랜 종료", "여름 초반", "다음 계획 수립"]],
        [20 * mm, 38 * mm, 38 * mm, 74 * mm],
    ))
    story.append(PageBreak())

    # ════════════════════ 3. Phase 1 ════════════════════
    story.append(Paragraph("3. Phase 1: 생존 기반 확보 (D1~D7)", S_H1))
    story.append(info_box(
        "[비유] 비행기가 추락했을 때 첫 72시간이 생사를 결정한다.<br/>"
        "첫 7일은 물/불/은신처를 확보하는 '골든 타임'이다."
    ))
    story.append(sp())

    story.append(Paragraph("목표", S_H2))
    story.append(bullet("삼성서울병원 탐색 — 의료 물자 대량 확보"))
    story.append(bullet("기본 생존 소재 수집 (고철, 천, 로프, 나무)"))
    story.append(bullet("캠프파이어 제작 (고철1 + 천1) — 체온 관리"))
    story.append(bullet("무기 확보 (루팅 또는 제작)"))
    story.append(bullet("물 정제 수단 확보"))
    story.append(sp())

    story.append(Paragraph("D1 상세 행동", S_H2))
    story.append(make_table(
        ["시간대", "행동", "TP", "비고"],
        [["오전", "강남구 탐색 x3", "3", "첫 방문 = 풀 루팅"],
         ["오전", "삼성병원 세부 탐색 x4", "4", "응급실/약국/연구실/창고"],
         ["오후", "인벤토리 정리", "0", "핵심 아이템 선별"],
         ["오후", "캠프파이어 제작", "1~2", "고철+천 있으면 즉시"],
         ["저녁", "대기 (체력 회복)", "-", "스태미나/피로 관리"]],
        [25 * mm, 50 * mm, 15 * mm, 80 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("D2~D3: 강남 심층 탐색", S_H3))
    story.append(bullet("삼성서울병원 미방문 세부장소 순회"))
    story.append(bullet("재방문 루팅 감소 고려 (70% → 45% → 25%)"))
    story.append(bullet("수집 목표: 붕대 4+, 소독약 2+, 정수정제 2+, 천 3+"))

    story.append(Paragraph("D4~D5: 소재 수집 + 첫 제작", S_H3))
    story.append(bullet("캠프파이어 미완성 시 최우선 제작"))
    story.append(bullet("붕대 제작 (천조각x2 → 붕대 2개)"))
    story.append(bullet("나이프/야구방망이 확보 — 전투력 확보"))
    story.append(bullet("배낭 재료 탐색 (천3 + 가죽1 + 로프1)"))

    story.append(Paragraph("D6~D7: 봄비 대비", S_H3))
    story.append(bullet("깨끗한 물 확보 시작"))
    story.append(bullet("D7 봄비: 음식 오염 +10 — 오염 음식 섭취 주의"))
    story.append(bullet("퀘스트 시작: '깨끗한 물 5개' (D21 마감)"))
    story.append(sp())

    story.append(info_box(
        "[전투 전략] 전투 회피 우선!<br/>"
        "- 적 조우시 도주 선택 (성공률 60%)<br/>"
        "- 도주 실패시 맨손 전투 → 붕대로 즉시 치료 (+50% 보너스)", C_WARN_BG
    ))
    story.append(sp())

    story.append(Paragraph("Phase 1 체크리스트", S_H2))
    story.append(check("캠프파이어 설치 (체온 관리)"))
    story.append(check("근접 무기 1개 이상 확보"))
    story.append(check("붕대 4개+ 비축"))
    story.append(check("깨끗한 물 2개+ 확보"))
    story.append(check("의료 스킬 XP 축적"))
    story.append(PageBreak())

    # ════════════════════ 4. Phase 2 ════════════════════
    story.append(Paragraph("4. Phase 2: 방어 구축 + 물 퀘스트 (D8~D14)", S_H1))
    story.append(info_box(
        "[비유] 집을 지을 때 기초 공사가 가장 중요하다.<br/>"
        "D12부터 레이드가 시작되니, 벽 세우기 전에 기둥(방어시설)부터."
    ))
    story.append(sp())

    story.append(Paragraph("인접 구역 탐색 우선순위", S_H2))
    story.append(make_table(
        ["우선도", "구역", "위험도", "조우", "이유"],
        [["5/5", "관악구", "1", "5%", "극저 위험, 서울대 연구실"],
         ["4/5", "동작구", "2", "15%", "보통 위험, 다양한 물자"],
         ["3/5", "서초구", "3", "30%", "식량/소재 루팅"],
         ["2/5", "송파구", "3", "30%", "롯데타워 (식량)"]],
        [20 * mm, 25 * mm, 20 * mm, 20 * mm, 85 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("D8~D10: 관악구 원정", S_H3))
    story.append(bullet("이동: 강남 → 관악 (2 TP, 스태미나 10 소모)"))
    story.append(bullet("관악구 풀 탐색 (첫 방문 = 풀 루팅)"))
    story.append(bullet("서울대 연구실 세부장소 4~6곳 탐색"))
    story.append(bullet("기대 루팅: 정수 필터, 의료 소재, 전자부품"))

    story.append(Paragraph("D11~D12: 방어 시설 구축", S_H3))
    story.append(bullet("바리케이드 제작 (나무3 + 못5 + 철사1)"))
    story.append(info_box(
        "D12부터 레이드 가능! 방어시설 없으면 3~6마리 적과 강제 전투", C_WARN_BG
    ))

    story.append(Paragraph("D13~D14: 꽃가루 대비", S_H3))
    story.append(bullet("D14 꽃가루 이벤트: 감염 +5"))
    story.append(bullet("퀘스트: 방진마스크 착용 (D24까지)"))
    story.append(bullet("이지수 임상 지식(-35% 감염)으로 다른 캐릭터보다 유리"))
    story.append(sp())

    story.append(Paragraph("Phase 2 체크리스트", S_H2))
    story.append(check("물 퀘스트 완료 (깨끗한 물 5개)"))
    story.append(check("바리케이드 설치"))
    story.append(check("관악구 탐색 완료"))
    story.append(check("배낭 제작 (천3+가죽1+로프1) → 적재량 +5"))
    story.append(check("방진마스크 확보"))
    story.append(PageBreak())

    # ════════════════════ 5. Phase 3 ════════════════════
    story.append(Paragraph("5. Phase 3: 전투력 강화 + 기지 확장 (D15~D30)", S_H1))
    story.append(info_box(
        "[비유] 성벽만으로는 부족하다. 직접 칼을 들 수 있어야 한다.<br/>"
        "의사라도 좀비 앞에서는 전사가 되어야 한다."
    ))
    story.append(sp())

    story.append(Paragraph("전투 레벨링 전략", S_H2))
    story.append(body(
        "이지수는 전투 스킬 0에서 시작하므로, 안전한 전투 기회를 선별 활용:<br/>"
        "- 공격 적중: 2 XP / 크리티컬: +2 XP / 적 처치: 5 XP / 피격 방어: 1 XP<br/>"
        "- 목표: D30까지 근접 Lv.2+ 달성 (약 50 XP, 적 5~8마리 처치)"
    ))

    story.append(Paragraph("전투 원칙", S_H3))
    story.append(bullet("적 1마리 조우 → 전투 (치료 아이템 충분할 때만)"))
    story.append(bullet("적 2마리 이상 → 도주 우선 (도주 확률 60%)"))
    story.append(bullet("도주 실패 → 전투 후 즉시 붕대 치료 (+50% 효율)"))
    story.append(bullet("HP 40% 이하 → 즉시 도주 시도"))

    story.append(Paragraph("D15~D20: 전투 훈련 + 소재 수집", S_H3))
    story.append(bullet("동작구/서초구 탐색 (중간 위험도)"))
    story.append(bullet("나이프/야구방망이로 근접 XP 축적"))
    story.append(bullet("소재: 나무, 못, 철사, 고철 (기지 업그레이드용)"))

    story.append(Paragraph("D21~D25: 베이스캠프 강화", S_H3))
    story.append(bullet("베이스캠프 Lv.1: 나무5 + 고철5 + 못10 → 조우 -5%, 소음 감쇠 +0.5"))
    story.append(bullet("정수기 제작 (고철3 + 로프1 + 정수필터1 + 덕테이프1)"))
    story.append(bullet("의료 스테이션 (나무2 + 천2 + 붕대5 + 응급키트1)"))

    story.append(Paragraph("D26~D30: 안정화", S_H3))
    story.append(bullet("D30 봄 온기: 사기 +5 — 원정 준비 타이밍"))
    story.append(bullet("강화 야구방망이 제작 (야구방망이 + 고철2 + 덕테이프)"))
    story.append(bullet("작업대 검토 (나무5 + 고철3 + 로프1 + 못5)"))
    story.append(sp())

    story.append(Paragraph("Phase 3 체크리스트", S_H2))
    story.append(check("근접 스킬 Lv.2+ 달성"))
    story.append(check("베이스캠프 Lv.1 완료"))
    story.append(check("정수기 설치"))
    story.append(check("의료 스테이션 설치"))
    story.append(check("강화 야구방망이 또는 상위 무기 확보"))
    story.append(check("방어구 1개 이상 착용 (헬멧 추천)"))
    story.append(PageBreak())

    # ════════════════════ 6. Phase 4 ════════════════════
    story.append(Paragraph("6. Phase 4: 탐색 확장 (D31~D60)", S_H1))
    story.append(info_box(
        "[비유] 섬에서 탈출하려면 먼저 섬의 전체 지도를 그려야 한다.<br/>"
        "강남만 알아서는 생존할 수 없다. 서울의 자원 지도를 완성하라."
    ))
    story.append(sp())

    story.append(Paragraph("탐색 루트 계획", S_H2))
    story.append(make_table(
        ["기간", "구역", "목적"],
        [["D31~35", "서초구 → 동작구", "남서쪽 확보"],
         ["D36~40", "송파구 → 강동구", "동쪽 확보"],
         ["D41~45", "용산구 → 마포구", "한강 건너기 (서쪽 다리)"],
         ["D46~50", "서대문구", "세브란스 병원 정찰!"],
         ["D51~55", "강남 복귀", "물자 정리"],
         ["D56~60", "기지 확장", "스킬 레벨링"]],
        [30 * mm, 55 * mm, 85 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("한강 횡단 전략", S_H3))
    story.append(bullet("서쪽 다리: 마포 ↔ 영등포"))
    story.append(bullet("동쪽 다리: 광진 ↔ 강동"))
    story.append(bullet("왕복 6~8구 = 12~16 TP + 스태미나 60~80"))
    story.append(bullet("반드시 스태미나 토닉/전투식량 휴대!"))

    story.append(Paragraph("서대문구 정찰 (D46~D50)", S_H3))
    story.append(body(
        "서대문구: 위험도 3, 조우 20%, 방사능 0<br/>"
        "세브란스 병원은 이지수의 최종 목표지.<br/>"
        "캐릭터 엔딩 조건: D180+, 서대문 방문, 감염 치료<br/>"
        "→ D50 시점에서는 정찰만! 본격 입성은 Phase 6 이후."
    ))

    story.append(Paragraph("레이드 확률 증가 추이", S_H3))
    story.append(make_table(
        ["일차", "확률/TP", "위험도"],
        [["D12", "0.54%", "낮음"],
         ["D30", "0.90%", "보통"],
         ["D60", "1.50%", "최대치!"]],
        [40 * mm, 50 * mm, 80 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("Phase 4 체크리스트", S_H2))
    story.append(check("6개+ 구 방문"))
    story.append(check("서대문구 세브란스 병원 정찰 완료"))
    story.append(check("근접 Lv.3 달성"))
    story.append(check("크로스보우 제작 (원거리 전투 해금)"))
    story.append(check("베이스캠프 Lv.2~3 달성"))
    story.append(check("방어 시설 3종+ 설치"))
    story.append(PageBreak())

    # ════════════════════ 7. Phase 5 ════════════════════
    story.append(Paragraph("7. Phase 5: 전력 완성 + 봄 마무리 (D61~D90)", S_H1))
    story.append(info_box(
        "[비유] 마라톤 30km 지점. 여기서 페이스를 유지하면 완주할 수 있다.<br/>"
        "여름이 오기 전에 물과 장비를 완벽히 갖춰야 한다."
    ))
    story.append(sp())

    story.append(Paragraph("여름 대비 핵심 계산", S_H2))
    story.append(info_box(
        "여름 수분 소비량:<br/>"
        "- 기본: 1.5/TP → 여름: 2.25/TP (1.5배)<br/>"
        "- 최대 수분 288 / 2.25 = 약 128 TP = 약 1.3일!<br/>"
        "→ 물 없으면 하루 반도 못 버팀. 매일 물 1~2개 필수!", C_WARN_BG
    ))

    story.append(Paragraph("D61~D70: 물자 대량 수집", S_H3))
    story.append(bullet("안전 구역 순회 — 물 관련 아이템 집중 수집"))
    story.append(bullet("정수 정제, 빈 병, 정수 필터 우선"))
    story.append(bullet("식량 병행 (통조림, 에너지바, 라면)"))

    story.append(Paragraph("D71~D80: 장비 완성", S_H3))
    story.append(bullet("헬멧 (고철2 + 천1 + 가죽1) → 머리 방어"))
    story.append(bullet("방탄 조끼 재료 탐색 → 몸통 방어"))
    story.append(bullet("크로스보우 화살 비축"))

    story.append(Paragraph("D81~D90: 최종 점검", S_H3))
    story.append(bullet("베이스캠프 Lv.4: 가죽5 + 천8 + 로프3 + 고철5"))
    story.append(bullet("  → 조우 -20%, HP +3/TP, 피로 +3/TP"))
    story.append(bullet("모든 장비 내구도 점검/수리"))
    story.append(bullet("깨끗한 물 15개+ 선제 비축"))
    story.append(sp())

    story.append(Paragraph("Phase 5 체크리스트", S_H2))
    story.append(check("베이스캠프 Lv.4 달성"))
    story.append(check("깨끗한 물 15개+ 비축"))
    story.append(check("식량 10개+ 비축"))
    story.append(check("방어구 세트 완성 (머리+몸통)"))
    story.append(check("10개+ 구 방문"))
    story.append(check("모든 장비 내구도 50%+"))
    story.append(PageBreak())

    # ════════════════════ 8. Phase 6 ════════════════════
    story.append(Paragraph("8. Phase 6: 여름 진입 + 적응 (D91~D100)", S_H1))
    story.append(info_box(
        "[비유] 사막에 들어가는 것과 같다. 물이 곧 생명이다.<br/>"
        "준비 없이 여름을 맞으면 이틀 안에 탈수로 사망한다."
    ))
    story.append(sp())

    story.append(Paragraph("D91 여름 변화", S_H2))
    story.append(make_table(
        ["항목", "봄", "여름", "영향"],
        [["기본 기온", "13°C", "27°C", "+14°C"],
         ["수분 감소", "x1.0", "x1.5", "치명적!"],
         ["기온 상승", "-", "+0.3°C/TP", "열사병 위험"],
         ["열사병 조건", "-", ">85°C 48TP", "실내 활동 권장"]],
        [40 * mm, 30 * mm, 30 * mm, 70 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("핵심 생존 규칙", S_H3))
    story.append(bullet("매일 물 1~2개 소비 → 10일간 최소 15개 필요"))
    story.append(bullet("실내 활동 우선: 건물 내부 = 외부 온도의 50%"))
    story.append(bullet("야간 이동: 자정 보정 -5°C → 더위 회피"))
    story.append(bullet("정수기 가동: 지속적 깨끗한 물 생산"))

    story.append(Paragraph("D91~D95: 여름 적응", S_H3))
    story.append(bullet("물 소비 패턴 확인 및 조정"))
    story.append(bullet("불필요한 이동 최소화"))
    story.append(bullet("스포츠 음료/정수 정제 활용"))

    story.append(Paragraph("D96~D100: 안정화 + 다음 계획", S_H3))
    story.append(bullet("여름 퀘스트 진행 (물 10개 / D111 마감)"))
    story.append(bullet("D120 폭염 대비 (기온 +15!)"))
    story.append(bullet("D135 몬순 대비 (음식 오염 +15)"))
    story.append(bullet("D150 태풍 대비 (구조물 데미지 30!)"))
    story.append(sp())

    story.append(Paragraph("Phase 6 체크리스트", S_H2))
    story.append(check("일일 물 소비량 안정화"))
    story.append(check("열사병 미발생"))
    story.append(check("여름 퀘스트 진행 중"))
    story.append(check("D100 이후 80일 계획 초안"))
    story.append(PageBreak())

    # ════════════════════ 9. 자원 예산 ════════════════════
    story.append(Paragraph("9. 100일 종합 자원 예산", S_H1))

    story.append(Paragraph("소비 추정", S_H2))
    story.append(make_table(
        ["자원", "일일", "100일 총량", "비고"],
        [["깨끗한 물", "1~2개", "100~200개", "정수기로 자급"],
         ["식량", "0.5~1개", "50~100개", "요리로 효율 상승"],
         ["붕대", "전투시 1~2", "30~50개", "제작 보충 (천x2)"],
         ["탄약", "원거리시", "20~30발", "D40+ 크로스보우"],
         ["연료", "0.5/TP", "지속", "캠프파이어 교체"]],
        [35 * mm, 30 * mm, 40 * mm, 65 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("생산 체계", S_H2))
    story.append(body(
        "[탐색] → 원소재 (천, 고철, 나무, 로프)<br/>"
        "  → [제작] → 가공품 (붕대, 무기, 구조물)<br/>"
        "  → [의료 스테이션] HP 자동 회복<br/>"
        "  → [정수기] 깨끗한 물 생산<br/>"
        "  → [캠프파이어] 체온 유지"
    ))
    story.append(PageBreak())

    # ════════════════════ 10. 위험 대책 ════════════════════
    story.append(Paragraph("10. 위험 요소 + 비상 대책", S_H1))

    story.append(Paragraph("위험 등급표", S_H2))
    story.append(make_table(
        ["등급", "위험", "대책"],
        [["치명", "탈수 사망 (여름)", "정수기 + 물 15개"],
         ["치명", "레이드 (D60+)", "바리케이드 + 트랩 + Lv.4"],
         ["높음", "패혈증 (감염70+)", "항생제 + 임상지식 -35%"],
         ["높음", "기아 (영양0)", "요리 스킬 + 식량 비축"],
         ["보통", "열사병 (여름)", "실내 + 야간 이동"],
         ["보통", "피로 쓰러짐", "대기 회복 + 기지 효과"],
         ["낮음", "방사능", "해당 구역 회피"]],
        [22 * mm, 50 * mm, 98 * mm],
    ))
    story.append(sp())

    story.append(Paragraph("비상 프로토콜", S_H2))

    story.append(Paragraph("HP 30% 이하 → RED ALERT", S_H3))
    story.append(bullet("즉시 전투 중단, 도주"))
    story.append(bullet("붕대 사용 (+50% 보너스)"))
    story.append(bullet("기지 복귀 → 의료 스테이션 HP 회복"))
    story.append(bullet("48 TP 대기 (약 반나절)"))

    story.append(Paragraph("감염 50% 이상 → YELLOW ALERT", S_H3))
    story.append(bullet("항생제/소독약 즉시 사용"))
    story.append(bullet("오염 음식/물 섭취 금지"))
    story.append(bullet("임상 지식 -35%로 시간 벌기"))

    story.append(Paragraph("소음 50+ → NOISE WARNING", S_H3))
    story.append(bullet("불필요한 탐색 중단"))
    story.append(bullet("소음 감쇠 대기 (기지 보너스 활용)"))
    story.append(bullet("60 이상 = 강제 조우 → 즉시 회피"))
    story.append(PageBreak())

    # ════════════════════ 11. 전략 요약 ════════════════════
    story.append(Paragraph("11. 이지수 100일 핵심 전략 요약", S_H1))

    story.append(info_box(
        "이지수 100일 핵심 공식:<br/><br/>"
        "  의료 효율 극대화 (치료 +50%)<br/>"
        "  + 감염 저항 (-35%)<br/>"
        "  + 스마트 전투 (회피 우선, 치료 후 복귀)<br/>"
        "  + 자원 순환 (탐색→제작→소비→탐색)<br/>"
        "  = 느리지만 확실한 생존<br/><br/>"
        "  [절대 금지] 무모한 전투, 물 낭비<br/>"
        "  [항상 유지] 물 5+, 붕대 3+, 도주 옵션", C_OK_BG
    ))
    story.append(sp(6))

    story.append(Paragraph("D100 이후 로드맵", S_H2))
    story.append(make_table(
        ["기간", "목표", "핵심 이벤트"],
        [["D101~120", "여름 물 퀘스트 완료", "D120 폭염 (+15°C)"],
         ["D121~150", "기지 Lv.5 + 여름 생존", "D135 몬순, D150 태풍"],
         ["D151~180", "캐릭터 엔딩 준비", "서대문 재방문, 감염 치료"],
         ["D181~270", "캐릭터 엔딩 도전", "D181 가을 시작"],
         ["D271~365", "겨울 생존 + 연간 엔딩", "D271 겨울 (-15°C!)"]],
        [30 * mm, 55 * mm, 85 * mm],
    ))
    story.append(sp(4))

    story.append(Paragraph("캐릭터 엔딩 조건 (이지수)", S_H2))
    story.append(Paragraph(
        "<b>Day 180+ 경과 + 서대문구 방문 + 감염 치료 달성</b><br/>"
        "→ '치료 프로토콜 수립' 엔딩 달성",
        S_BODY,
    ))

    doc.build(story)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"PDF saved: {path}")
