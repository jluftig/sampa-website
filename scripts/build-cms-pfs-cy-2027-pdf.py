#!/usr/bin/env python3
"""Build public CMS CY 2027 PFS comment PDF for /policy.

Branded SAMPA letterhead (logo + site URL), readable multi-page letter.
Regenerated from the filed letter text — the uploaded FINAL docx is not a
valid zip (LibreOffice conversion unavailable).
"""

from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image as RLImage,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_PDF = ROOT / "public/files/policy/cms-pfs-cy-2027-1848-p.pdf"
LOGO_PATH = ROOT / "public/email/sampa-logo-v3.png"

TEAL = HexColor("#0F766E")
TEXT = HexColor("#1F2937")
MUTED = HexColor("#4B5563")

DEJAVU = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("DejaVu", str(DEJAVU / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(DEJAVU / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily(
    "DejaVu",
    normal="DejaVu",
    bold="DejaVu-Bold",
    italic="DejaVu",
    boldItalic="DejaVu-Bold",
)


def build_styles():
    base = getSampleStyleSheet()
    return {
        "site": ParagraphStyle(
            "site",
            parent=base["Normal"],
            fontName="DejaVu-Bold",
            fontSize=10,
            textColor=TEAL,
            alignment=TA_LEFT,
            spaceAfter=2,
        ),
        "org": ParagraphStyle(
            "org",
            parent=base["Normal"],
            fontName="DejaVu",
            fontSize=8.5,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=10,
            leading=11,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["Normal"],
            fontName="DejaVu",
            fontSize=11,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceAfter=2,
            leading=14,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="DejaVu",
            fontSize=10.5,
            textColor=TEXT,
            spaceAfter=9,
            leading=14.5,
            alignment=TA_JUSTIFY,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Normal"],
            fontName="DejaVu-Bold",
            fontSize=11.5,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceBefore=8,
            spaceAfter=8,
            leading=15,
        ),
        "labeled": ParagraphStyle(
            "labeled",
            parent=base["Normal"],
            fontName="DejaVu",
            fontSize=10,
            textColor=TEXT,
            spaceAfter=7,
            leading=13.5,
            alignment=TA_JUSTIFY,
        ),
        "closing": ParagraphStyle(
            "closing",
            parent=base["Normal"],
            fontName="DejaVu",
            fontSize=10.5,
            textColor=TEXT,
            alignment=TA_LEFT,
            spaceAfter=8,
            leading=14.5,
        ),
    }


def P(text: str, style) -> Paragraph:
    return Paragraph(text, style)


def labeled(label: str, text: str, styles, *, quote=False) -> Paragraph:
    body = escape(text)
    body_html = (
        f'<font color="#4B5563">{body}</font>' if quote else body
    )
    return Paragraph(
        f'<font color="#0F766E"><b>{escape(label)}:</b></font> {body_html}',
        styles["labeled"],
    )


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(MUTED)
    canvas.setFont("DejaVu", 8)
    canvas.drawString(
        0.85 * inch,
        0.45 * inch,
        "SAMPA · CMS-1848-P · CY 2027 Medicare Physician Fee Schedule",
    )
    canvas.drawRightString(letter[0] - 0.85 * inch, 0.45 * inch, str(doc.page))
    canvas.restoreState()


def build_pdf(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.85 * inch,
        title="SAMPA comment — CY 2027 Medicare Physician Fee Schedule (CMS-1848-P)",
        author="Society of Addiction Medicine Physician Associates (SAMPA)",
        subject="CMS-1848-P · Docket CMS-2026-2377 · Tracking mu1-xtr9-b3nv",
    )
    story = []

    logo_w = 2.05 * inch
    logo_h = logo_w * (171 / 560)
    logo = RLImage(str(LOGO_PATH), width=logo_w, height=logo_h)
    logo.hAlign = "LEFT"
    story.append(logo)
    story.append(Spacer(1, 8))
    story.append(P("www.addictionpas.org", styles["site"]))
    story.append(
        P(
            "Official Constituent Organization of the American Academy of Physician Associates (AAPA)",
            styles["org"],
        )
    )

    story.append(P("September 14, 2026", styles["meta"]))
    story.append(
        P("Submitted electronically via www.regulations.gov", styles["meta"])
    )
    story.append(Spacer(1, 10))

    for line in (
        "Administrator",
        "Centers for Medicare &amp; Medicaid Services",
        "U.S. Department of Health and Human Services",
        "Attention: CMS-1848-P",
        "P.O. Box 8016",
        "Baltimore, MD 21244-8016",
    ):
        story.append(P(line, styles["meta"]))
    story.append(Spacer(1, 8))

    story.append(
        P(
            "<b>RE: CMS-1848-P — CY 2027 Medicare Physician Fee Schedule Proposed Rule; "
            "Docket CMS-2026-2377</b>",
            styles["body"],
        )
    )
    story.append(P("Dear Administrator:", styles["body"]))
    story.append(
        P(
            "The Society of Addiction Medicine Physician Associates (SAMPA) appreciates "
            "the opportunity to comment on the Calendar Year (CY) 2027 Medicare Physician "
            "Fee Schedule (PFS) proposed rule (CMS-1848-P). SAMPA is an official "
            "Constituent Organization of the American Academy of Physician Associates "
            "(AAPA). SAMPA represents physician associates/physician assistants (PAs) who "
            "provide evidence-based prevention, treatment, and recovery services for "
            "individuals with substance use disorders (SUD) in every state and practice "
            "setting, including rural, office-based, emergency, and telehealth settings.",
            styles["body"],
        )
    )
    story.append(
        P(
            "SAMPA’s comments are limited to addiction-care payment and PA practice. We "
            "recognize that CMS cannot restore the temporary statutory conversion-factor "
            "increase that expires after CY 2026; we do not ask CMS to reverse that "
            "statutory change. We ask CMS to finalize the addiction-care payment "
            "improvements already in this rule, and to modify a small number of proposals "
            "that would otherwise shrink access to SUD care furnished by physicians and "
            "qualified nonphysician practitioners, including PAs.",
            styles["body"],
        )
    )
    story.append(
        P(
            "Where we ask CMS to modify or oppose proposed text, we quote the language as "
            "proposed and then supply the exact replacement language we want in the final rule.",
            styles["body"],
        )
    )

    # --- 1. SBIRT ---
    story.append(
        P(
            "1. SBIRT and tobacco-cessation work RVUs — SUPPORT (finalize as proposed)",
            styles["h2"],
        )
    )
    story.append(
        labeled(
            "As proposed",
            "In the CY 2024 PFS final rule, we finalized an increase in the valuation "
            "for timed behavioral health services by applying an upward adjustment to "
            "the work RVUs for psychotherapy codes payable under the PFS. This increase "
            "is being implemented over a four-year transition period. We believe similar "
            "adjustments are warranted for smoking and tobacco use cessation and "
            "screening, brief intervention, and referral to treatment (SBIRT) services. "
            "Therefore, for CY 2027, we are proposing to include smoking and tobacco "
            "use cessation services and SBIRT services in this final year of the "
            "transition for timed behavioral health codes.",
            styles,
            quote=True,
        )
    )
    story.append(
        labeled(
            "Comment",
            "SAMPA strongly supports this proposal. SBIRT and tobacco-cessation "
            "counseling are core tools for identifying unhealthy substance use and "
            "engaging patients in care. Physicians and qualified nonphysician "
            "practitioners, including PAs, furnish these services in primary care, "
            "emergency, hospital, and addiction settings. Underpayment has long "
            "discouraged routine screening. A one-year catch-up in the final "
            "transition year is the right policy.",
            styles,
        )
    )
    story.append(
        labeled(
            "Suggested revision",
            "None. Finalize the proposed inclusion of smoking and tobacco use "
            "cessation services (CPT 99406, 99407) and SBIRT services (HCPCS G2011, "
            "G0396, G0397) in the final year of the timed behavioral health work RVU "
            "transition for CY 2027, as proposed.",
            styles,
        )
    )
    story.append(
        labeled(
            "Future rulemaking (not in this NPRM)",
            "In a future PFS proposed rule, apply the same work RVU adjustment to "
            "annual alcohol misuse screening and brief counseling codes G0442 and "
            "G0443 so the screening family is valued consistently.",
            styles,
        )
    )

    # --- 2. SMA ---
    story.append(
        P(
            "2. Shared medical appointments (HCPCS GSMAS) — SUPPORT the code and "
            "qualified nonphysician practitioner leadership; MODIFY the eligible-condition list",
            styles["h2"],
        )
    )
    story.append(
        labeled(
            "As proposed (code descriptor)",
            "HCPCS code GSMAS: Voluntary, group-based medical session involving multiple "
            "patients with common medical condition(s), receiving medical care in a group "
            "setting; billed and led by a physician or qualified nonphysician practitioner "
            "and may include services provided by other qualified healthcare professionals, "
            "clinical staff, or auxiliary personnel under the direction of the supervising "
            "physician or other practitioner. Session integrates group education, counseling, "
            "and peer support with individualized patient clinical assessment and care, 2-10 "
            "patients, billed once per patient, per session.",
            styles,
            quote=True,
        )
    )
    story.append(
        labeled(
            "As proposed (leadership)",
            "The sessions are generally led by a physician, physician assistant (PA), or an "
            "advanced practice registered nurse (APRN)… We propose that a SMA session is "
            "billed and led by a physician or qualified nonphysician practitioner…",
            styles,
            quote=True,
        )
    )
    story.append(
        labeled(
            "As proposed (eligible conditions)",
            "SMAs are an appropriate healthcare delivery approach for conditions that are "
            "modifiable with lifestyle change, including diabetes mellitus, obesity, "
            "hypertension, and hyperlipidemia, such that behavioral changes including diet, "
            "physical activity, and self-management can influence health outcomes. Therefore, "
            "we propose to establish coding and payment for SMAs provided for medical "
            "conditions that are modifiable with lifestyle change.",
            styles,
            quote=True,
        )
    )
    story.append(
        labeled(
            "Comment",
            "SAMPA supports creation of GSMAS and strongly supports the physician or "
            "qualified nonphysician practitioner leadership language as written. Tobacco use "
            "disorder, alcohol use disorder, and other SUDs are chronic diseases likewise "
            "modifiable with lifestyle change, peer support, and self-management. The "
            "proposed examples are cardiometabolic. Unless tobacco use disorder, alcohol use "
            "disorder, and other substance use disorders are expressly included, SUD-focused "
            "SMAs will not clearly qualify.",
            styles,
        )
    )
    story.append(
        labeled(
            "Suggested revision (eligible conditions)",
            "SMAs are an appropriate healthcare delivery approach for conditions that are "
            "modifiable with lifestyle change, including diabetes mellitus, obesity, "
            "hypertension, hyperlipidemia, tobacco use disorder, alcohol use disorder, and "
            "other substance use disorders, such that behavioral changes including diet, "
            "physical activity, peer support, and self-management can influence health "
            "outcomes. We are finalizing coding and payment for SMAs provided for medical "
            "conditions that are modifiable with lifestyle change, expressly including "
            "tobacco use disorder, alcohol use disorder, and other substance use disorders.",
            styles,
        )
    )
    story.append(
        labeled(
            "Suggested revision (leadership)",
            "None. Finalize the GSMAS descriptor and leadership language as proposed "
            "(physician or qualified nonphysician practitioner; sessions generally led by a "
            "physician, PA, or APRN). Do not narrow the final rule to physician-led only.",
            styles,
        )
    )

    # --- 3. G2211 ---
    story.append(
        P(
            "3. E/M visit complexity add-on (HCPCS G2211) — SUPPORT percentage form (MOD1); "
            "MODIFY ACO-only MOD2",
            styles["h2"],
        )
    )
    story.append(
        labeled(
            "As proposed (MOD1)",
            "For CY 2027, we are proposing two changes. We are proposing to transition "
            "HCPCS code G2211 to a modifier that can be appended to the associated E/M base "
            "code (placeholder modifier MOD1 will be replaced with a two-digit HCPCS modifier "
            "if finalized). This modifier would increase the payment of the associated E/M "
            "code by 16%, instead of a flat rate, maintaining an equal percentage increase "
            "across all levels of E/M codes.",
            styles,
            quote=True,
        )
    )
    story.append(
        labeled(
            "As proposed (MOD2)",
            "This modifier (placeholder modifier MOD2) would be available only for "
            "practitioners participating in a Shared Savings Program ACO or Participant "
            "Providers in a Long-term Enhanced ACO Design (LEAD) Model ACO and would "
            "increase payment of the associated E/M visit by 32%.",
            styles,
            quote=True,
        )
    )
    story.append(
        labeled(
            "Comment",
            "SAMPA supports moving from a flat G2211 add-on to a percentage increase "
            "(MOD1). Longitudinal addiction care—induction, dose adjustment, relapse "
            "prevention, and co-occurring psychiatric and medical management—is precisely "
            "the continuous clinician relationship G2211 was designed to support. Creating "
            "a substantially larger percentage increase only for ACO / LEAD clinicians would "
            "pay independent and small-practice physicians and qualified nonphysician "
            "practitioners, including PAs, less for identical longitudinal SUD/MOUD work.",
            styles,
        )
    )
    story.append(
        labeled(
            "Suggested revision (MOD1)",
            "None. Finalize placeholder modifier MOD1 as proposed (16% of the associated E/M).",
            styles,
        )
    )
    story.append(
        labeled(
            "Suggested addition (MOD1)",
            "Ongoing office-based substance use disorder treatment or medications for "
            "opioid use disorder management qualifies as a single, serious, or complex "
            "condition for purposes of reporting the visit-complexity modifier, and the "
            "modifier may be reported by physicians and qualified nonphysician practitioners "
            "who furnish that care.",
            styles,
        )
    )
    story.append(
        labeled(
            "Suggested revision (MOD2)",
            "This modifier (placeholder modifier MOD2) would be available to physicians and "
            "qualified nonphysician practitioners who meet the visit-complexity criteria, "
            "including practitioners furnishing ongoing SUD or MOUD management, and would "
            "increase payment of the associated E/M visit by 32%. Participation in a Shared "
            "Savings Program ACO or a LEAD Model ACO is not required to report the modifier.",
            styles,
        )
    )
    story.append(
        labeled(
            "Fallback if CMS will not extend MOD2 eligibility",
            "Do not finalize ACO/LEAD-only eligibility for MOD2; apply only MOD1 (16%) to "
            "all practitioners who meet the visit-complexity criteria.",
            styles,
        )
    )

    # --- 4. Quality ID 305 ---
    story.append(
        KeepTogether(
            [
                P(
                    "4. Quality ID 305 — OPPOSE removal from the APP Plus quality measure set",
                    styles["h2"],
                ),
                labeled(
                    "As proposed",
                    "We are proposing several changes to the APP Plus quality measure set for "
                    "Shared Savings Program ACOs, including the removal of Initiation and "
                    "Engagement of Substance Use Disorder Treatment (Quality ID: 305) and "
                    "Adult Immunization Status (Quality ID: 493) from the APP Plus quality "
                    "measure set. … We are proposing that the APP Plus quality measure set for "
                    "Shared Savings Program ACOs would include eight measures … beginning with "
                    "PY 2027.",
                    styles,
                    quote=True,
                ),
                labeled(
                    "Comment",
                    "Removing Quality ID 305 eliminates a payment incentive to start and "
                    "retain people in SUD treatment and works against CMS’s behavioral-health "
                    "and chronic-disease objectives. ACO reporting burden should not be solved "
                    "by dropping the SUD initiation and engagement measure. Physicians and "
                    "qualified nonphysician practitioners, including PAs, in ACO-participating "
                    "practices initiate and engage Medicare patients in SUD treatment; removing "
                    "Quality ID 305 reduces accountability for that care.",
                    styles,
                ),
                labeled(
                    "Suggested revision",
                    "We are proposing several changes to the APP Plus quality measure set for "
                    "Shared Savings Program ACOs, including the removal of Adult Immunization "
                    "Status (Quality ID: 493) from the APP Plus quality measure set. We are "
                    "retaining Initiation and Engagement of Substance Use Disorder Treatment "
                    "(Quality ID: 305) in the APP Plus quality measure set for Shared Savings "
                    "Program ACOs beginning with PY 2027 and subsequent performance years.",
                    styles,
                ),
            ]
        )
    )

    story.append(
        P(
            "PAs have been an integral part of the healthcare landscape for nearly 60 years, "
            "supporting patients and communities in all settings, including office-based "
            "opioid treatment, Rural Health Clinics, Federally Qualified Health Centers, "
            "emergency departments, and telehealth. SAMPA stands ready to serve as a "
            "resource to CMS on workforce payment, office-based medications for opioid use "
            "disorder, screening and brief intervention, and the practical realities of "
            "delivering addiction care under the Physician Fee Schedule. We appreciate your "
            "consideration of these comments and look forward to continued engagement as "
            "this important work proceeds.",
            styles["closing"],
        )
    )
    story.append(
        P(
            "Please direct any questions regarding these comments to Natasha Seliski, "
            "PA-C, MPAS and Arianna Campbell, DMSc, MPH, PA-C, CAQ-EM, DFAAPA, co-chairs "
            "of the SAMPA Public Health Policy Committee at "
            '<link href="mailto:policy@addictionpas.org" color="#0F766E">'
            "<u>policy@addictionpas.org</u></link>.",
            styles["closing"],
        )
    )
    story.append(P("Respectfully submitted,", styles["closing"]))
    story.append(P("<b>Shani Wilson, PA-C</b>", styles["closing"]))
    story.append(P("President", styles["closing"]))
    story.append(
        P(
            "<b>Society of Addiction Medicine Physician Associates (SAMPA)</b>",
            styles["closing"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main():
    build_pdf(OUT_PDF)
    print(f"Wrote {OUT_PDF} ({OUT_PDF.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
