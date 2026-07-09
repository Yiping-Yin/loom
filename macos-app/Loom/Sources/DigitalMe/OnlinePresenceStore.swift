import Foundation

/// The professional self's ONLINE presence (owner trio 2026-07-10): the places
/// that supplement the LOOM wiki — LinkedIn, GitHub, Instagram, Outlook… The
/// honest v1 is owner-registered links: local, yours, one click away. (Actual
/// content ingestion from those platforms is a later, API-gated project; a
/// link never lies about what it is.)
struct OnlineProfile: Identifiable, Codable, Equatable {
    let id: String
    var label: String
    var url: URL
}

enum OnlinePresenceStore {
    static let defaultsKey = "loom.digitalme.presence.v1"

    static func load(defaults: UserDefaults = .standard) -> [OnlineProfile] {
        guard let data = defaults.data(forKey: defaultsKey) else { return [] }
        return (try? JSONDecoder().decode([OnlineProfile].self, from: data)) ?? []
    }

    /// Register a link. Only real web URLs qualify (http/https); a bare
    /// "linkedin.com/in/…" gets https:// assumed. Invalid input is a no-op —
    /// the view surfaces the validation, the store just refuses quietly.
    static func add(label: String, urlString: String, defaults: UserDefaults = .standard) {
        let trimmedLabel = label.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = normalizedWebURL(from: urlString), !trimmedLabel.isEmpty else { return }
        var profiles = load(defaults: defaults)
        profiles.append(OnlineProfile(id: UUID().uuidString, label: trimmedLabel, url: url))
        save(profiles, defaults: defaults)
    }

    static func remove(id: String, defaults: UserDefaults = .standard) {
        save(load(defaults: defaults).filter { $0.id != id }, defaults: defaults)
    }

    /// http(s)-only normalization: schemeless input assumes https; anything
    /// that isn't a web URL (file:, javascript:, garbage) is rejected.
    static func normalizedWebURL(from raw: String) -> URL? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !trimmed.contains(" ") else { return nil }
        if let url = URL(string: trimmed), let scheme = url.scheme?.lowercased() {
            return (scheme == "http" || scheme == "https") ? url : nil
        }
        guard trimmed.contains(".") else { return nil }
        return URL(string: "https://\(trimmed)")
    }

    private static func save(_ profiles: [OnlineProfile], defaults: UserDefaults) {
        if let data = try? JSONEncoder().encode(profiles) {
            defaults.set(data, forKey: defaultsKey)
        }
    }
}
