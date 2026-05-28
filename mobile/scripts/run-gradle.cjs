const { spawnSync } = require("node:child_process");
const path = require("node:path");

const androidDir = path.resolve(__dirname, "..", "android");
const gradleExecutable =
    process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const result = spawnSync(gradleExecutable, process.argv.slice(2), {
    cwd: androidDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || "development",
    },
});

if (result.error) {
    console.error(result.error.message);
    process.exit(1);
}

process.exit(result.status ?? 1);
