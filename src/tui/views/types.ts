/**
 * View identifiers used by signal-based routing in the TUI app.
 * Keep names stable for testing and future routing expansions.
 *
 * @since 0.2.0
 */
export type View =
  | 'MainMenu'
  | 'Help'
  | 'InstallerWizard'
  | 'Updater'
  | 'Uninstaller'
  | 'Toolkit';

/**
 * Default view shown when the TUI starts.
 *
 * @since 0.2.0
 */
export const DEFAULT_VIEW: View = 'MainMenu';
