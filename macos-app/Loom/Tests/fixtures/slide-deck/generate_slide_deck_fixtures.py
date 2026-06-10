#!/usr/bin/env python3
"""Deterministic PPTX / iWork fixture generator for SlideDeckExtractorTests.

Produces these fixtures in the enclosing directory:

  PPTX (OOXML):
  - minimal.pptx                 — 2 slides with predictable text + 1 notes slide
  - numeric-ordering.pptx        — slide2.xml + slide10.xml (out-of-order in
                                   lexical sort) to exercise numeric slide order
  - malformed-slide.pptx         — slide1.xml valid, slide2.xml corrupt; valid
                                   slide text must still be returned
  - alt-text.pptx                — ALT_TEXT_SLIDE: a picture + a callout shape
                                   carrying `p:cNvPr` title/descr accessibility
                                   alt text that the parser folds into the body

  iWork (Keynote .key / Pages .pages packages — zip with Index/*.iwa +
  Metadata/*.plist, optional Data/QuickLook/Preview.pdf):
  - metadata.key / metadata.pages              — document Properties.plist only
  - body.key / body.pages                      — IWA inline body text runs
                                                 (UTF-8 + UTF-16LE)
  - body-duplicate-marker.key / .pages         — standalone `Slide 1` / `Page 1`
                                                 markers preceding labeled titles,
                                                 to exercise marker 去重 (dedupe)
  - preview-nested.pages                        — nested Data/QuickLook/Preview.pdf
                                                 carrying "Nested QuickLook preview
                                                 evidence"

The PPTX files are standards-compliant enough OOXML zips that ZIPFoundation can
read the entries and XMLParser can pull `<a:t>` text runs (and `p:cNvPr` alt
text). They are NOT fully valid PowerPoint documents — the SlideDeckExtractor
opens them only as a zip with slide XML inside.

The iWork files are minimal packages: the `.iwa` "body" is NOT a real Snappy
protobuf, just embedded UTF-8 and UTF-16LE string runs that the extractor sweeps
for. The Chinese page markers (e.g. `第 3 页：机制设计例子` and
`第 3 页：先理解再自测`) use the full-width colon and survive dedupe because they
are labeled titles, not bare markers.

NOTE: these fixtures already exist on disk; re-running this generator is only
needed when the fixture corpus changes. The binary `.iwa` layout below documents
exactly what is on disk.

Run once from repo root:
    python3 macos-app/Loom/Tests/fixtures/slide-deck/generate_slide_deck_fixtures.py
"""

import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Document Properties.plist template for iWork packages. The extractor reads
# title / author / subject / comment / keywords out of `Metadata/*.plist`.
IWORK_PROPERTIES_PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>title</key>
  <string>{title}</string>
  <key>author</key>
  <string>{author}</string>
  <key>subject</key>
  <string>{subject}</string>
  <key>comment</key>
  <string>{comment}</string>
  <key>keywords</key>
  <array>
    <string>{kw1}</string>
    <string>{kw2}</string>
  </array>
</dict>
</plist>
"""

# Slide carrying `p:cNvPr` accessibility alt text on a picture and a callout
# shape. The parser must fold the title/descr values into the slide body.
ALT_TEXT_SLIDE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Slide with visual evidence</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="4" name="Picture 1"
                   title="Revenue chart"
                   descr="Line chart showing revenue increasing from Q1 to Q4"/>
        </p:nvPicPr>
      </p:pic>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="5" name="Callout 1"
                   descr="Warning callout: churn risk remains elevated"/>
        </p:nvSpPr>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>
"""

SLIDE_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:t>{title}</a:t></a:r></a:p>
          <a:p><a:r><a:t>{body}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>
"""

NOTES_TEMPLATE = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
         xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>{note}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:notes>
"""

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
</Types>
"""


def write_pptx(path: Path, entries: dict[str, str]) -> None:
    """Write deterministic zip: sorted entries, epoch timestamp."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    # `ZIP_DEFLATED` matches what PowerPoint uses; ZIPFoundation reads both.
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in sorted(entries):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, entries[name])


