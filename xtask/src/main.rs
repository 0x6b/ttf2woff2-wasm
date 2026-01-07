use std::{env, fs, process::Command};

fn main() {
    let task = env::args().nth(1);
    match task.as_deref() {
        Some("build") => build(false),
        Some("build-dev") => build(true),
        Some("test") => test(),
        Some("clean") => clean(),
        _ => print_help(),
    }
}

fn build(dev: bool) {
    let root = project_root();
    
    let mut args = vec!["build", "--target", "nodejs"];
    if dev {
        args.push("--dev");
    } else {
        args.push("--release");
    }

    run("wasm-pack", &args);

    // Copy JS wrapper files to pkg (overwrite wasm-pack's package.json with ours)
    let js_src = root.join("js");
    let pkg = root.join("pkg");
    
    for file in &["index.js", "index.d.ts", "package.json"] {
        fs::copy(js_src.join(file), pkg.join(file))
            .unwrap_or_else(|e| panic!("failed to copy {file}: {e}"));
    }

    // Copy README and licenses from root
    for file in &["README.md", "LICENSE-MIT", "LICENSE-APACHE"] {
        fs::copy(root.join(file), pkg.join(file))
            .unwrap_or_else(|e| panic!("failed to copy {file}: {e}"));
    }

    println!("Build complete. Package ready in pkg/");
}

fn test() {
    build(false);
    run("node", &["tests/test.cjs"]);
}

fn clean() {
    let _ = fs::remove_dir_all("pkg");
    let _ = fs::remove_dir_all("target");
    println!("Cleaned pkg/ and target/");
}

fn print_help() {
    eprintln!(
        r#"Usage: cargo xtask <TASK>

Tasks:
  build       Build for npm (release)
  build-dev   Build for development
  test        Run tests
  clean       Remove pkg/ and target/
"#
    );
}

fn run(cmd: &str, args: &[&str]) {
    let status = Command::new(cmd)
        .args(args)
        .current_dir(project_root())
        .status()
        .unwrap_or_else(|e| panic!("failed to run `{cmd}`: {e}"));

    if !status.success() {
        std::process::exit(status.code().unwrap_or(1));
    }
}

fn project_root() -> std::path::PathBuf {
    let dir = env!("CARGO_MANIFEST_DIR");
    std::path::PathBuf::from(dir)
        .parent()
        .expect("xtask should be in project root")
        .to_path_buf()
}
