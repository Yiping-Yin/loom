import Foundation

final class AnchorHelperDelegate: NSObject, NSXPCListenerDelegate {
    func listener(_ listener: NSXPCListener, shouldAcceptNewConnection newConnection: NSXPCConnection) -> Bool {
        newConnection.exportedInterface = NSXPCInterface(with: LoomAnchorHelperProtocol.self)
        newConnection.exportedObject = AnchorResolver()
        newConnection.resume()
        return true
    }
}

let delegate = AnchorHelperDelegate()
let listener = NSXPCListener.service()
listener.delegate = delegate
listener.resume()
