// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Linux/X11 environment fix (ORKEST-FIX-2, item 1): this machine runs Hyprland at
    // 1x scale, and the app renders under XWayland. Inherited user env breaks it in
    // two ways: GDK_SCALE=2 doubles the whole UI, and WebKitGTK's DMABUF renderer
    // opens a plain grey (#353535) webview. Both must be fixed BEFORE GTK/WebKit init.
    // We no longer depend on the user's shell env: set it in-process here.
    // Opt out entirely: ORKEST_KEEP_ENV=1 (this process then inherits as before).
    #[cfg(target_os = "linux")]
    if std::env::var_os("ORKEST_KEEP_ENV").is_none() {
        // SAFETY: single-threaded, before any other code or GTK init.
        unsafe {
            std::env::set_var("GDK_BACKEND", "x11"); // XWayland does not scale like Wayland
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            std::env::remove_var("GDK_SCALE");
            std::env::remove_var("GDK_DPI_SCALE");
        }
    }
    orkest_lib::run()
}
