// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // X11 workaround (GDK_BACKEND=x11) on a 1x Wayland monitor: XWayland does not
    // scale, so an inherited GDK_SCALE=2 doubles the whole UI. Drop it for THIS
    // process only (GTK reads it at init). Opt out: ORKEST_KEEP_GDK_SCALE=1.
    #[cfg(target_os = "linux")]
    if std::env::var("GDK_BACKEND").is_ok_and(|b| b == "x11")
        && std::env::var_os("ORKEST_KEEP_GDK_SCALE").is_none()
    {
        // SAFETY: single-threaded, before any other code or GTK init.
        unsafe {
            std::env::remove_var("GDK_SCALE");
            std::env::remove_var("GDK_DPI_SCALE");
        }
    }
    orkest_lib::run()
}
