#!/usr/bin/env python3
"""Build public ASAM correctional-settings comment PDF for /policy.

Citation capsules are small rounded rectangles: [P63 L24]
"""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
COMMENTS_JSON = ROOT / "src/data/asam-correctional-line-comments-2026.json"
OUT_PDF = ROOT / "public/files/policy/asam-correctional-settings-2026.pdf"

TEAL = HexColor("#0F766E")
TEAL_FILL = HexColor("#E6F5F3")
TEXT = HexColor("#1F2937")
MUTED = HexColor("#4B5563")


def format_capsule(page: int, line: int) -> str:
    return f"[P{page} L{line}]"


class CitationCapsule(Flowable):
    """Compact rounded-rectangle chip for a page/line locator."""

    def __init__(self, label: str, fill=TEAL_FILL, text_color=TEAL):
        super().__init__()
        self.label = label
        self.fill = fill
        self.text_color = text_color
        self.font = "Courier-Bold"
        self.font_size = 8
        self.pad_x = 5
        self.pad_y = 2.5
        self.radius = 5
        self._text_w = 0
        self._text_h = 0

    def wrap(self, availWidth, availHeight):
        from reportlab.pdfbase.pdfmetrics import stringWidth

        self._text_w = stringWidth(self.label, self.font, self.font_size)
        self._text_h = self.font_size
        self.width = self._text_w + 2 * self.pad_x
        self.height = self._text_h + 2 * self.pad_y
        return self.width, self.height

    def draw(self):
        self.canv.setFillColor(self.fill)
        self.canv.roundRect(
            0, 0, self.width, self.height, self.radius, stroke=0, fill=1
        )
        self.canv.setFillColor(self.text_color)
        self.canv.setFont(self.font, self.font_size)
        self.canv.drawString(self.pad_x, self.pad_y + 1, self.label)


class CapsuleTitleRow(Flowable):
    """Capsule chip + numbered title on one baseline row."""

    def __init__(self, page: int, line: int, title: str, index: int, max_width: float):
        super().__init__()
        self.capsule = CitationCapsule(format_capsule(page, line))
        self.title = f"{index}. {title}"
        self.max_width = max_width
        self.gap = 8
        self.title_font = "Helvetica-Bold"
        self.title_size = 11
        self._lines: list[str] = []
        self._title_x = 0

    def wrap(self, availWidth, availHeight):
        from reportlab.pdfbase.pdfmetrics import stringWidth

        width = min(self.max_width, availWidth)
        cw, ch = self.capsule.wrap(width, availHeight)
        self._title_x = cw + self.gap
        title_width = max(40, width - self._title_x)

        words = self.title.split()
        lines: list[str] = []
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            if stringWidth(trial, self.title_font, self.title_size) <= title_width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        self._lines = lines or [self.title]

        line_h = self.title_size + 3
        title_h = max(ch, len(self._lines) * line_h)
        self.width = width
        self.height = title_h
        self._line_h = line_h
        self._ch = ch
        return self.width, self.height

    def draw(self):
        # Align capsule to top of first title line
        capsule_y = self.height - self._ch
        self.capsule.drawOn(self.canv, 0, capsule_y)
        self.canv.setFillColor(TEXT)
        self.canv.setFont(self.title_font, self.title_size)
        y = self.height - self.title_size
        for line in self._lines:
            self.canv.drawString(self._title_x, y, line)
            y -= self._line_h


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "site": ParagraphStyle(
            "site",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=TEAL,
            spaceAfter=4,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=TEXT,
            spaceAfter=2,
            leading=14,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=TEXT,
            spaceAfter=10,
            leading=15,
            alignment=TA_LEFT,
        ),
        "note": ParagraphStyle(
            "note",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=TEAL,
            spaceAfter=12,
            leading=13,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=14,
            textColor=TEXT,
            spaceBefore=6,
            spaceAfter=12,
        ),
        "labeled": ParagraphStyle(
            "labeled",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            textColor=TEXT,
            spaceAfter=6,
            leading=14,
        ),
        "closing": ParagraphStyle(
            "closing",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=TEXT,
            spaceAfter=8,
            leading=15,
        ),
    }
    return styles


