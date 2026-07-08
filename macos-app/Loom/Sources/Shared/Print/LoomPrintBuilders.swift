import AppKit
import PDFKit

/// NSPrintOperation builders — charter §22: ⌘P prints the note or the open
/// PDF like every native document app. Built as pure builders in W0-11; the
/// File▸Print menu wiring lands in Wave 1 (menu commands live in the
/// in-flight shell file).
enum LoomPrintBuilders {
    /// A print operation for a note: standard paper margins, the note's
    /// attributed content laid out by the system text stack.
    static func printOperation(noteTitle: String, body: NSAttributedString) -> NSPrintOperation {
        let printInfo = NSPrintInfo.shared.copy() as! NSPrintInfo
        printInfo.horizontalPagination = .fit
        printInfo.verticalPagination = .automatic
        printInfo.topMargin = 54
        printInfo.bottomMargin = 54
        printInfo.leftMargin = 54
        printInfo.rightMargin = 54

        let pageWidth = printInfo.paperSize.width - printInfo.leftMargin - printInfo.rightMargin
        let textView = NSTextView(frame: NSRect(x: 0, y: 0, width: pageWidth, height: 0))
        textView.textStorage?.setAttributedString(body)
        // Size via boundingRect — never touch .layoutManager (charter §7:
        // reading it downgrades the view to TextKit 1).
        let measured = body.boundingRect(
            with: NSSize(width: pageWidth, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading]
        )
        textView.frame.size.height = max(ceil(measured.height) + 8, 1)

        let operation = NSPrintOperation(view: textView, printInfo: printInfo)
        operation.jobTitle = noteTitle.isEmpty ? "Loom note" : noteTitle
        operation.showsPrintPanel = true
        operation.showsProgressPanel = true
        return operation
    }

    /// A print operation for the PDF open in the reader — PDFKit's own
    /// printOperation keeps page fidelity (no re-rendering).
    static func printOperation(pdf: PDFDocument, jobTitle: String) -> NSPrintOperation? {
        let printInfo = NSPrintInfo.shared.copy() as! NSPrintInfo
        let operation = pdf.printOperation(for: printInfo, scalingMode: .pageScaleDownToFit, autoRotate: true)
        operation?.jobTitle = jobTitle.isEmpty ? "Loom source" : jobTitle
        operation?.showsPrintPanel = true
        return operation
    }
}