def build_minimal() -> None:
    slides = {
        "[Content_Types].xml": CONTENT_TYPES,
        "ppt/slides/slide1.xml": SLIDE_TEMPLATE.format(
            title="Slide 1 title", body="Slide 1 body"
        ),
        "ppt/slides/slide2.xml": SLIDE_TEMPLATE.format(
            title="Slide 2 title", body="Slide 2 body"
        ),
        "ppt/notesSlides/notesSlide1.xml": NOTES_TEMPLATE.format(
            note="Speaker note for slide 1"
        ),
    }
    write_pptx(HERE / "minimal.pptx", slides)


def build_numeric_ordering() -> None:
    """slide2.xml + slide10.xml — lexical sort would put slide10 first."""
    slides = {
        "[Content_Types].xml": CONTENT_TYPES,
        "ppt/slides/slide2.xml": SLIDE_TEMPLATE.format(
            title="Early slide", body="Appears at position two"
        ),
        "ppt/slides/slide10.xml": SLIDE_TEMPLATE.format(
            title="Late slide", body="Appears at position ten"
        ),
    }
    write_pptx(HERE / "numeric-ordering.pptx", slides)


def build_malformed_slide() -> None:
    """slide1 valid, slide2 unparseable XML. Good slide text must still return."""
    slides = {
        "[Content_Types].xml": CONTENT_TYPES,
        "ppt/slides/slide1.xml": SLIDE_TEMPLATE.format(
            title="Good slide title", body="Good slide body"
        ),
        # Intentionally broken XML: unclosed tag, missing body.
        "ppt/slides/slide2.xml": "<?xml version=\"1.0\"?><p:sld><broken<<<",
    }
    write_pptx(HERE / "malformed-slide.pptx", slides)


def build_alt_text() -> None:
    """alt-text.pptx — picture + callout shape with cNvPr title/descr."""
    slides = {
        "[Content_Types].xml": CONTENT_TYPES,
        "ppt/slides/slide1.xml": ALT_TEXT_SLIDE,
    }
    write_pptx(HERE / "alt-text.pptx", slides)


# MARK: - iWork (.key / .pages) builders
#
# The `.iwa` body is a hand-built byte string of UTF-8 runs and UTF-16LE runs
# separated by sentinel marker bytes, bracketed by an `IWA`/`END` frame. The
# extractor sweeps these out regardless of the (fake) framing.

IWA_HEADER = b"\x00IWA\x01\x02\x00\x7f\x00\x03"
IWA_RUN_SEP = b"\x00\x00\x04\x00\x03"
IWA_FOOTER = b"\x00\x00\x04\xff\x00END"


def _iwa_run(text: str, *, utf16: bool) -> bytes:
    return text.encode("utf-16-le") if utf16 else text.encode("utf-8")


def build_iwa(runs: list[tuple[str, bool]]) -> bytes:
    """runs = [(text, is_utf16), …]. First run rides the header frame."""
    out = bytearray(IWA_HEADER)
    for i, (text, utf16) in enumerate(runs):
        if i > 0:
            out += IWA_RUN_SEP
        out += _iwa_run(text, utf16=utf16)
    out += IWA_FOOTER
    return bytes(out)


PREVIEW_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]"
    b" /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n"
    b"4 0 obj\n<< /Length 65 >>\nstream\n"
    b"/F1 18 Tf\n72 720 Td\n(Nested QuickLook preview evidence) Tj\n"
    b"endstream\nendobj\n"
    b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    b"trailer\n<< /Size 6 /Root 1 0 R >>\n%%EOF\n"
)


def write_iwork(path: Path, entries: dict[str, bytes]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in sorted(entries):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, entries[name])


def build_iwork_metadata() -> None:
    """metadata.key / metadata.pages — Properties.plist only, no body."""
    write_iwork(HERE / "metadata.key", {
        "Index/Document.iwa": b"binary body omitted",
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Keynote deck about market design",
            author="Avery Scholar",
            subject="Auction theory lecture",
            comment="Includes diagrams for matching markets",
            kw1="market design", kw2="stable matching",
        ).encode("utf-8"),
    })
    write_iwork(HERE / "metadata.pages", {
        "Index/Document.iwa": b"binary body omitted",
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Pages brief about market design",
            author="Mina Writer",
            subject="Research brief",
            comment="Includes notes for matching markets",
            kw1="market design", kw2="research",
        ).encode("utf-8"),
    })


