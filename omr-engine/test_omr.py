import cv2
import numpy as np

# ============================================================
# JY School OMR Processor - Auto-Calibrated Coordinates
# Pixel positions found via full-scan diagnostic
# ============================================================

TARGET_W = 1200
TARGET_H = 1600

# ── EXACT BUBBLE POSITIONS (from auto-scan) ──────────────────
GRID_Y_START     = 752    # Y of Q01 bubble center
GRID_ROW_SPACING = 41     # pixels between question rows

GROUPS_X = [
    [132, 169, 208, 248],    # Group 1  (Q01–Q15):  A  B  C  D
    [350, 389, 426, 464],    # Group 2  (Q16–Q30)
    [567, 603, 641, 679],    # Group 3  (Q31–Q45)
    [780, 816, 855, 889],    # Group 4  (Q46–Q60)
    [993, 1031, 1069, 1107], # Group 5  (Q61–Q75)
]

OPTIONS     = ['A', 'B', 'C', 'D']
OPT_IDX_MAP = {'A': 0, 'B': 1, 'C': 2, 'D': 3}

# ─────────────────────────────────────────────────────────────
def _load(image_path):
    raw   = cv2.imread(image_path)
    sheet = cv2.resize(raw, (TARGET_W, TARGET_H))   # no warp — flat scan
    gray  = cv2.cvtColor(sheet, cv2.COLOR_BGR2GRAY)
    gray  = cv2.GaussianBlur(gray, (3, 3), 0)
    return sheet, gray

def _mean(gray, cx, cy, r=13):
    region = gray[max(0, cy-r):cy+r, max(0, cx-r):cx+r]
    return float(np.mean(region)) if region.size > 0 else 255.0

# ─────────────────────────────────────────────────────────────
def read_answers(image_path, fill_threshold=140):
    """Return {q_num: 'A'|'B'|'C'|'D'|None}"""
    _, gray = _load(image_path)
    answers = {}
    for g_idx, gxs in enumerate(GROUPS_X):
        for row in range(15):
            q   = g_idx * 15 + row + 1
            y   = GRID_Y_START + row * GRID_ROW_SPACING
            vals = [_mean(gray, x, y) for x in gxs]
            min_val = min(vals)
            if min_val < fill_threshold:
                answers[q] = OPTIONS[vals.index(min_val)]
            else:
                answers[q] = None
    return answers

def score_omr(image_path, answer_key: dict, fill_threshold=140):
    """
    answer_key: {q_num: 'A'|'B'|'C'|'D'}
    Returns (student_answers, score, correct, wrong, attempted)
    """
    answers  = read_answers(image_path, fill_threshold)
    correct  = sum(1 for q, ans in answer_key.items() if answers.get(q) == ans)
    wrong    = sum(1 for q, ans in answer_key.items()
                   if answers.get(q) is not None and answers.get(q) != ans)
    attempted = correct + wrong
    score    = correct * 4
    return answers, score, correct, wrong, attempted

# ─────────────────────────────────────────────────────────────
def calibrate(image_path):
    sheet, _ = _load(image_path)
    output   = sheet.copy()
    for g_idx, gxs in enumerate(GROUPS_X):
        for row in range(15):
            q = g_idx * 15 + row + 1
            y = GRID_Y_START + row * GRID_ROW_SPACING
            for x in gxs:
                cv2.circle(output, (x, y), 13, (0, 255, 0), 2)
            cv2.putText(output, str(q), (gxs[0]-20, y+5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.28, (0, 0, 255), 1)
    cv2.imwrite("omr_calibration.jpg", output)
    print("Saved omr_calibration.jpg — GREEN circles should be ON every bubble.")

def debug_answers(image_path, fill_threshold=140):
    sheet, gray = _load(image_path)
    output = sheet.copy()
    answers = read_answers(image_path, fill_threshold)

    for g_idx, gxs in enumerate(GROUPS_X):
        for row in range(15):
            q   = g_idx * 15 + row + 1
            y   = GRID_Y_START + row * GRID_ROW_SPACING
            det = answers.get(q)
            if det and det in OPT_IDX_MAP:
                x = gxs[OPT_IDX_MAP[det]]
                cv2.circle(output, (x, y), 15, (0, 0, 255), 3)
                cv2.putText(output, det, (x-6, y+5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 2)

    cv2.imwrite("omr_answers.jpg", output)
    print("\n=== Detected Answers ===")
    for q, a in sorted(answers.items()):
        print(f"  Q{q:02d}: {a if a else 'BLANK'}")
    filled = sum(1 for a in answers.values() if a)
    print(f"\nFilled: {filled}/75   Blank: {75-filled}/75")
    print("Saved omr_answers.jpg")

if __name__ == "__main__":
    IMAGE = "../OMR_SAMPLE (1).jpg"
    print("=== Calibration ===")
    calibrate(IMAGE)
    print("\n=== Answer Detection ===")
    debug_answers(IMAGE)