def labeled_paragraph(label: str, text: str, styles, *, italic=False) -> Paragraph:
    body = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    emphasis = "i" if italic else "span"
    return Paragraph(
        f'<font color="#0F766E"><b>{label}:</b></font> '
        f"<{emphasis}>{body}</{emphasis}>",
        styles["labeled"],
    )


def build_pdf(comments: list[dict], path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="SAMPA comment — ASAM Correctional Settings & Community Reentry Standards",
        author="Society of Addiction Medicine Physician Associates (SAMPA)",
    )
    content_width = letter[0] - doc.leftMargin - doc.rightMargin
    story = []

    story.append(Paragraph("www.addictionpas.org", styles["site"]))
    story.append(Paragraph("August 31, 2026", styles["meta"]))
    story.append(Paragraph("Submitted via ASAM public-comment survey", styles["meta"]))
    story.append(Spacer(1, 10))

    for line in (
        "American Society of Addiction Medicine (ASAM)",
        "Editorial Team — The ASAM Criteria, Volume 3",
        "Correctional Settings &amp; Community Reentry Standards",
        "Public comment survey",
    ):
        story.append(Paragraph(line, styles["meta"]))
    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "<b>RE: Public comment on Correctional Settings &amp; Community Reentry "
            "Standards (The ASAM Criteria, Volume 3)</b>",
            styles["body"],
        )
    )
    story.append(Paragraph("Dear ASAM Editorial Team:", styles["body"]))
    story.append(
        Paragraph(
            "On behalf of the Society of Addiction Medicine Physician Associates (SAMPA), "
            "thank you for the opportunity to comment on the draft Correctional Settings "
            "&amp; Community Reentry Standards. SAMPA is the national professional "
            "organization representing physician associates/physician assistants (PAs) who "
            "practice in addiction medicine. Our members deliver evidence-based care for "
            "substance use disorders across hospitals, primary care, specialty clinics, "
            "and carceral and reentry settings.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "The central message of these comments is an access and continuity message: "
            "standards should keep verified medications for opioid use disorder (MOUD) "
            "moving at intake, transfer, and release; use practitioner-neutral language "
            "for prescribers and telehealth; close methadone carve-outs that become "
            "permanent exemptions; distinguish jail/prison health-system medical "
            "directors (state law) from OTP medical directors (physician under 42 CFR "
            "§8.2); and treat peer/recovery support as complementary to MOUD—not a "
            "substitute or contingency. Language that quietly physician-gates care is "
            "operationally unworkable in APP-staffed jails and raises post-release "
            "overdose risk.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "Citations use a single page and line from the official ASAM PDF, shown as "
            "small rounded capsules in the form [P63 L24].",
            styles["note"],
        )
    )
    story.append(Paragraph("Submitted comments", styles["h2"]))

    for i, item in enumerate(comments, start=1):
        block = [
            CapsuleTitleRow(
                item["page"], item["line"], item["title"], i, content_width
            ),
            Spacer(1, 6),
            labeled_paragraph("Guideline", item["guideline"], styles, italic=True),
            labeled_paragraph("Comment", item["comment"], styles),
        ]
        if item.get("revision"):
            block.append(
                labeled_paragraph("Suggested revision", item["revision"], styles)
            )
        block.append(Spacer(1, 10))
        story.append(KeepTogether(block))

    story.append(
        Paragraph(
            "Questions about this submission may be directed to the SAMPA Public Health "
            "Policy Committee at policy@addictionpas.org. SAMPA’s broader access "
            "priorities are published at https://www.addictionpas.org/policy.",
            styles["closing"],
        )
    )
    story.append(Paragraph("Respectfully submitted,", styles["closing"]))
    story.append(
        Paragraph(
            "<b>Society of Addiction Medicine Physician Associates (SAMPA)</b>",
            styles["closing"],
        )
    )

    doc.build(story)


def main():
    comments = json.loads(COMMENTS_JSON.read_text())
    assert len(comments) == 17, len(comments)
    build_pdf(comments, OUT_PDF)
    print(f"Wrote {OUT_PDF}")


if __name__ == "__main__":
    main()
