#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[cfg(debug_assertions)]
fn get_resource_path() -> String {
    std::path::Path::new("..").to_string_lossy().to_string()
}

#[cfg(not(debug_assertions))]
fn get_resource_path() -> String {
    let exe_path = std::env::current_exe().unwrap_or_default();
    let exe_dir = exe_path.parent().unwrap_or(std::path::Path::new("."));
    let resource_path = exe_dir.join("resources");
    if resource_path.exists() {
        resource_path.to_string_lossy().to_string()
    } else {
        exe_dir.to_string_lossy().to_string()
    }
}

fn start_backend() {
    let resource_path = get_resource_path();

    #[cfg(debug_assertions)]
    let node_path = std::path::PathBuf::from("../node/node.exe");
    #[cfg(not(debug_assertions))]
    let node_path = std::path::Path::new(&resource_path).join("node/node.exe");

    #[cfg(debug_assertions)]
    let backend_path = std::path::PathBuf::from("../backend/src/server.js");
    #[cfg(not(debug_assertions))]
    let backend_path = std::path::Path::new(&resource_path).join("backend/src/server.js");

    if !node_path.exists() {
        eprintln!("Node executable not found at {:?}", node_path);
        return;
    }

    if !backend_path.exists() {
        eprintln!("Backend server.js not found at {:?}", backend_path);
        return;
    }

    let node_str = node_path.to_string_lossy().to_string();
    let backend_str = backend_path.to_string_lossy().to_string();

    let _ = Command::new(&node_str)
        .arg(&backend_str)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn();
}

fn wait_for_backend() -> bool {
    let max_attempts = 17;
    let delay = Duration::from_millis(300);

    for attempt in 1..=max_attempts {
        match reqwest::blocking::get("http://127.0.0.1:3000/api/health") {
            Ok(response) => {
                if response.status().is_success() {
                    return true;
                }
            }
            Err(_) => {}
        }

        if attempt < max_attempts {
            thread::sleep(delay);
        }
    }

    false
}

fn main() {
    start_backend();

    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let result = wait_for_backend();
        let _ = tx.send(result);
    });

    let _ = rx.recv();

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
