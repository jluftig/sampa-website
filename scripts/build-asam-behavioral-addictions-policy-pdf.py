#!/usr/bin/env python3
"""Build the public ASAM behavioral-addictions comment PDF for /policy.

Same ReportLab capsule layout as scripts/build-asam-correctional-policy-pdf.py.
Page 0 / line 0 comments use a General chip. Every row also prints its page and line.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image as RLImage,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
COMMENTS_JSON = ROOT / "src/data/asam-behavioral-addictions-line-comments-2026.json"
OUT_PDF = ROOT / "public/files/policy/asam-behavioral-addictions-framework-2026.pdf"
LOGO_PATH = ROOT / "public/email/sampa-logo-v3.png"
CORRECTIONAL_SCRIPT = ROOT / "scripts/build-asam-correctional-policy-pdf.py"

TITLE = (
    "Response to ASAM’s Framework for the Behavioral Addictions Volume "
    "(The ASAM Criteria, Fourth Edition, Volume 4)"
)
INTRO = (
    "SAMPA submitted these comments through ASAM’s line-by-line public-comment "
    "survey on the draft Framework for the Behavioral Addictions Volume of "
    "The ASAM Criteria, Fourth Edition (Volume 4). The comments were entered "
    "on November 20, 2026, the close of ASAM’s public comment period."
)


def load_correctional():
    spec = importlib.util.spec_from_file_location(
        "asam_correctional_policy_pdf", CORRECTIONAL_SCRIPT
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def capsule_label(page: int, line: int, correctional) -> str:
    if page == 0 and line == 0:
        return "General"
    return correctional.format_capsule(page, line)


def build_pdf(comments: list[dict], path: Path, correctional) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    styles = correctional.build_styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=TITLE,
        author="Society of Addiction Medicine Physician Associates (SAMPA)",
    )
    content_width = letter[0] - doc.leftMargin - doc.rightMargin
    story = []

    if LOGO_PATH.exists():
        logo_w = 2.05 * inch
        logo_h = logo_w * (171 / 560)
        logo = RLImage(str(LOGO_PATH), width=logo_w, height=logo_h)
        logo.hAlign = "LEFT"
        story.append(logo)
        story.append(Spacer(1, 8))

    story.append(Paragraph("www.addictionpas.org", styles["site"]))
    story.append(
        Paragraph(
            "Submitted by the Society of Addiction Medicine Physician Associates "
            "(SAMPA) Public Health Policy Committee",
            styles["meta"],
        )
    )
    story.append(Paragraph("Submitted November 20, 2026", styles["meta"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>{TITLE}</b>", styles["body"]))
    story.append(Paragraph(INTRO, styles["body"]))
    story.append(Paragraph("Submitted comments", styles["h2"]))

    for index, item in enumerate(comments, start=1):
        page = int(item["page"])
        line = int(item["line"])
        block = [
            correctional.CapsuleTitleRow(
                page,
                line,
                item["title"],
                index,
                content_width,
                label=capsule_label(page, line, correctional),
            ),
            Spacer(1, 6),
            correctional.labeled_paragraph(
                "Page",
                str(page),
                styles,
            ),
            correctional.labeled_paragraph(
                "Line",
                str(line),
                styles,
            ),
            correctional.labeled_paragraph("Comment", item["comment"], styles),
        ]
        if item.get("revision"):
            block.append(
                correctional.labeled_paragraph(
                    "Suggested revision", item["revision"], styles
                )
            )
        block.append(Spacer(1, 10))
        story.append(KeepTogether(block))

    story.append(
        Paragraph(
            "Questions about this submission may be directed to the SAMPA Public "
            "Health Policy Committee at policy@addictionpas.org.",
            styles["closing"],
        )
    )
    story.append(
        Paragraph(
            "<b>Society of Addiction Medicine Physician Associates (SAMPA)</b>",
            styles["closing"],
        )
    )
    doc.build(story)


def main() -> None:
    comments = json.loads(COMMENTS_JSON.read_text())
    assert len(comments) == 32, len(comments)
    build_pdf(comments, OUT_PDF, load_correctional())
    print(f"Wrote {OUT_PDF}")


if __name__ == "__main__":
    main()
