import './globals.css';
import '../components/verified-dossier/LoomGlobalNav.module.css';
import './about/AboutClient.module.css';
import './digital-me/DigitalMeRoleOS.module.css';
import type { ReactNode } from 'react';
import { FocusLayerProvider } from '../lib/focus-layer';
import { CopyButtonInjector } from '../components/CopyButton';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';
import { LinkPreview } from '../components/LinkPreview';
import { DropZone } from '../components/DropZone';
import { TraceMigrator } from '../components/TraceMigrator';
import { GlobalLiveArtifact } from '../components/GlobalLiveArtifact';
import { FreeInput } from '../components/FreeInput';
import { IngestionOverlay } from '../components/IngestionOverlay';
import { ExportAction } from '../components/ExportAction';
import { CrystallizeListener } from '../components/CrystallizeListener';
import { PanelSync } from '../components/PanelSync';
import { WeaveSync } from '../components/WeaveSync';
import { PageScopedChrome } from '../components/PageScopedChrome';
import { AiKeyMissingBanner } from '../components/AiKeyMissingBanner';
import { MigrationInstaller } from '../components/MigrationInstaller';
import { InterlaceInstaller } from '../components/InterlaceInstaller';
import { ArtifactSyncInstaller } from '../components/ArtifactSyncInstaller';


export const metadata = {
  title: 'Loom',
  description: 'Add sources and draft clear writing from them.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#070809' },
    { media: '(prefers-color-scheme: light)', color: '#070809' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{localStorage.removeItem('wiki:reading-mode');}catch(e){}try{var root=document.documentElement;var t=localStorage.getItem('wiki:theme');if(t==='light'){root.classList.add('light');root.classList.remove('dark');}else{root.classList.add('dark');root.classList.remove('light');}}catch(e){root.classList.add('dark');}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var onKey=function(e){if(e.key==='Tab')document.documentElement.classList.add('user-tabbing')};var clear=function(){document.documentElement.classList.remove('user-tabbing')};window.addEventListener('keydown',onKey,{passive:true});window.addEventListener('mousedown',clear,{passive:true});window.addEventListener('pointerdown',clear,{passive:true});}catch(e){}`,
          }}
        />
      </head>
      <body>
        <FocusLayerProvider>
        <div className="loom-grain" />
        <div className="loom-vignette" />
        <div className="layout">
          <div id="main" tabIndex={-1}>
            <AiKeyMissingBanner />
            {children}
            <GlobalLiveArtifact />
            <FreeInput />
          </div>
        </div>
        <CopyButtonInjector />
        <TraceMigrator />
        <KeyboardShortcuts />
        <LinkPreview />
        <DropZone />
        <PageScopedChrome />
        <IngestionOverlay />
        <ExportAction />
        <CrystallizeListener />
        <PanelSync />
        <WeaveSync />
        <MigrationInstaller />
        <InterlaceInstaller />
        <ArtifactSyncInstaller />
        </FocusLayerProvider>
      </body>
    </html>
  );
}