def build_iwork_body() -> None:
    """body.key / body.pages — IWA inline body text runs (UTF-8 + UTF-16LE)."""
    key_iwa = build_iwa([
        ("Slide 1: Market design overview", False),
        ("Matching markets allocate scarce seats", True),
        ("Slide 2: Deferred acceptance algorithm", False),
        ("Stability stops blocking pairs", True),
    ])
    write_iwork(HERE / "body.key", {
        "Index/Document.iwa": key_iwa,
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Keynote body reconstruction fixture",
            author="Avery Scholar",
            subject="Auction theory lecture",
            comment="Contains recoverable body text in IWA",
            kw1="iwa body", kw2="keynote",
        ).encode("utf-8"),
    })
    pages_iwa = build_iwa([
        ("Page 1: Learning loop overview", False),
        ("Understanding before self-test", True),
        ("Page 2: Source organization notes", False),
        ("Reader notes stay attached to sources", True),
    ])
    write_iwork(HERE / "body.pages", {
        "Index/Document.iwa": pages_iwa,
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Pages body reconstruction fixture",
            author="Mina Writer",
            subject="Research brief",
            comment="Contains recoverable body text in IWA",
            kw1="iwa body", kw2="pages",
        ).encode("utf-8"),
    })


def build_iwork_duplicate_marker() -> None:
    """body-duplicate-marker.key / .pages — bare markers before labeled titles.

    Also covers Chinese full-width-colon markers like `第 3 页：机制设计例子`
    and `第 3 页：先理解再自测`, which are labeled titles (kept), not bare
    markers (deduped).
    """
    key_iwa = build_iwa([
        ("Slide 1", False),
        ("Slide 1: Market design overview", True),
        ("Matching markets allocate scarce seats", False),
        ("Slide 2", True),
        ("Slide 2: Deferred acceptance algorithm", False),
        ("Stability stops blocking pairs", True),
    ])
    write_iwork(HERE / "body-duplicate-marker.key", {
        "Index/Document.iwa": key_iwa,
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Keynote duplicate marker fixture",
            author="Avery Scholar",
            subject="Auction theory lecture",
            comment="Contains duplicate slide markers before labeled titles",
            kw1="iwa duplicate marker", kw2="keynote",
        ).encode("utf-8"),
    })
    pages_iwa = build_iwa([
        ("Page 1", False),
        ("Page 1: Learning loop overview", True),
        ("Understanding before self-test", False),
        ("Page 2", True),
        ("Page 2: Source organization notes", False),
        ("Reader notes stay attached to sources", True),
    ])
    write_iwork(HERE / "body-duplicate-marker.pages", {
        "Index/Document.iwa": pages_iwa,
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Pages duplicate marker fixture",
            author="Mina Writer",
            subject="Research brief",
            comment="Contains duplicate page markers before labeled titles",
            kw1="iwa duplicate marker", kw2="pages",
        ).encode("utf-8"),
    })


def build_iwork_preview_nested() -> None:
    """preview-nested.pages — nested Data/QuickLook/Preview.pdf with evidence."""
    write_iwork(HERE / "preview-nested.pages", {
        "Data/QuickLook/Preview.pdf": PREVIEW_PDF,
        "Metadata/Properties.plist": IWORK_PROPERTIES_PLIST.format(
            title="Pages nested QuickLook fixture",
            author="Mina Writer",
            subject="Research brief",
            comment="Contains a nested QuickLook preview PDF",
            kw1="quicklook", kw2="pages",
        ).encode("utf-8"),
    })


if __name__ == "__main__":
    build_minimal()
    build_numeric_ordering()
    build_malformed_slide()
    build_alt_text()
    build_iwork_metadata()
    build_iwork_body()
    build_iwork_duplicate_marker()
    build_iwork_preview_nested()
    for name in (
        "minimal.pptx", "numeric-ordering.pptx", "malformed-slide.pptx",
        "alt-text.pptx",
        "metadata.key", "metadata.pages", "body.key", "body.pages",
        "body-duplicate-marker.key", "body-duplicate-marker.pages",
        "preview-nested.pages",
    ):
        fp = HERE / name
        if fp.exists():
            print(f"  wrote {fp} ({fp.stat().st_size} bytes)")
