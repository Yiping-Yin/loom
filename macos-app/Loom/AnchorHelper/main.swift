import Foundation
import os

let helperLog = Logger(subsystem: "com.yinyiping.loom.AnchorHelper", category: "service")

final class AnchorHelperDelegate: NSObject, NSXPCListenerDelegate {
    func listener(_ listener: NSXPCListener, shouldAcceptNewConnection newConnection: NSXPCConnection) -> Bool {
        helperLog.info("anchor-helper service: accepting connection")
        newConnection.exportedInterface = NSXPCInterface(with: LoomAnchorHelperProtocol.self)
        newConnection.exportedObject = AnchorResolver()
        newConnection.resume()
        return true
    }
}

helperLog.info("anchor-helper service: started")
let delegate = AnchorHelperDelegate()
let listener = NSXPCListener.service()
listener.delegate = delegate
listener.resume()
